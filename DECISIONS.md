# DECISIONS.md

---

## [2026-06-14] MCP Recall Tool: `/memory/recall` 설계

**Context**: Claude Code가 팀 이력을 "능동적으로" 참조하게 하려면 MCP 도구가 필요. 단순 수집(collect_event)에서 역방향 조회 도구를 추가하는 구조 결정.

**Decision**: `GET /memory/recall?q=...` 엔드포인트를 MCP 도구로 노출. FastApiMCP `include_operations`에 `recall_decisions_memory_recall_get` 추가.

**Alternatives considered**:
- 대시보드 UI를 통한 수동 검색 — 개발자가 직접 찾아야 함, Claude가 자동 참조 불가
- Claude의 기본 Memory 기능 — 개인 단위 기억, 팀 공유 불가, cross-workspace 검색 불가

**Reasoning**:
- MCP 도구는 Claude가 "구현 시작 전" 자동으로 호출할 수 있음 — 개발자 의식 없이 팀 이력 참조
- `fastapi-mcp`의 `include_operations`로 기존 FastAPI 엔드포인트를 MCP 도구로 그대로 노출 가능
- docstring을 MCP description으로 활용 — "non-trivial implementation 시작 전 호출할 것" 지시문 삽입
- inferred: 팀원이 직접 검색하지 않아도 Claude가 자동 참조하므로 지식베이스 활용률 극대화

**AI contribution**:
- Identified: MCP description에 "언제 호출할지" 명시하면 Claude가 더 적극적으로 참조함
- Suggested: `recall_across_workspaces` — 단일 워크스페이스가 아닌 사용자 소속 전체 워크스페이스 검색
- Developer-driven: MCP-first 아키텍처 전환 결정

**Intent class**: FEATURE_BUILDING
**Signal score**: HIGH
**Outcome**: implemented

---

## [2026-06-14] 임베딩 모델: OpenAI ada-002 vs fastembed BAAI/bge-small-en-v1.5

**Context**: 시맨틱 검색을 위한 임베딩 생성. 기존 스키마는 vector(1536) — OpenAI ada-002 차원으로 설계되어 있었음.

**Decision**: fastembed `BAAI/bge-small-en-v1.5` (384-dim) 채택. DB 마이그레이션 `003_embedding_384.sql`로 `vector(1536)` → `vector(384)` 변경.

**Alternatives considered**:
- OpenAI `text-embedding-ada-002` (1536-dim) — 높은 품질, 그러나 API 비용 발생, 외부 의존성
- `text-embedding-3-small` (1536-dim) — ada-002 후속, 여전히 유료

**Reasoning**:
- fastembed는 CPU-only로 로컬 실행 — API 비용 0, 레이턴시 외부 의존성 없음
- BAAI/bge-small-en-v1.5는 MTEB 벤치마크에서 동급 최고 성능 대비 384-dim으로 충분
- 384-dim HNSW 인덱스가 1536-dim보다 빠르고 저장 공간 효율적
- asyncio.run_in_executor로 CPU 작업을 이벤트 루프 외부 실행 — 비동기 안전
- inferred: MVP 단계에서 무료 로컬 임베딩으로 시맨틱 검색 품질 검증 후 필요 시 교체

**AI contribution**:
- Identified: asyncpg가 Python list를 pgvector에 직접 바인드 불가 — `_vec_str()` 헬퍼 필요
- Identified: `asyncio.create_task()`로 임베딩 생성을 백그라운드로 분리해야 수집 API 레이턴시 유지
- Developer-driven: fastembed 선택 방향

**Intent class**: FEATURE_BUILDING
**Signal score**: HIGH
**Outcome**: implemented (`003_embedding_384.sql`, `embedding_service.py`)

---

## [2026-06-14] asyncpg pgvector 바인딩: list 직접 전달 vs 문자열 직렬화

**Context**: asyncpg는 Python `list[float]`를 pgvector 컬럼에 직접 바인드 시 `TypeError: expected str, got list` 오류 발생.

**Decision**: `_vec_str()` static method로 `list[float]` → `"[x,y,z,...]"` 문자열 변환, SQL에서 `$1::vector` 명시적 캐스트 사용.

