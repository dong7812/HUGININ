# HUGININ 시스템 구성 요소

## 방향성 요약

**북극성**: collab-proof Frame A/B/C/D를 팀 스케일로.
지금(Phase 1)은 자동 수집 + 팀 타임라인. 다음(Phase 2)은 결정 단위 AI 기여도 분석.

---

## 현재 아키텍처 (Phase 1)

```
[Claude Code / MCP 호환 도구]
     │
     ├── recall_decisions (MCP)   ← 구현 시작 전 자동 호출
     │     └── GET /memory/recall?q=...
     │           └── fastembed 임베딩 → pgvector cosine search
     │               → workspace_members JOIN (cross-workspace)
     │
     └── collect_event (MCP / Git hook post-commit)
           └── POST /collect/event
                 ├── PII 마스킹 (RegexPiiMasker)
                 ├── PostgreSQL 저장
                 └── asyncio.create_task(_embed_async)  ← 백그라운드
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
     ├── 팀 AI 결정 타임라인
     ├── 텍스트 검색 (ILIKE) + 시맨틱 검색 (pgvector)
     ├── 시간 범위 / 브랜치 필터
     └── 팀 코멘트
```

---

## Phase 2 아키텍처 (예정)

Phase 1에서 수집된 `raw_prompt + raw_response + diff`를 입력으로
Frame A/B/C/D 분석을 서버에서 실행한다.

```
collect_event 저장 완료
     │
     └── asyncio.create_task(_frame_analysis_async)  ← Phase 2 추가
           └── FrameAnalysisService.analyze(prompt, response, diff)
                 └── Claude API (structured output)
                       → frame_a: 0.0–1.0
                       → frame_b: 0.0–1.0
                       → frame_c: 0.0–1.0
                       → frame_d: 0.0–1.0
                 └── UPDATE decision_events SET frame_a=..., frame_d=...
```

현재 collab-proof 스킬은 Claude Code 세션에서 개인 단위로 이 분석을 수행한다.
Phase 2에서는 서버가 자동으로 모든 이벤트에 대해 실행한다.

---

## 수집 경로

### 경로 1: Git Hook (post-commit, 권장)

```bash
git commit -m "feat: add rate limiting"
# → huginin hook → POST /collect/event
#   { raw_prompt, raw_response, diff, branch, commit_hash }
```

### 경로 2: MCP collect_event

Claude Code가 직접 호출. 커밋 없는 세션에서도 수집 가능.

### git 엣지 케이스

| 케이스 | 처리 |
|---|---|
| rebase / squash / amend | hash-map.json에 원본 해시 보존 |
| force push | diverged history 감지 → reconcile 플래그 |
| CI/CD 환경 | CI=true 감지 → 수집 자동 건너뜀 |
| 동시 AI 도구 | session.lock으로 충돌 방지 |

---

## 임베딩 파이프라인

**모델**: fastembed BAAI/bge-small-en-v1.5 (384-dim)

- CPU-only, 로컬 실행, 무료
- lazy singleton — 첫 요청 시 로드
- `asyncio.run_in_executor(None, ...)` — CPU 작업 이벤트 루프 외부 실행
- `asyncio.create_task(_embed_async)` — 수집 API 응답 후 백그라운드 실행
- asyncpg 바인딩: `list[float]` → `"[x,y,z,...]"` 문자열 + `$1::vector` 캐스트

---

## 백엔드 계층 구조

```
domain/
  entities/           # DecisionEvent, Workspace, User ...
  repositories/       # 인터페이스 (추상)

application/
  use_cases/          # CollectEventUseCase, GetFeedUseCase ...

infrastructure/
  persistence/        # PgEventRepository ...
  embedding/          # EmbeddingService (fastembed)
  security/           # JwtService, Argon2PasswordService, RegexPiiMasker
  messaging/          # KafkaProducer

interfaces/
  http/routers/       # FastAPI 라우터
  mcp/                # FastApiMCP 마운트
```

---

## 대시보드 구조

```
WorkspaceDashboard (Client)   ← timeRange + searchQuery state
  ├── OverviewCards           시간 범위 필터 버튼 (오늘/이번 주/전체)
  ├── DecisionTimeline        이벤트 피드 + 검색 + diff 뷰 + 코멘트
  └── TokenChart              토큰 사용량 차트
```

**서버 상태**: TanStack Query 5 (`useFeedQuery`, `useSearchQuery`)
**클라이언트 상태**: Zustand 5 (워크스페이스 ID, 인증 토큰)
