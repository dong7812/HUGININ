# 구현 로드맵

## 방향성

**포지셔닝**: AI 의사결정 버전 관리 — Git이 코드 이력을 남기듯, HUGININ은 AI 결정 이력을 남긴다.

**핵심 가치 순서**:
1. **자동 수집** — 커밋마다 Claude 대화가 자동으로 쌓인다. 별도 입력 없음.
2. **역추적** — 6개월 전 결정도 왜 그렇게 했는지 꺼낼 수 있다.
3. **지식베이스** — 쌓인 이력이 팀 자산이 된다. MCP로 새 세션에 주입된다.

```
Phase 1 ✅  자동 수집 파이프 + 팀 타임라인 + ETL 정제 + huginin TUI
Phase 2     역추적 인터페이스 강화 + 지식베이스 뷰
Phase 3     결정 그래프 + MCP 고도화 + 검색 고도화 (MMR)
```

---

## Phase 1: 자동 수집 파이프 ✅ 완료

### 완료된 항목

**백엔드 (FastAPI)**
- [x] 인증: 회원가입 / 로그인 (JWT + argon2) + Google OAuth
- [x] 워크스페이스 CRUD + 초대코드 + 삭제
- [x] RBAC 2단계 (워크스페이스 + 프로젝트)
- [x] `POST /collect/event` — Claude 세션 자동 수집 (raw_prompt, raw_response, diff, branch, commit_hash, committed_at)
- [x] Claude Haiku ETL — frame / ai_contribution / what_was_built / problem_solved / ai_role / tradeoffs 자동 추출
- [x] Frame A/B/C/D 분류 (Human-led / AI-assisted / AI-led / Automated)
- [x] `GET /dashboard/{id}/feed` — 타임라인 피드 (date_from, branch, frame 필터)
- [x] `GET /dashboard/{id}/frame-stats` — Frame 분포 + 팀원별 패턴
- [x] `GET /dashboard/{id}/ai-trend` — AI 기여도 추이
- [x] `GET /dashboard/{id}/search` + `smart-search` — 텍스트 + pgvector + LLM 합성
- [x] `GET /memory/recall?q=...` — MCP recall_decisions (시맨틱 검색)
- [x] `POST /workspace/{id}/pm-brief` — AI 브리핑
- [x] fastembed 임베딩 + pgvector HNSW 인덱스
- [x] backfill — 과거 커밋 소급 수집 + committed_at 타임라인 정렬
- [x] FORCE_REREFINE — 전체 ETL 재정제 트리거

**CLI (Go + Bubble Tea)**
- [x] `huginin login / logout`
- [x] `huginin setup` — 워크스페이스 연결 + hook 설치 한 번에 (TUI)
- [x] `huginin backfill` — 과거 커밋 소급 수집
- [x] `huginin hook install`
- [x] TUI 세션 (`huginin` 단독 → REPL)
- [x] 배포: darwin arm64/amd64, linux amd64/arm64 (huginin.com/install.sh)
- [x] hook JSONL 추출 수정 — tool_result 건너뛰고 실제 user text 추출
- [x] PTY 멀티플렉서 — claude · agy · codex 각각 PTY로 실행, Ctrl+\ 전환
- [x] multi-LLM tool 필드 — DB event에 tool 컬럼, hook에서 tool 자동 감지·전달
- [x] CLI 전환 UX — clearScreen + banner, output overlap 방지, context 자동 이어받기
- [x] PTY stdin goroutine — syscall.Select polling (macOS blocking Read 회피)

**대시보드 (Next.js)**
- [x] 결정 타임라인 + DiffView
- [x] 시맨틱 검색 + 스마트 검색
- [x] Frame A/B/C/D 필터 + 팀원별 패턴 (FrameStats)
- [x] AI 기여도 추이 차트 (AiTrendChart)
- [x] AI 브리핑 슬라이드오버
- [x] 워크스페이스 설정 (초대코드 + 삭제)

---

## Phase 2: 역추적 인터페이스 강화 (다음 단계)

**목표**: 수집된 데이터를 역추적과 지식베이스로 꺼내 쓰는 인터페이스.  
"왜 이렇게 만들었지?" → 바로 꺼낼 수 있어야 한다.

### 구현 항목

**역추적 인터페이스**
- [ ] 파일/함수 기반 역추적 — 특정 파일 경로 입력 → 이 파일을 건드린 AI 결정들 타임라인
- [ ] 결정 검색 결과 개선 — 현재 검색은 있으나 "역추적" 목적으로 설계 안 됨. 관련 결정 + 당시 맥락을 한 화면에
- [ ] 개인 생산성 리포트 — "이번 달 내가 AI를 어디에 주로 썼는지", "AI 기여도 높은 커밋 vs 낮은 커밋" 개발자 본인 뷰

**지식베이스 뷰**
- [ ] decision_type별 결정 이력 — "bugfix 43건 중 AI-led 71%" 형태의 누적 지식
- [ ] 팀 패턴 요약 — "우리 팀이 auth 관련 결정을 어떻게 해왔나" 카테고리별 집계
- [ ] "이 결정과 유사한 과거 결정" — 시맨틱 검색 기반 related decisions 패널

**MCP 강화**
- [ ] `recall_decisions` 응답 품질 개선 — 현재 raw 결과 반환, 구조화된 컨텍스트로 개선
- [ ] 파일 경로 기반 참조 — "auth.py 수정 전 이 파일 관련 과거 결정 참조"

**수집 품질**
- [~] Multi-LLM 수집 확장 — agy/codex hook·tool 필드 완료; Gemini CLI, Cursor 미완
- [ ] 프롬프트 암호화 — AES-256-GCM (raw_prompt / raw_response)

---

## Phase 3: 결정 그래프 + 팀 지식 자산 + 검색 고도화

**목표**: 수집된 이력이 조직의 AI 의사결정 지식베이스가 된다.

### 구현 항목

- [ ] **검색 고도화 — MMR + 하이브리드** (P1)
  - pgvector top-K 이후 MMR 리랭킹: `score = λ·sim(doc,query) − (1−λ)·max_sim(doc,selected)`
  - BM25 키워드 + pgvector 시맨틱 결합 (하이브리드 검색)
  - 참고: InfoGain-RAG (arxiv 2509.12765) — LLM 신뢰도 델타 기반 필터링, naive RAG 대비 +17.9%
- [ ] 결정 그래프 시각화 — 커밋을 노드로, AI 추론 경로를 엣지로. "road not taken" 점선 표시
- [ ] Neo4j AuraDB 이관 — PostgreSQL CTE → Cypher. 역방향 탐색 고도화
- [ ] AI ROI 리포트 — "AI 도입 전후 팀 커밋 속도 변화", "Frame 분포 추이"로 비용 정당화 데이터
- [ ] Hermes 평가 루프 — ETL 품질 자동 점수화, 아키텍처 변경 시 이전 결정 자동 deprecate
- [ ] Zero-knowledge 암호화 (AWS KMS)

---

## 기술 스택 현황

| 레이어 | 선택 | 상태 |
|---|---|---|
| 수집 | Git hook (post-commit) + MCP | ✅ 운영 중 |
| ETL | Claude Haiku (Frame + 7개 필드 추출) | ✅ 운영 중 |
| 임베딩 | fastembed BAAI/bge-small-en-v1.5 (384-dim) | ✅ 운영 중 |
| Vector DB | PostgreSQL + pgvector (HNSW, cosine) | ✅ 운영 중 |
| 대시보드 | Next.js 16, React 19, TanStack Query 5 | ✅ 운영 중 |
| 역추적 뷰 | — | Phase 2 |
| Decision Graph | PostgreSQL CTE (임시) → Neo4j AuraDB | Phase 3 |
