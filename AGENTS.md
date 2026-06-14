# HUGININ 시스템 구성 요소

## 아키텍처 개요

```
[Claude Code / Cursor / MCP 호환 도구]
     │
     ├── recall_decisions (MCP)   ← 구현 시작 전 자동 호출
     │     └── GET /memory/recall?q=...
     │           └── fastembed 임베딩 → pgvector cosine search
     │               → workspace_members JOIN (cross-workspace)
     │
     └── collect_event (MCP / Git hook)
           └── POST /collect/event
                 ├── PII 마스킹 (RegexPiiMasker)
                 ├── PostgreSQL 저장
                 └── asyncio.create_task(_embed_async)
                       └── fastembed → pgvector 업데이트 (백그라운드)
     │
     ▼
[FastAPI 서버]
     ├── Clean Architecture
     │     domain → application → infrastructure ← interfaces
     ├── PostgreSQL + pgvector (HNSW, cosine, 384-dim)
     └── Kafka (수집 이벤트 비동기 처리)
     │
     ▼
[Next.js Dashboard]
     ├── 의사결정 타임라인 (diff + response + commit)
     ├── 텍스트 검색 (ILIKE)
     ├── 시간 범위 필터 (오늘/이번 주/전체)
     └── 팀 코멘트
```

---

## 1. MCP 수집 인터페이스

**역할**: AI 의사결정을 팀 지식베이스에 저장하는 두 가지 경로.

### 경로 1: Git Hook (post-commit, 권장)

```bash
# post-commit hook이 자동 실행
git commit -m "feat: add rate limiting"
# → huginin hook → POST /collect/event
#   { raw_prompt, raw_response, diff, branch, commit_hash }
```

- 개발자 의식 없이 모든 커밋 자동 수집
- PII 마스킹 선처리 후 서버 전송

### 경로 2: MCP collect_event

- Claude Code가 직접 `collect_event` 호출 가능
- 커밋 없는 세션에서도 수집 가능

### git 엣지 케이스 처리

| 케이스 | 처리 |
|---|---|
| rebase / squash / amend | hash-map.json에 원본 해시 보존 |
| force push | diverged history 감지 → reconcile 플래그 |
| Monorepo | projects.json 경로 규칙으로 프로젝트별 라우팅 |
| CI/CD 환경 | CI=true 감지 → 수집 자동 건너뜀 |
| 동시 AI 도구 | session.lock으로 충돌 방지 |

---

## 2. MCP recall_decisions

**역할**: Claude가 구현 시작 전 팀 이력을 능동적으로 조회.

```
GET /memory/recall?q=rate+limiting&limit=5
→ fastembed.embed(q) → 384-dim vector
→ pgvector cosine search
→ JOIN workspace_members (사용자 소속 전체 워크스페이스)
→ TOP-5 유사 이벤트 반환
```

**MCP description에 명시**: "non-trivial implementation 시작 전 호출할 것" — Claude가 자동으로 참조하도록 지시문 삽입.

---

## 3. 임베딩 파이프라인

**모델**: fastembed BAAI/bge-small-en-v1.5 (384-dim)

- CPU-only, 로컬 실행, 무료
- lazy singleton — 첫 요청 시 모델 로드, 이후 재사용
- `asyncio.run_in_executor(None, ...)` — CPU 작업을 이벤트 루프 외부 실행
- `asyncio.create_task(_embed_async)` — 수집 API 응답 후 백그라운드 임베딩 생성

**asyncpg 바인딩**: `list[float]` → `"[x,y,z,...]"` 문자열 + `$1::vector` 캐스트.

---

## 4. 백엔드 계층 구조 (Clean Architecture)

```
domain/
  entities/           # DecisionEvent, Workspace, User ...
  repositories/       # 인터페이스 (추상)

application/
  use_cases/          # CollectEventUseCase, GetFeedUseCase ...

infrastructure/
  persistence/        # PgEventRepository, PgWorkspaceRepository ...
  embedding/          # EmbeddingService (fastembed)
  security/           # JwtService, Argon2PasswordService, RegexPiiMasker
  messaging/          # KafkaProducer

interfaces/
  http/routers/       # FastAPI 라우터
  mcp/                # FastApiMCP 마운트
```

---

## 5. 대시보드 구조

**클라이언트 상태 (Zustand 5)**: 워크스페이스 ID, 인증 토큰
**서버 상태 (TanStack Query 5)**: 피드, 검색 결과, 통계

**WorkspaceDashboard**: 클라이언트 wrapper — `timeRange`와 `searchQuery` state를 OverviewCards + DecisionTimeline에 공유.

```
WorkspaceDashboard (Client)
  ├── OverviewCards          시간 범위 필터 (오늘/이번 주/전체)
  ├── DecisionTimeline       이벤트 피드 + 검색 + diff 뷰
  └── TokenChart             토큰 사용량 차트
```

---

## 6. 보안 고려사항

- PII 마스킹: 수집 시 API Key, 민감 패턴 필터링 (RegexPiiMasker)
- JWT 인증: 모든 API 엔드포인트에 적용
- RBAC 2단계: 워크스페이스 레벨 + 프로젝트 레벨
- CORS: 개발 환경 localhost:3000만 허용 (프로덕션에서 변경 필요)