**Alternatives considered**:
- psycopg2/psycopg3 사용 — pgvector Python 타입 지원, 그러나 asyncpg 전면 교체 비용
- asyncpg custom codec 등록 — 복잡도 증가

**Reasoning**:
- 가장 단순한 해결책 — 헬퍼 1개 추가, SQL에 `::vector` 캐스트만 추가
- asyncpg의 다른 장점(성능, Pool API) 유지
- inferred: pgvector 관련 모든 쿼리에서 일관적으로 적용 가능

**AI contribution**:
- Identified: 오류 원인 — asyncpg의 pgvector 타입 미지원
- Suggested: `"[" + ",".join(str(x) for x in embedding) + "]"` + `::vector` 캐스트 패턴

**Intent class**: BUG_FIXING
**Signal score**: HIGH
**Outcome**: fixed (`_vec_str()`, `update_embedding()`, `recall_across_workspaces()`)

---

## [2026-06-14] OverviewCards 재설계: 5개 통계 카드 vs 시간 범위 필터 버튼

**Context**: 기존 OverviewCards는 총 이벤트 수, 활성 브랜치 수 등 5개 정적 카드. 정보는 있지만 클릭해도 아무 행동이 없어 UI 노이즈였음.

**Decision**: 컴팩트한 필터 버튼 3개(오늘/이번 주/전체)로 교체. 선택한 범위가 타임라인과 차트에 직접 적용.

**Alternatives considered**:
- 카드 유지 + 클릭 시 필터 적용 — 카드가 필터처럼 작동하나 의미 전달이 불명확

**Reasoning**:
- 통계 숫자는 맥락 없이 의미 없음 — "총 47개"가 많은지 적은지 판단 불가
- 시간 범위 필터는 즉각적 액션 — 클릭 → 타임라인 변경이 직관적
- WorkspaceDashboard 클라이언트 wrapper가 `timeRange` state를 OverviewCards와 DecisionTimeline에 공유
- inferred: 필터가 차트 days 파라미터도 제어하면 단일 컨트롤로 전체 뷰 동기화

**AI contribution**:
- Identified: 정적 통계 카드는 "보기만 하고 아무것도 안 하는" UX 문제 지적
- Suggested: 시간 범위 필터로 전환 + WorkspaceDashboard state lifting

**Intent class**: REFACTORING
**Signal score**: HIGH
**Outcome**: implemented (`OverviewCards.tsx`, `WorkspaceDashboard.tsx`)

---

## [2026-06-14] 대시보드 검색: ILIKE vs pgvector 시맨틱 검색

**Context**: 타임라인에서 검색 기능 추가. raw_prompt와 raw_response를 검색 대상으로.

**Decision**: 대시보드 UI 검색은 ILIKE(`%query%`)로 구현. MCP recall_decisions는 pgvector 시맨틱 검색 사용.

**Alternatives considered**:
- 대시보드도 pgvector 시맨틱 검색 — 더 정확하나 쿼리마다 임베딩 생성 필요

**Reasoning**:
- 대시보드 검색은 개발자가 키워드를 알고 찾는 경우 — ILIKE로 충분
- MCP recall은 "비슷한 문제"를 찾는 경우 — 시맨틱 필요
- ILIKE는 임베딩 생성 불필요 — 즉시 응답, 구현 단순
- `useSearchQuery` hook은 `query.trim().length >= 2` 조건으로 불필요한 API 호출 방지

**AI contribution**:
- Suggested: 2자 이상 트리거, X 버튼으로 초기화, 검색 중 브랜치 필터 숨김 패턴

**Intent class**: FEATURE_BUILDING
**Signal score**: HIGH
**Outcome**: implemented (`/dashboard/{ws}/search` 엔드포인트, `useSearchQuery`)

---

## [2026-06-14] MCP FastApiMCP include_operations 이름 규칙

**Context**: `FastApiMCP(include_operations=["collect_event", "recall_decisions"])` 사용 시 도구가 노출되지 않음.

**Decision**: FastAPI가 생성하는 전체 operation ID 형식(`{함수명}_{라우터경로_HTTP메서드}`) 사용.

**Alternatives considered**:
- 짧은 이름 — FastAPI operation ID와 불일치

