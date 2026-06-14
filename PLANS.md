# 구현 로드맵

## 방향성 요약

**북극성**: collab-proof Frame A/B/C/D를 팀 스케일로 — 모든 커밋에서 AI 기여도를 자동 분석, 팀 타임라인에서 함께 확인.

```
Phase 1 ✅  자동 수집 + 팀 타임라인 (누가 뭘 했는지)
Phase 2     Frame A/B/C/D 서버 이식 (어떻게 AI가 기여했는지)
Phase 3     지식 그래프 + LLM 정제 (왜 그 결정을 내렸는지)
```

---

## Phase 1: 자동 수집 + 팀 타임라인 ✅ 완료

### 완료된 항목

**백엔드 (FastAPI)**
- [x] 인증: 회원가입 / 로그인 (JWT + argon2)
- [x] 워크스페이스 CRUD + 초대 + 역할 관리 (RBAC 2단계)
- [x] 프로젝트 연결 + 권한 설정
- [x] `POST /collect/event` — AI 이벤트 수집 (raw_prompt, raw_response, diff, branch, commit_hash)
- [x] `GET /memory/recall?q=...` — MCP recall_decisions (시맨틱 cross-workspace 검색)
- [x] `GET /dashboard/{id}/feed` — 타임라인 피드 (date_from, branch 필터)
- [x] `GET /dashboard/{id}/search` — ILIKE 텍스트 검색
- [x] `GET /dashboard/{id}/token-stats` — 토큰 사용량 집계
- [x] `GET /dashboard/{id}/branches` — 브랜치 목록
- [x] `POST/GET /comments/{event_id}` — 팀 코멘트
- [x] fastembed BAAI/bge-small-en-v1.5 임베딩 (384-dim, 백그라운드 생성)
- [x] pgvector HNSW 인덱스 (cosine similarity)
- [x] MCP 도구 2개 (`fastapi-mcp`)
- [x] Clean Architecture

**대시보드 (Next.js)**
- [x] 로그인 / 워크스페이스 선택
- [x] 팀 AI 결정 타임라인 (prompt + response + diff + commit 연결 뷰)
- [x] DiffView (인라인 +/- 컬러링)
- [x] 텍스트 검색 (2자 트리거)
- [x] 시간 범위 필터 (오늘 / 이번 주 / 전체)
- [x] 브랜치 필터
- [x] 토큰 차트
- [x] 팀 코멘트

**Phase 1이 보여주는 것**: 누가 언제 어떤 브랜치에서 무엇을 Claude에게 물어봤는지.
**Phase 1이 아직 못 보여주는 것**: AI가 그 결정에서 어떤 역할을 했는지.

---

## Phase 2: Frame A/B/C/D 서버 이식 (다음 단계)

**목표**: collab-proof의 AI 기여도 분석 로직을 서버에 이식해 팀 타임라인에 통합.

### Frame 정의

| Frame | 측정 대상 | 스코어 기준 |
|---|---|---|
| A — 기술적 복잡도 | 이 결정이 얼마나 복잡한가 | 신규 모듈/알고리즘 1.0 → 타입/리네임 0.1 |
| B — 불확실성 | 개발자가 확신 없이 진행했는가 | 롤백/재작성 1.0 → 일관된 실행 0.0 |
| C — 분기 | 대안을 비교하고 선택했는가 | 명시적 A vs B 비교 1.0 → 단일 경로 0.0 |
| D — AI 기여도 | AI가 실제로 무엇을 했는가 | 버그 발견/제안 1.0 → 단순 타이핑 0.2 |

### 구현 항목

- [ ] `FrameAnalysisService` — 수집된 prompt + response + diff를 입력받아 Frame A/B/C/D 스코어 산출
  - Claude claude-sonnet-4-6 호출 (structured output)
  - 결과를 `decision_events` 테이블에 저장 (`frame_a`, `frame_b`, `frame_c`, `frame_d` 컬럼)
- [ ] `POST /collect/event` 응답 후 백그라운드에서 Frame 분석 실행 (임베딩과 동일 패턴)
- [ ] 대시보드 타임라인에 Frame 스코어 표시
  - Frame D 높음 → "AI 주도" 배지
  - Frame C 높음 → "대안 비교" 배지
  - Frame B 높음 → "불확실성 있음" 배지
- [ ] 팀 단위 Frame 집계 뷰 — 브랜치별 / 팀원별 AI 기여도 분포
- [ ] Git hook 설치 스크립트 정식화
- [ ] PII 마스킹 엔진 강화

---

## Phase 3: 지식 그래프 + LLM 정제

**목표**: 축적된 결정 데이터를 재사용 가능한 팀 지식으로 변환.

### 구현 항목

- [ ] LLM 정제 파이프라인 — raw 로그 → 구조화된 의사결정 요약
- [ ] 의사결정 그래프 — 커밋을 노드로, AI 추론 경로를 엣지로 시각화
- [ ] "이 코드 왜 이렇게 됐나?" — 파일 경로 → 연관 결정 역방향 탐색
- [ ] PostgreSQL CTE → Neo4j AuraDB 이관
- [ ] Hermes 품질 평가 게이트

---

## 기술 스택 현황

| 레이어 | 선택 | 상태 |
|---|---|---|
| MCP 서버 | FastAPI + `fastapi-mcp` | ✅ 운영 중 |
| 임베딩 | fastembed BAAI/bge-small-en-v1.5 (384-dim) | ✅ 운영 중 |
| Vector DB | PostgreSQL + pgvector (HNSW, cosine) | ✅ 운영 중 |
| Frame 분석 | Claude claude-sonnet-4-6 (structured output) | Phase 2 |
| 대시보드 | Next.js 16, React 19, TanStack Query 5 | ✅ 운영 중 |
| 메시징 | Kafka (aiokafka) | 구조는 있음, Phase 2에서 본격 사용 |
| Decision Graph | PostgreSQL CTE (임시) → Neo4j AuraDB (Phase 3) | Phase 3 |
