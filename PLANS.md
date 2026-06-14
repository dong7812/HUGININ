# 구현 로드맵

## 현재 상태 (2026-06-14 기준)

**Phase 1 MVP 완료** — 백엔드 + 대시보드 기본 동작 가능.

---

## Phase 1: MVP ✅ 완료

### 완료된 항목

**백엔드 (FastAPI)**
- [x] 인증: 회원가입 / 로그인 (JWT + argon2)
- [x] 워크스페이스 CRUD + 초대 + 역할 관리 (RBAC 2단계)
- [x] 프로젝트 연결 + 권한 설정
- [x] `POST /collect/event` — AI 이벤트 수집 (raw_prompt, raw_response, diff, branch, commit_hash)
- [x] `GET /memory/recall?q=...` — MCP recall_decisions 도구 (시맨틱 cross-workspace 검색)
- [x] `GET /dashboard/{id}/feed` — 타임라인 피드 (date_from, branch 필터)
- [x] `GET /dashboard/{id}/search` — ILIKE 텍스트 검색
- [x] `GET /dashboard/{id}/overview` — 통계
- [x] `GET /dashboard/{id}/token-stats` — 토큰 사용량 집계
- [x] `GET /dashboard/{id}/branches` — 브랜치 목록
- [x] `POST/GET /comments/{event_id}` — 팀 코멘트
- [x] fastembed BAAI/bge-small-en-v1.5 임베딩 (384-dim, 백그라운드 생성)
- [x] pgvector HNSW 인덱스 (cosine similarity)
- [x] MCP 도구 2개 노출 (`fastapi-mcp`)
- [x] Clean Architecture (domain → application → infrastructure ← interfaces)

**대시보드 (Next.js)**
- [x] 로그인 / 워크스페이스 선택 플로우
- [x] 의사결정 타임라인 (prompt + response + diff + commit 연결 뷰)
- [x] DiffView (인라인 +/- 컬러링)
- [x] 텍스트 검색 (2자 트리거, X 버튼 초기화)
- [x] 시간 범위 필터 (오늘 / 이번 주 / 전체)
- [x] 브랜치 필터
- [x] 토큰 차트
- [x] 팀 코멘트 (이벤트별)
- [x] 랜딩페이지 (MCP-first, recall_decisions 인라인 데모, vs Git AI 비교)

---

## Phase 2: 수집 품질 & MCP 강화 (다음 단계)

**목표**: Git hook 자동화 + 수집 완성도 향상 + MCP 참조 품질 향상.

### 구현 항목

- [ ] Git hook 설치 스크립트 (`curl -s https://api.huginin.dev/install | bash`)
  - post-commit: prompt + response + diff 자동 수집
  - hash-map.json: rebase/squash/amend 시 원본 해시 보존
  - CI=true 감지로 CI/CD 환경 자동 건너뜀
- [ ] PII 마스킹 엔진 강화 — API Key, 민감 코드 패턴 필터링
- [ ] 임베딩 품질 개선 — prompt + response 조합 최적화
- [ ] recall_decisions 결과 랭킹 — 최신성 + 코사인 유사도 가중치 조합
- [ ] 워크스페이스 대시보드: 팀원 기여도 뷰
- [ ] 이메일 초대 플로우

---

## Phase 3: 지식베이스 심화

**목표**: 시맨틱 검색 품질 고도화 + 의사결정 그래프 시각화.

### 구현 항목

- [ ] 의사결정 그래프 — 커밋 해시를 노드로, AI 추론 경로를 엣지로 시각화
- [ ] "이 코드 왜 이렇게 됐나?" — 파일 경로 → 연관 의사결정 역방향 탐색
- [ ] PostgreSQL CTE → Neo4j AuraDB 이관 (Kafka 컨슈머 그룹 D 활성화)
- [ ] LLM 정제 파이프라인 — raw 로그 → 구조화된 의사결정 요약
  - Context Distillation 프롬프트
  - 중요도 필터링 (핵심 파일 변경 시만 LLM 호출)
- [ ] Hermes 품질 평가 게이트
- [ ] 지식 노후화 감지 — 아키텍처 변경 시 이전 결정 노드 deprecate

---

## 기술 스택 현황

| 레이어 | 선택 | 상태 |
|---|---|---|
| MCP 서버 | FastAPI + `fastapi-mcp` | ✅ 운영 중 |
| 임베딩 | fastembed BAAI/bge-small-en-v1.5 (384-dim) | ✅ 운영 중 |
| Vector DB | PostgreSQL + pgvector (HNSW, cosine) | ✅ 운영 중 |
| 인증 | JWT + argon2-cffi | ✅ 운영 중 |
| 대시보드 | Next.js 16 App Router, React 19, TanStack Query 5 | ✅ 운영 중 |
| 메시징 | Kafka (aiokafka) | ✅ 구조는 있으나 Phase 2에서 본격 사용 |
| 클라우드 | AWS (Bedrock, MSK Serverless, RDS) | Phase 2에서 배포 |
| Decision Graph | PostgreSQL CTE (임시) → Neo4j AuraDB (Phase 3) | 계획됨 |
| LLM 정제 | Claude claude-sonnet-4-6 via Bedrock | Phase 3에서 활성화 |