**Reasoning**:
- FastAPI는 함수명 + 경로 + 메서드 조합으로 operation ID 자동 생성
- `collect_event_collect_event_post`, `recall_decisions_memory_recall_get` 형식 사용

**AI contribution**:
- Identified: FastAPI operation ID 명명 규칙 불일치가 도구 미노출 원인임을 진단

**Intent class**: BUG_FIXING
**Signal score**: HIGH
**Outcome**: fixed (`mcp_adapter.py`)

---

## [2026-06-14] Kafka 도입 시점: MSK 프로비저닝 vs Serverless 시작

**Context**: Amazon MSK(Kafka)를 Ingestion Queue로 확정했으나, 프로비저닝 브로커는 트래픽 0일 때도 ~$500/월 고정비 발생. Phase 1 시점에는 실 사용자 없음.

**Decision**: Phase 1~2는 MSK Serverless(메시지당 과금)로 시작. 일 100만 이벤트 초과 시점에 프로비저닝 전환.

**Alternatives considered**: MSK 프로비저닝 브로커 즉시 도입 — 운영 단순화, 최대 처리량 확보

**Reasoning**:
- MSK Serverless는 토픽 구조·컨슈머 그룹 API가 프로비저닝과 동일 — 전환 시 연결 엔드포인트만 교체
- 초기 고정비 ~$500/월 절감으로 PMF 검증 전 런웨이 확보
- inferred: 아키텍처 변경 없이 전환 가능하므로 도입 시점을 늦추는 것이 순수 이득

**AI contribution**:
- Identified: MSK 프로비저닝 고정비가 초기 단계 런웨이 리스크임을 지적
- Suggested: Serverless 시작 → 프로비저닝 전환 경로 (코드 변경 없음)
- Developer-driven: Kafka 아키텍처 자체 선택

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented

---

## [2026-06-14] Neo4j 도입 시점: Phase 1 즉시 vs Phase 3 이후

**Context**: Decision Graph를 Neo4j AuraDB로 구현하기로 확정했으나, Phase 1~2에는 그래프로 탐색할 의사결정 데이터가 존재하지 않음.

**Decision**: Phase 1~2는 PostgreSQL `WITH RECURSIVE` CTE로 그래프 쿼리 임시 대응. Phase 3 시점에 Neo4j AuraDB 추가, Kafka 컨슈머 그룹 D 활성화.

**Alternatives considered**: Neo4j Phase 1 즉시 도입 — 처음부터 Cypher로 일관된 그래프 쿼리

**Reasoning**:
- 데이터가 없으면 그래프 탐색 자체가 불가 — Phase 3 전 Neo4j는 운영 비용만 발생
- PostgreSQL CTE는 수 단계 깊이의 경로 탐색까지 충분히 커버
- inferred: Kafka 컨슈머 그룹 D를 Phase 3에 활성화하면 기존 이벤트 리플레이로 과거 데이터 소급 적재 가능

**AI contribution**:
- Identified: Phase 1~2에 Neo4j 유지 비용이 발생하는 구조적 낭비 지적
- Suggested: PostgreSQL CTE 임시 대응 → 컨슈머 그룹 D 활성화 전환 경로
- Developer-driven: Neo4j 최종 채택 방향 유지 결정

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented

---

## [2026-06-14] MCP 서버 런타임: TypeScript vs FastAPI

**Context**: MCP 서버 구현 언어 선택. Claude Code가 HUGININ에 JSON-RPC로 연결하며, 동일 서버가 LLM 정제 API도 처리해야 함.

**Decision**: FastAPI (Python) + `fastapi-mcp` 라이브러리 채택. 단일 서비스로 MCP 엔드포인트 + REST API 통합.

**Alternatives considered**: TypeScript `@modelcontextprotocol/sdk` — MCP 공식 SDK, Node.js 기반

**Reasoning**:
- `fastapi-mcp` 패키지: 기존 FastAPI 앱에 import 하나로 MCP 서버화 가능
- MCP + REST API 모두 I/O-bound async 작업 → 동일 이벤트 루프에서 자원 공유
- inferred: TypeScript + Python 두 서버를 별도 운영하면 서비스 수 증가

**AI contribution**:
- Identified: FastAPI-MCP 라이브러리 존재 및 단일 서비스 통합 가능성
- Developer-driven: FastAPI 선택 방향 제시

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented

---

## [2026-06-14] 클라우드: GCP vs AWS

**Context**: 서버 측 파이프라인 운영 클라우드 선택. Kafka(MSK), PostgreSQL+pgvector, Claude API 호출이 핵심 워크로드.

**Decision**: AWS 채택.

**Alternatives considered**: GCP

**Reasoning**:
- Kafka 비용: AWS MSK ~$500/월 vs GCP Managed Kafka ~$1,100/월 — 약 2배 차이
- Claude API: GCP Vertex AI 호출 시 10% 할증. AWS Bedrock은 직접 Anthropic API와 동일 가격
- AWS MSK Express 브로커: 처리량 3배, 복구 시간 90% 단축

**AI contribution**:
- Identified: Vertex AI의 Claude 10% 할증 — "GCP = Anthropic 파트너십 유리"가 실제로는 반대
- Identified: Kafka 비용이 GCP 대비 약 2배 차이
- Developer-driven: 서버 측 LLM 정제 방향 및 클라우드 고민 제시

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented

---

## [2026-06-13] 수집 레이어: CLI Interception vs MCP Server

**Context**: CLI-First LLMOps 플랫폼의 데이터 수집 방식 선택.

**Decision**: MCP 서버 모드를 1순위, CLI Wrapper를 Fallback, Git Hook을 최후 보장 레이어로 하는 하이브리드 구조 채택.

**Alternatives considered**:
- CLI Interception only
- MCP Server only

**Reasoning**:
- CLI Interception은 TUI 환경에서 파싱 불가, Shell alias 누락 시 수집 누락
- MCP only는 구버전 도구·오프라인 환경에서 수집 불가
- inferred: Git Hook(collab-proof)이 최후 보장 레이어로 작동하면 어떤 환경에서도 최소 커밋 단위 수집 보장

**AI contribution**:
- Identified: TUI 환경과 Shell alias 누락이 CLI only 방식의 실질적 장애 요인임을 지적
- Suggested: 3순위 Fallback 구조 (MCP → CLI Wrapper → Git Hook)
- Developer-driven: collab-proof를 Git Hook 레이어로 재활용하는 아이디어

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented

---

## [2026-06-13] RBAC 벤치마크: Slack vs Notion

**Context**: 워크스페이스 로그인 기반 RBAC 설계 시 벤치마크 모델 선택.

**Decision**: Notion 모델 채택 — 워크스페이스 레벨(owner/admin/member/guest) + 프로젝트 레벨(full/contribute/comment/view) 2단계 구조.

**Alternatives considered**: Slack 모델

**Reasoning**:
- Notion의 Teamspace ≈ HUGININ 프로젝트, 페이지 권한 ≈ 의사결정 항목 접근 제어로 자연스럽게 매핑
- `comment` 권한 신설로 PM·디자이너가 CLI push 없이 의사결정 리뷰만 가능한 역할 확보

**AI contribution**:
- Identified: 단일 레벨 RBAC에서 "워크스페이스 member이지만 특정 프로젝트는 viewer" 엣지케이스 미해결 지적
- Suggested: Notion 2레벨 구조 및 `comment` 역할 신설
- Developer-driven: Slack/Notion 벤치마크 방향 제시

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented

---

## [2026-06-13] git 엣지케이스 처리: 서버 로직 vs collab-proof shell

**Context**: rebase/squash/amend/force push/monorepo 등 git 조작으로 커밋 해시가 변경될 때 의사결정 매핑이 깨지는 문제.

**Decision**: collab-proof shell이 git 훅 레이어에서 직접 처리.

**Alternatives considered**: 서버 측 reconciliation 서비스

**Reasoning**:
- collab-proof가 이미 git 이벤트를 감지하는 위치에 있으므로 처리 레이어 일치
- inferred: 서버에 reconciliation 로직을 두면 네트워크 의존성이 생겨 오프라인 환경에서 데이터 유실 위험

**AI contribution**:
- Identified: CI/CD 환경에서 `CI=true` 감지로 수집을 건너뛰는 패턴 제안
- Suggested: `hash-map.json` 기반 원본 해시 보존 전략
- Developer-driven: collab-proof를 고도화하는 방향 제시

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented
