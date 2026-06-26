# DECISIONS.md

---

## [2026-06-26] 문서 임포트 ETL: cold-start 문제 + KB 차별화

**Context**: HUGININ은 설치 시점부터 AI 결정을 수집하기 때문에 프로젝트 중간에 도입하면 이전 결정 이력이 없다. 또한 오픈소스 KB(Outline, Danswer 등)는 날 문서 청크를 임베딩해 검색 품질이 낮고 사람이 재검토해야 하는 문제가 있다.

**Decision**: Phase 2에 `huginin import` 추가. 기존 Haiku ETL 파이프라인을 문서에도 동일하게 적용 — raw 청크 임베딩 대신 `what_was_decided / why / alternatives / constraints` 구조로 정제 후 저장. 임포트 후 코드베이스와 자동 비교 검증.

**Alternatives considered**:
- 날 문서 청크 임베딩 — 구현 단순하나 검색 품질 낮음, 재검토 부담 발생 (KB와 동일 문제)
- 별도 문서 스키마 — 결정 레코드와 스키마 분리 시 MCP recall에서 통합 검색 불가
- 전체 문서 사람 검토 — 임포트 의미 없음, 마찰 그대로

**Reasoning**:
- HUGININ의 핵심 자산은 ETL로 정제된 구조화된 결정 레코드. 문서도 같은 파이프라인을 태우면 품질 균일화
- cold-start 해결: 설치 이전 ADR, README, 설계 문서를 소급 입력 → 팀 전체 결정 이력 완성
- **코드가 source of truth**: ETL 추출 클레임을 코드베이스와 대조 → consistent/outdated/unverifiable 판정. outdated만 사람 검토 → 검토 부담 최소화
- KB와의 명확한 차별점: "날 문서 저장"이 아닌 "결정 단위 정제 + 코드 검증 후 저장"
- setup 자동 감지 + git hook 재임포트로 수동 입력 마찰 최소화

**Intent class**: FEATURE_BUILDING
**Signal score**: HIGH
**Outcome**: backlogged (Phase 2)

---

## [2026-06-24] PTY 멀티플렉서: huginin TUI 구조 전환

**Context**: `huginin` 단독 실행 시 Bubble Tea REPL로 claude 세션 진입했으나, 멀티 CLI(agy, codex) 지원과 Ctrl+\ 전환 UX를 위해 PTY 멀티플렉서 구조로 전환.

**Decision**: Bubble Tea REPL 대신 직접 PTY 관리. `creack/pty`로 각 CLI(claude · agy · codex)를 별도 PTY로 실행, stdin goroutine이 syscall.Select polling으로 Ctrl+\ 감지.

**Alternatives considered**:
- tmux/screen 래핑 — 외부 의존성 추가, UX 제어 불가
- Bubble Tea ExecProcess 유지 — 멀티 PTY 동시 관리 불가

**Reasoning**:
- macOS에서 fd close 시 goroutine 내 Read()가 unblock되지 않음 (OS 레벨 제약)
- syscall.Select 10ms timeout polling이 산업 표준 terminal non-blocking I/O 접근법
- `darwin syscall.FdSet{Bits [32]int32}` — linux와 달리 int32 배열 bit 조작 필요

**Intent class**: FEATURE_BUILDING
**Signal score**: HIGH
**Outcome**: implemented (cli/interfaces/tui/multiplexer.go)

---

## [2026-06-24] CLI 전환 UX: clearScreen + showBanner 순서

**Context**: CLI 전환 시 이전 CLI 출력이 새 CLI 화면에 overlap되거나, 어떤 CLI가 활성인지 구별 불가.

**Decision**: 전환 순서를 `switchTo → clearScreen → showBanner → paused=false`로 고정. paused=true 상태 유지 중에 clearScreen, banner 출력 후 paused 해제.

**Reasoning**:
- paused=true로 이전 CLI output을 outputLoop에서 차단
- clearScreen 먼저 실행해 깨끗한 slate 보장
- showBanner로 현재 활성 CLI(claude · agy · codex) 명시
- paused=false 후 context injection은 별도 goroutine

**Intent class**: FEATURE_BUILDING
**Signal score**: HIGH
**Outcome**: implemented

---

## [2026-06-24] 검색 고도화 방향: MMR + 하이브리드

**Context**: 현재 검색은 pgvector cosine similarity top-K → LLM 합성. 결과가 중복되거나 다양성 부족.

**Decision**: Phase 3에 MMR(Maximal Marginal Relevance) 리랭킹과 BM25+pgvector 하이브리드 검색 추가 예정.

**Alternatives considered**:
- Google Information Gain (InfoGain-RAG, arxiv 2509.12765) — LLM 신뢰도 델타 기반, +17.9% 성능 향상. 단, LLM 추가 호출 비용 발생
- MMR — 기존 임베딩 재활용, 추가 LLM 호출 없음, 다양성·관련성 균형 λ로 조정 가능

**Reasoning**:
- MMR은 post-retrieval에서 기존 pgvector 결과에 적용 → 추가 인프라 없이 구현 가능
- `score = λ·sim(doc,query) − (1−λ)·max_sim(doc,selected)` 단순 수식
- 현재 pgvector top-K 이후 Python 레이어에서 추가 연산만 필요

**Intent class**: EXPLORING
**Signal score**: MEDIUM
**Outcome**: backlogged (Phase 3)

---

## [2026-06-15] 핵심 방향: AI 협업 가시화 + Frame A/B/C/D 팀 스케일 확장

**Context**: "MD 파일과 뭐가 달라?"라는 외부 피드백과, Frame A/B/C/D가 서버에 구현돼 있지 않다는 사실 확인. 제품의 핵심을 재정의할 필요가 생김.

**Decision**:
- 핵심 문제: 팀 AI 협업의 블랙박스 (프롬프트 미공유 + AI 기여 불명확 + 결정 맥락 소멸)
- 해결 방향: AI 협업 가시화 — 단순 저장이 아닌 결정 단위 AI 기여도 분석
- 북극성 기능: collab-proof Frame A/B/C/D를 서버에 이식해 팀 스케일로 자동 실행
- Phase 1(완료): 자동 수집 + 팀 타임라인. Phase 2: Frame 분석 서버 이식

**Alternatives considered**:
- "Claude Code × Team Memory" 포지셔닝 유지 — MCP recall 루프가 핵심
- "LLMOps" 포지셔닝 — LangSmith와 정면 경쟁

**Reasoning**:
- 실제 출발점이 "팀에서 프롬프트 공유가 안 돼서 병목" 이었음 — 가장 솔직한 문제 정의
- Frame D(AI 기여도)가 기존 서비스들이 아무도 건드리지 않는 영역 — 코드 라인 귀속(Git AI)과 다름
- collab-proof가 이미 개인 단위로 이 분석을 하고 있음 — 팀 스케일 확장이 자연스러운 다음 단계
- Phase 1에서 수집된 raw_prompt + response + diff가 Frame 분석의 완벽한 입력

**AI contribution**:
- Identified: Frame A/B/C/D가 서버에 구현돼 있지 않음을 코드 검색으로 확인
- Identified: "AI 기여도 분석 — 구조 제안 / 구현 생성" 표현이 미구현 기능을 구현된 것처럼 표현하고 있음
- Suggested: 현재 구현 vs Phase 2 목표를 명확히 분리하는 문서 구조
- Developer-driven: 핵심 방향을 "가시화"로 정의하는 결정

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented (README, PLANS, AGENTS 업데이트)

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

## [2026-06-15] user_name을 JWT 대신 DB 조회로 가져오는 방식

**Context**: claude_refiner.py가 "인간" 대신 실제 커미터 이름을 aiRole 텍스트에 넣어야 했음. JWT payload에는 user_id만 있고 name이 없어서 조회 방법이 필요했음.
**Decision**: collect_router에서 `user_repo.find_by_id(user_id)` 직접 호출 → user.name 획득 후 CollectEventInput에 주입
**Alternatives considered**: JWT payload에 name 추가, get_current_user 미들웨어 의존성 생성
**Reasoning**: inferred: JWT 재발급 없이 즉시 동작, 미들웨어 패턴보다 코드 변경 범위 최소화. `app.state.user_repo` 노출 1줄 추가로 해결.
**AI contribution**:
  - Identified: JWT에 name 필드 없음을 확인 후 DB 조회 경로 제안
  - Suggested: `app.state.user_repo = user_repo` 노출 + collect_router에서 직접 fetch
  - Developer-driven: user_name 표시 요구사항 자체 제시
**Intent class**: FEATURE_BUILDING
**Signal score**: HIGH
**Outcome**: implemented

## [2026-06-15] ETL 파이프라인 시각화 — 랜딩(추상) vs README(구체) 이중 전략

**Context**: ETL 파이프라인을 시각적으로 보여달라는 요청. 대상 독자가 둘(신규 방문자 vs 개발자 기여자)로 나뉨.
**Decision**: 랜딩 페이지는 추상(신뢰도 목적, 구현 숨김), README는 구체(파일경로·SQL·필드명 포함)
**Alternatives considered**: 단일 파이프라인 다이어그램 컴포넌트, 전용 /pipeline 페이지
**Reasoning**: 랜딩 방문자는 "작동하는구나"만 알면 됨. 기여자는 "어디를 보면 되는지" 알아야 함. 목적이 달라서 같은 표현이 둘 다에 최적일 수 없음.
**AI contribution**:
  - Identified: 독자 분리 필요성 제안 (추상 vs 구체 이중화)
  - Suggested: README에 실제 컴포넌트명·SQL·frame 정의표 포함하는 4단계 구조
  - Developer-driven: "신뢰성 올리고 싶다"는 목표 제시
**Intent class**: FEATURE_BUILDING
**Signal score**: HIGH
**Outcome**: implemented

## [2026-06-15] 랜딩 Before 패널 — 텍스트 설명 vs 시각적 공허함

**Context**: Before/After 섹션 Before 패널이 텍스트로 문제를 설명하고 있어서 오히려 임팩트가 약했음.
**Decision**: "no session data detected" 같은 설명 텍스트 제거 → raw git log 4줄(극도로 희미한 색)만 + "4 commits · 0 context" 한 줄
**Alternatives considered**: "no session data detected" 레이블, 빈 화면 + ? 아이콘, 설명 텍스트 유지
**Reasoning**: 텍스트로 "아무것도 모른다"를 설명하면 그 공허함이 사라짐. 숫자 대비(4 commits / 0 context)가 설명 없이 문제를 전달함.
**AI contribution**:
  - Identified: "no session data detected"가 에러 메시지처럼 읽힌다는 지적에 동의, 텍스트 없는 방향 제안
  - Suggested: git log 4줄 + "0 context" 대비 구조
  - Developer-driven: "너무 별로같지 않나" 판단 및 제거 결정
**Intent class**: FEATURE_BUILDING
**Signal score**: HIGH
**Outcome**: implemented

## [2026-06-16] HUGININ 창업 전략 — PLG 확정, GTM 방향

**Context**: 리서치 보고서(팀 프롬프트 공유 서비스, 기여 비대칭성) + 심층 전략 탐색. B2B SaaS vs B2C vs PLG 비교, EU AI Act 가능성 검토, 시장 선점 타이밍 분석.
**Decision**: PLG (Product-Led Growth) 전략으로 확정. B2B는 감시 인식 재발, B2C는 팀 기능 가치 제로 — PLG가 HUGININ 구조와 유일하게 맞음.
**Alternatives considered**:
- B2B SaaS: 위에서 강제 → 감시 도구 인식 → 형식적 사용
- B2C: 혼자 쓰면 팀 기능 가치 없음, cold start 해결 불가
- EU AI Act 전용 툴: 엔터프라이즈 세일즈 사이클 6-18개월, 한국 시장 타이밍 불일치, 대형 플레이어 경쟁 불가
**Reasoning**: Slack/Figma/Linear 모두 PLG. 개발자가 자발적 설치 → 감시 인식 없음 → 팀 전파 자연 발생. 데이터 lock-in이 진짜 해자.
**AI contribution**:
  - Identified: 세 가지 Aha Moment 후보(A/B/C) 모두 문제 있음을 분석, B2B/B2C 구조적 미스매치 진단
  - Suggested: PLG 구조, 가격 모델(1인 무료 → 6인+ 유료 → 엔터프라이즈)
  - Developer-driven: "창업으로 밀고 싶다" 결정, AURA 경험이 origin임을 공유
**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented (방향 확정)

## [2026-06-19] CLI TUI 접근법 — alt screen vs REPL-style

**Context**: `huginin` 단독 실행 시 Claude Code처럼 세션 안에 머무는 UI 구현. Bubble Tea 라이브러리 도입 후 `tea.WithAltScreen()`으로 풀스크린 TUI 구현 → claude subprocess가 즉시 종료되는 버그 발생.

**Decision**: alt screen 제거, `tea.Println` 기반 REPL-style 인라인 출력으로 전환. `tea.ExecProcess`로 claude/login subprocess 핸드오프.

**Alternatives considered**:
- Option A — 풀스크린 TUI (alt screen + viewport) — 시각적으로 완성도 높으나 Claude Code의 터미널 제어와 충돌
- Option B — 별도 pane/split — 구현 복잡도 대폭 증가
- Option C — REPL-style (선택) — 진입 후 컨텍스트 유지, `tea.ExecProcess`로 서브프로세스 정상 핸드오프

**Reasoning**: `tea.WithAltScreen()`이 Claude Code 자체의 터미널 관리와 충돌해 claude subprocess가 시작하자마자 종료됨. alt screen 없이도 `tea.Println`으로 REPL 패턴 구현 가능 — 기능 손실 없음. `tea.ExecProcess`가 stdin/stdout을 서브프로세스에 완전 위임하므로 claude 세션이 정상 작동.

**AI contribution**:
  - Identified: `tea.WithAltScreen()`이 Claude Code 터미널 제어와 충돌하는 것을 근본 원인으로 진단
  - Suggested: alt screen 제거 + `tea.Println` REPL 패턴으로 전환
  - Developer-driven: "진입 후 컨텍스트 유지되는 프롬프트로" 방향 제시, Option C 선택

**Intent class**: FEATURE_BUILDING (runner-up: BUG_FIXING)
**Signal score**: HIGH
**Outcome**: implemented (`cli/interfaces/tui/session.go`, commit b155f2c)

---

## [2026-06-19] AI 브리핑 캐시 전략 — Redis vs Postgres vs in-memory

**Context**: AI 브리핑/채팅 답변을 실시간 반영하기 위해 이전 답변을 참조하는 캐시 구조 검토. 현재 Railway 단일 인스턴스, 수백 워크스페이스 규모.

**Decision**: Python in-memory dict (`briefing_cache: dict[str, dict]`) 채택. Railway 단일 인스턴스 환경에서 재시작 간 캐시 소멸을 허용.

**Alternatives considered**:
- Redis Plugin (Railway) — 영속성 있는 캐시, 수평 확장 지원, 그러나 $10–20/월 추가 비용
- Redis in Docker (`--network host`) — 비용 절감, 그러나 Railway Docker 내장은 별도 사이드카 필요
- PostgreSQL 캐시 테이블 — 비용 0, 그러나 "테이블로 캐시인척"은 스케일업 구조와 불일치
- in-memory dict (선택) — 비용 0, 수백 워크스페이스 수용 가능, 재시작 소멸 허용

**Reasoning**: 단일 Railway 인스턴스에서 수백 워크스페이스 AI 브리핑 캐시는 in-memory로 충분. 재시작 시 캐시 소멸은 "첫 요청만 느림"으로 허용 가능. 사용자 100명 이상 & 수평 확장 필요 시점에 Redis로 교체 — 코드 변경 최소화.

**AI contribution**:
  - Identified: Postgres 캐시 테이블이 스케일업 구조와 맞지 않음을 지적
  - Suggested: in-memory dict가 현재 규모에서 충분함을 비용/복잡도 기준으로 제시
  - Developer-driven: "캐시 추가가 실용적이지만 스케일업 상황에서 어울리지 않는다" 문제 제기

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: implemented (brief_cache in-memory, Redis는 100명+ 시점에 재검토)

---

## [2026-06-19] 100명 기준 인프라 비용 — Railway vs EC2/RDS vs ECS vs EKS

**Context**: 프롬프트 암호화(AES-256-GCM) 논의 중 AWS 이전 타당성 검토. 현재 Railway($25/월) 대비 AWS 비용 비교.

**Decision**: Railway 유지 (MVP 단계). AWS 이전 시점은 사용자 규모 및 보안 요구사항 기준으로 재결정.

**Alternatives considered**:
- Railway — 현재: ~$25/월 (서버+DB 통합), 단순, 단일 인스턴스 제한
- EC2(t3.small) + RDS(db.t3.micro) — ~$33/월, 수동 관리, Kafka 미사용이면 충분
- ECS Fargate — ~$31–63/월 (컨테이너 수 따라), 서버리스 컨테이너, 설정 복잡도 중간
- EKS — ~$159/월 (control plane $0.10/hr + 노드), Kafka·Neo4j 필요 단계에 적합, 현재는 과비용

**Reasoning**: 100명 규모에서 Railway가 가장 저렴하고 운영 부담 최소. EKS는 Kafka/Neo4j 도입(Phase 3) 이전에는 비용 대비 효용 없음. ECS Fargate는 중간 단계 옵션으로 유효하나 현재 불필요. AWS 이전은 보안 요구사항(암호화 의무화)이나 수평 확장 필요 시점에 재검토.

**AI contribution**:
  - Suggested: 4개 옵션 구체 비용 산출 ($25 / $33 / $31–63 / $159) + EKS subnet/RDS 구조 설명
  - Identified: EKS가 현재 규모에서 6배 비싼 과잉 투자임을 지적
  - Developer-driven: AWS 이전 검토 자체 제기, 프롬프트 암호화 요구사항 제시

**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: pending (Railway 유지, AWS 이전 시점 미확정)

---

## [2026-06-19] datetime timezone-naive vs aware 버그 — workspace join 500

**Root cause**: Python `datetime.utcnow()`는 timezone-naive datetime 반환. PostgreSQL(Railway)은 `TIMESTAMP WITH TIME ZONE`으로 저장 → timezone-aware datetime 반환. `is_expired()` 메서드에서 naive(`datetime.utcnow()`)와 aware(DB 조회값)를 비교 시 `TypeError: can't compare offset-naive and offset-aware datetimes` 발생.

**Symptom**: `/workspace/join` 엔드포인트 호출 시 500 Internal Server Error. CLI에서 초대코드로 워크스페이스 참가 불가.

**Fix**: 9개 서버 파일 전체에서 `datetime.utcnow()` → `datetime.now(timezone.utc)` 교체. `from datetime import datetime, timezone` import 추가.

**Why this fix**: `datetime.now(timezone.utc)`는 UTC timezone-aware datetime을 반환하므로 DB 조회값과 비교 가능. `datetime.utcnow()`는 deprecated이며 timezone-naive라는 함정이 있음 — 프로젝트 전체에 일관 적용.

**Alternative fixes considered**: `invite.expires_at.replace(tzinfo=None)`으로 DB 값을 naive로 변환 — 가능하나 근본 해결이 아니며 모든 비교 지점마다 적용해야 함.

**AI contribution**:
  - Identified: 에러 메시지 `can't compare offset-naive and offset-aware datetimes`에서 즉시 근본 원인 진단
  - Suggested: 9개 파일 전체 일괄 교체 (spot fix 아닌 글로벌 수정)
  - Developer-driven: 500 에러 출력 제공, 수정 범위 확인

**Intent class**: BUG_FIXING
**Signal score**: HIGH
**Outcome**: fixed (commit 98ddbc2)

---

## [2026-06-19] TanStack Query stale cache — 삭제된 워크스페이스 사이드바 잔존

**Root cause**: `useWorkspacesQuery`에 `staleTime: 60_000` (1분) 설정. 워크스페이스 삭제 후 `queryClient.invalidateQueries` 없이 컴포넌트가 마운트되면 TanStack Query가 1분간 캐시된 목록을 그대로 반환 → 삭제된 워크스페이스가 사이드바에 계속 표시.

**Symptom**: 워크스페이스 삭제 → 대시보드 이동 → 왼쪽 사이드바에 삭제된 워크스페이스 계속 표시.

**Fix**: `WorkspaceSettings.tsx`의 `deleteWorkspace` 함수에서 API 호출 성공 후 `queryClient.invalidateQueries({ queryKey: ["workspaces"] })` 추가. 이후 남은 워크스페이스 조회 → 있으면 첫 번째로 리다이렉트, 없으면 `/workspace/new`.

**Why this fix**: `invalidateQueries`는 해당 쿼리 키를 "stale"로 표시해 다음 마운트 시 즉시 리페치 트리거. 삭제 직후 사이드바가 새 데이터를 받아 렌더링.

**AI contribution**:
  - Identified: `staleTime: 60_000` 설정이 캐시 만료를 1분 지연시키는 원인임을 진단
  - Suggested: `invalidateQueries` 패턴으로 즉시 무효화
  - Developer-driven: "렌더링이 제대로 안 되는 것 같다" 증상 보고

**Intent class**: BUG_FIXING
**Signal score**: HIGH
**Outcome**: fixed (commit 3c687fd)

---

## [2026-06-16] 첫 사용자 전략 — AURA 팀원 직접 설치

**Context**: GTM 전략 논의 중 실제 사용 팀이 0임을 확인. 클라우드 배포 후 릴리즈 계획을 검토.
**Decision**: 클라우드 배포 전에 AURA 팀원 노트북에 직접 설치. "완성하고 주기"가 아니라 "지금 당장 로컬로".
**Alternatives considered**: 클라우드 배포 후 링크 공유, 낯선 커뮤니티에 홍보
**Reasoning**: AURA 팀원들은 동일한 pain(각자 AI 쓰면서 서로 모름)을 직접 겪음 → 설득 비용 0, 피드백 품질 최고. 개발자의 함정 — "완성하고 주려다가 영원히 못 줌".
**AI contribution**:
  - Identified: "클라우드 연결하고 줘야겠다"는 반응을 즉시 개발자 함정으로 진단
  - Suggested: 로컬 설치 직접 해주기 (30분), 클라우드 배포보다 100배 빠른 학습
  - Developer-driven: AURA 프로젝트 경험 공유, HUGININ의 origin story
**Intent class**: EXPLORING
**Signal score**: HIGH
**Outcome**: pending (AURA 팀원 연락 예정)
