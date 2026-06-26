# HUGININ Architecture

**Git이 코드 이력을 남기듯, HUGININ은 AI 결정 이력을 남긴다.**

---

## 시스템 개요

```
[사용자 로컬]
  huginin (TUI)
    ├─ Claude Code / agy / codex  ← PTY로 실행, Ctrl+\ 전환
    └─ post-commit hook           ← 커밋 시 자동 발화
         │  huginin import <file> ← 문서 임포트
         ▼
[Railway — FastAPI 서버]
    ├─ POST /collect/event        ← 커밋 이벤트
    ├─ POST /{id}/import-doc      ← 문서 ETL
    ├─ GET  /feed, /search        ← 대시보드 데이터
    └─ SSE  /mcp                  ← Claude MCP 어댑터
         │
         ├─ PostgreSQL + pgvector
         └─ Claude Haiku (ETL)
              │
[Vercel — Next.js 대시보드]
    ├─ 결정 타임라인 (코드 이력 탭)
    ├─ 문서 탭 (검토 큐 + 인라인 카드)
    └─ 시맨틱 검색 + AI 브리핑
```

---

## 1. CLI (Go 1.22)

```
cli/
├─ main.go
├─ interfaces/
│   ├─ cli/          ← Cobra 커맨드
│   │   ├─ root.go
│   │   ├─ setup_cmd.go      — git hook 설치 + 프로젝트 연결
│   │   ├─ hook_cmd.go       — post-commit hook 실행 진입점
│   │   ├─ import_cmd.go     — huginin import <file>
│   │   ├─ backfill_cmd.go   — 과거 커밋 소급 수집
│   │   ├─ login_cmd.go / logout_cmd.go
│   │   ├─ use_cmd.go        — 활성 AI 도구 전환 (claude-code|codex|gemini)
│   │   └─ workspace_cmd.go
│   └─ tui/          ← Bubble Tea TUI
│       ├─ session.go        — 커맨드 라우팅 (import, backfill, help 등)
│       └─ multiplexer.go    — PTY 멀티플렉서 (Ctrl+\ 로 AI 전환)
├─ application/
│   ├─ login_use_case.go
│   ├─ project_use_case.go
│   └─ workspace_use_case.go
├─ domain/           ← auth, project, workspace 엔티티
└─ infrastructure/
    ├─ config/       ← ~/.huginin/config 파일 기반 설정
    ├─ http/         ← API 클라이언트 (서버 통신)
    └─ keystore/     ← 로컬 토큰 저장
```

### 주요 흐름

**커밋 수집**
```
git commit
  → .git/hooks/post-commit
    → huginin hook
      → AI 도구별 세션 JSONL 파싱 (8시간 윈도우)
        → POST /collect/event
          { commit_hash, raw_prompt, raw_response, diff, ai_tool, branch }
```

**TUI 진입**
```
huginin (인수 없음)
  → Bubble Tea TUI 시작
  → multiplexer.go: claude-code | agy | codex 중 선택 후 PTY 실행
  → Ctrl+\: 다음 AI로 전환 (컨텍스트 이어받기)
  → 내장 커맨드: import / backfill / help 등은 session.go에서 처리
```

**문서 임포트**
```
huginin import DECISIONS.md
  → # / ## / ### 헤딩 기준 섹션 분리
  → 각 섹션마다 POST /workspace/{id}/import-doc
    { section_text, doc_path }
```

---

## 2. 서버 (FastAPI + Python 3.12)

Clean Architecture 4계층 구조.

```
server/
├─ domain/
│   └─ entities/
│       ├─ event.py      ← DecisionEvent (핵심 엔티티)
│       ├─ user.py
│       └─ workspace.py
├─ application/
│   ├─ ports/            ← 외부 의존 인터페이스 (password, token, pii, queue)
│   └─ use_cases/
│       ├─ auth/         — register, login
│       ├─ collect/      — collect_event, import_doc
│       ├─ dashboard/    — get_feed, get_overview, get_activity, get_token_stats, ...
│       ├─ workspace/    — create, join, invite, change_role
│       └─ project/      — link, set_permission
├─ infrastructure/
│   ├─ persistence/
│   │   ├─ migrations/   ← SQL 마이그레이션 (서버 시작 시 자동 적용)
│   │   └─ repositories/ ← asyncpg 구현체
│   │       └─ pg_event_repository.py  ← 핵심 쿼리 집중
│   ├─ embedding/        ← fastembed (paraphrase-multilingual-MiniLM-L12-v2)
│   ├─ llm/              ← Anthropic API (Haiku ETL, Sonnet 브리핑·검색)
│   ├─ security/         ← JWT, Argon2, PII 마스킹
│   └─ smtp/
└─ interfaces/
    ├─ http/
    │   ├─ routers/      ← 라우터별 파일 (auth, collect, dashboard, import, mcp, ...)
    │   └─ middleware/   ← RBAC
    └─ mcp/
        └─ mcp_adapter.py  ← SSE MCP 어댑터
```

### ETL 파이프라인

**커밋 이벤트 ETL**
```
POST /collect/event
  → save (status=pending)
  → 백그라운드: Claude Haiku
      추출 필드:
        what_was_built    — 무엇을 만들었나
        problem_solved    — 왜 필요했나
        ai_role           — AI의 역할
        tradeoffs         — 검토했으나 버린 대안
        frame             — A(Human-led) | B(AI-assisted) | C(AI-led) | D(Automated)
        ai_contribution   — 0.0–1.0
        decision_summary  — 1줄 요약
  → save (status=refined)
  → fastembed 임베딩 → pgvector 저장
```

**문서 임포트 ETL**
```
POST /workspace/{id}/import-doc
  → save_doc (source_type='doc', validation_status='pending')
  → 백그라운드: Claude Haiku
      1. 코드베이스 grep → 관련 스니펫 추출
      2. 추출:
           what_was_decided  — 결정 요약
           why               — 이유
           alternatives      — 검토된 대안
           constraints       — 제약 조건
      3. 코드 스니펫과 대조 → validation_status 결정:
           consistent    — 코드에서 확인됨
           outdated      — 코드와 불일치
           unverifiable  — 코드에서 확인 불가 (추상적 결정)
  → fastembed 임베딩 → pgvector 저장
```

### MCP 어댑터

`recall_across_workspaces()` 도구를 SSE MCP 프로토콜로 노출.
- `validation_status IN ('pending', 'outdated', 'rejected')` 레코드는 검색 제외
- `reviewed`, `consistent`, `unverifiable` 레코드만 Claude 컨텍스트에 주입

```json
// Claude Desktop .mcp.json
{
  "mcpServers": {
    "huginin": {
      "url": "https://api.huginin.com/mcp",
      "type": "sse",
      "headers": { "Authorization": "Bearer <service-token>" }
    }
  }
}
```

---

## 3. 데이터베이스

PostgreSQL + pgvector (Railway 호스팅).

### decision_events (핵심 테이블)

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | UUID PK | |
| workspace_id | UUID FK | |
| user_id | UUID FK | |
| commit_hash | VARCHAR(64) UNIQUE | 커밋 이벤트 멱등성 키 |
| raw_prompt | TEXT | AI에게 보낸 전체 프롬프트 |
| raw_response | TEXT | AI 응답 |
| diff | TEXT | git diff |
| status | ENUM | pending \| processing \| refined \| failed |
| embedding | vector(384) | fastembed HNSW cosine |
| frame | VARCHAR | A \| B \| C \| D |
| ai_contribution | FLOAT | 0.0–1.0 |
| decision_summary | TEXT | ETL 1줄 요약 |
| ai_tool | VARCHAR | claude-code \| codex \| gemini |
| event_type | VARCHAR | commit \| pr_opened \| pr_merged \| doc_import |
| **source_type** | VARCHAR | **commit \| doc** (타임라인 탭 분기) |
| **validation_status** | VARCHAR | **pending \| consistent \| outdated \| unverifiable \| reviewed \| rejected** |
| **doc_path** | TEXT | 임포트 원본 파일 경로 |
| created_at | TIMESTAMPTZ | |

### 기타 테이블

| 테이블 | 역할 |
|---|---|
| users | 이메일·이름·구글 OAuth |
| workspaces | 팀 단위 격리 |
| workspace_members | role: owner \| member \| viewer |
| projects | 레포 연결 (project_path) |
| decision_comments | 이벤트별 코멘트 |
| invite_codes | 워크스페이스 초대 |
| cli_auth_sessions | CLI 로그인 폴링 세션 |

### 인덱스

```sql
-- 벡터 검색
CREATE INDEX ON decision_events USING hnsw (embedding vector_cosine_ops);
-- 타임라인 페이지네이션
CREATE INDEX ON decision_events (workspace_id, created_at DESC);
-- 커밋 멱등성
CREATE INDEX ON decision_events (commit_hash) WHERE commit_hash IS NOT NULL;
```

---

## 4. 대시보드 (Next.js 16, React 19)

Clean Architecture 4계층.

```
dashboard/src/
├─ domain/
│   ├─ entities.ts    ← FeedItem, DocItem, OverviewStats, ...
│   └─ ports.ts       ← IDashboardRepository 인터페이스
├─ application/
│   ├─ queries/       ← TanStack Query 5 훅 (dashboardQueries.ts)
│   └─ stores/        ← Zustand (authStore, workspaceStore)
├─ infrastructure/
│   └─ http/
│       ├─ apiClient.ts
│       ├─ dashboardRepository.ts  ← IDashboardRepository 구현
│       └─ commentRepository.ts
├─ presentation/
│   └─ components/
│       ├─ WorkspaceDashboard.tsx  ← 레이아웃 루트
│       ├─ DecisionTimeline.tsx    ← "코드 이력" | "문서" 탭 토글
│       ├─ OverviewCards.tsx       ← 통계 카드 + 기간 필터
│       ├─ AiTrendChart.tsx        ← AI 도구별 추이
│       ├─ FrameStats.tsx          ← A/B/C/D 분포
│       ├─ TokenChart.tsx          ← 토큰 사용량
│       ├─ CacheSuggestions.tsx    ← 컨텍스트 재사용 제안
│       ├─ DecisionChat.tsx        ← 시맨틱 검색 채팅 (플로팅)
│       ├─ PmBriefing.tsx          ← AI 브리핑 생성
│       └─ OnboardingModal.tsx     ← 첫 방문 스팟라이트 투어
└─ app/
    ├─ page.tsx                    ← 랜딩 페이지
    ├─ workspace/[id]/page.tsx     ← 워크스페이스 대시보드
    └─ workspace/[id]/docs/page.tsx ← 문서 전체 검토 페이지
```

### DecisionTimeline 탭 구조

```
DecisionTimeline
  ├─ "코드 이력" 탭
  │   → source_type != 'doc' 필터 (서버 쿼리 레벨)
  │   → 커밋별 FeedItem 카드 (frame, ai_contribution, 요약)
  │   → 무한 스크롤 페이지네이션
  └─ "문서" 탭  (pending 건수 뱃지)
      → DocListView
        ├─ 상태 필터: 전체 | 검토대기 | 승인 | 불일치
        ├─ 인라인 expandable 카드
        │   (why, alternatives, constraints, 원본 섹션)
        └─ "전체 검토 페이지 →" 링크
```

---

## 5. 배포

| 서비스 | 플랫폼 | 비고 |
|---|---|---|
| API 서버 | Railway | `railway up --detach` 수동 재배포, 마이그레이션 서버 시작 시 자동 적용 |
| 대시보드 | Vercel | `main` 브랜치 푸시 시 자동 배포 |
| PostgreSQL | Railway | pgvector 플러그인 활성화 |
| CLI 바이너리 | Vercel (정적) | `dashboard/public/cli/` — darwin/linux × arm64/amd64 |

### CLI 배포 구조

```
dashboard/public/cli/
├─ install.sh                       ← curl | bash 설치 스크립트
├─ huginin_darwin_arm64.tar.gz      ← 내부 바이너리 이름: huginin
├─ huginin_darwin_amd64.tar.gz
├─ huginin_linux_arm64.tar.gz
└─ huginin_linux_amd64.tar.gz
```

install.sh가 `huginin`이라는 이름의 바이너리를 기대하므로 tarball 패킹 시 반드시 리네임:
```bash
cp huginin_${p} huginin && tar czf huginin_${p}.tar.gz huginin
```

---

## 6. 기술 스택 요약

| 레이어 | 기술 |
|---|---|
| CLI | Go 1.22, Cobra, Bubble Tea, PTY |
| 서버 | FastAPI, asyncpg, Python 3.12 |
| LLM (ETL) | Claude Haiku (claude-haiku-4-5) |
| LLM (검색·브리핑) | Claude Sonnet |
| 임베딩 | fastembed — paraphrase-multilingual-MiniLM-L12-v2 (384-dim, CPU-only, 다국어) |
| DB | PostgreSQL + pgvector (HNSW cosine) |
| 대시보드 | Next.js 16, React 19, TanStack Query 5, Zustand |
| 인증 | JWT (RS256), Google OAuth, Argon2 비밀번호 해싱 |
| MCP | SSE MCP 어댑터 (`/mcp` 엔드포인트) |
| 배포 | Railway (서버+DB) + Vercel (대시보드+CLI 바이너리) |

---

## 7. 알려진 제약 및 갭

| 항목 | 현황 |
|---|---|
| 리임베딩 | 문서 검토 시 `what_was_decided`/`why` 편집 저장은 되나, 임베딩은 재생성되지 않음 |
| MCP 필터 실효성 | `.mcp.json` 미설정 시 `validation_status` 승인이 실제 필터링에 영향 없음 |
| 사용자 이름 수정 | `PATCH /auth/me` 엔드포인트 미구현, 이름 변경 UI 없음 |
| Railway DB 직접 접근 | Railway DB는 Railway 네트워크 내부 전용, `railway run python3` 로컬 실행 시 연결 불가 |
