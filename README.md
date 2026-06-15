# HUGININ — AI 협업 가시화

팀이 AI로 개발할 때 서로 뭘 하는지 보이지 않는다.
누가 어떤 결정을 AI와 함께 내렸는지, AI가 어디서 어떻게 기여했는지 — HUGININ이 보여준다.

---

## 방향성 — 흔들리지 않는 기준

**핵심 문제**: 팀 AI 협업의 블랙박스.
누가 어떤 결정을 AI와 함께 내렸는지, AI가 구조를 제안했는지 개발자가 주도했는지 — 팀이 모른다.
프롬프트는 공유되지 않고, AI 기여는 불명확하고, 결정 맥락은 사라진다.

**해결 방향**: AI 협업 가시화. 단순 로그 저장이 아니라 **결정 단위 AI 기여도 분석**이 북극성이다.

이 방향에서 흔들리지 않는 기준:

| 질문 | 답 |
|---|---|
| "MD 파일과 뭐가 달라?" | 의식적 공유 불필요 + 결정 단위 기여도 분석. MD 파일은 둘 다 없다. |
| "LangSmith와 뭐가 달라?" | LLM 비용/성능이 아닌 팀 협업 패턴을 본다 |
| "Git AI와 뭐가 달라?" | 코드 라인 귀속이 아닌 의사결정 흐름 안에서 AI 역할을 본다 |
| "Claude Memory와 뭐가 달라?" | Claude Memory는 개인. HUGININ은 팀 단위 |

**북극성 기능**: collab-proof Frame A/B/C/D를 팀 스케일로 확장

```
Frame A — 기술적 복잡도  (이 결정이 얼마나 복잡한가)
Frame B — 불확실성       (개발자가 확신 없이 진행했는가)
Frame C — 분기           (대안을 비교하고 선택했는가)
Frame D — AI 기여도      (AI가 실제로 무엇을 했는가 — 구조 제안 / 구현 생성 / 문제 발견)
```

collab-proof는 현재 Claude Code 세션에서 개인 단위로 이 분석을 수행한다.
HUGININ의 목표는 이걸 서버 이식해서 팀 스케일로 — 모든 커밋에서 자동으로, 팀 타임라인에서 함께 보이게.

---

## 왜 만들었나

팀에서 AI 도구를 각자 쓰기 시작하면 세 가지 문제가 생긴다.

1. **프롬프트는 공유되지 않는다** — 팀원이 비슷한 시도를 중복으로 하고 있어도 서로 모른다
2. **AI 기여가 불명확하다** — 이 결정이 개발자 판단인지 AI 판단인지 팀이 모른다
3. **결정 맥락이 사라진다** — 코드는 남지만 왜 그렇게 됐는지는 남지 않는다

MD 파일로 정리해서 공유하는 방식은 "의식적으로 쓰는 사람"이 있어야 작동한다.
HUGININ은 Git hook이 자동으로 수집하고, 팀 타임라인이 자동으로 만들어진다.

---

## 현재 상태 (Phase 1 완료)

**지금 보여주는 것**: 자동 수집 + 팀 타임라인

```
팀원 A  feat/notification  14:32
  └ "Redis pub/sub으로 알림 시스템 만들어줘" (프롬프트 요약)
  └ diff: 3 files changed, branch: feat/notification
  └ 팀 코멘트 2개

팀원 B  feat/auth  11:15
  └ "JWT refresh token 전략 짜줘"
  └ diff: 1 file changed
```

누가, 언제, 어떤 브랜치에서, 어떤 프롬프트로 AI를 썼는지 팀이 볼 수 있다.
검색, 시맨틱 유사도 조회, MCP 연결(Claude가 구현 전 자동 참조)도 동작한다.

**Phase 2 목표**: 결정 단위 AI 기여도 분석 (collab-proof Frame A/B/C/D 서버 이식)

```
팀원 A  feat/notification  14:32
  └ WebSocket → SSE 전환 결정
    Frame D: AI 기여 높음 — 구조 제안 + 연결 관리 복잡성 발견
    Frame C: 대안 비교 있음 — WebSocket vs SSE
    Frame B: 개발자 불확실성 있음
```

---

## 로컬 개발 환경

### 사전 요구사항

- Docker & Docker Compose
- Python 3.12+
- Node.js 20+
- Go 1.22+ (CLI 빌드용)

### 0. CLI 설치

```bash
make install
# ~/.local/bin/huginin 에 설치됨

# PATH에 없으면 한 번만 추가:
export PATH="$HOME/.local/bin:$PATH"
# 영구 적용: ~/.zshrc 또는 ~/.bashrc 에 위 줄 추가
```

설치 확인:

```bash
huginin --help
```

### 1. 서버 실행

```bash
cp server/.env.example server/.env
# JWT_SECRET은 실제 값으로 교체 권장

docker-compose up -d postgres kafka

cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

마이그레이션은 postgres 컨테이너 시작 시 자동 적용된다
(`server/infrastructure/persistence/migrations/`가 init 디렉토리로 마운트됨).

### 2. 대시보드 실행

```bash
cd dashboard
npm install
npm run dev   # http://localhost:3000
```

### 3. MCP 로컬 연결 (선택)

```json
{
  "mcpServers": {
    "huginin": {
      "url": "http://localhost:8000/mcp",
      "type": "sse"
    }
  }
}
```

---

## 프로덕션 시작하기

### 1. CLI + Git hook 설치

```bash
# HUGININ 저장소 클론 후:
make install                        # CLI 빌드 → ~/.local/bin/huginin
export PATH="$HOME/.local/bin:$PATH"

# 추적할 프로젝트 저장소로 이동:
bash /path/to/HUGININ/hooks/install.sh .
```

커밋마다 `prompt + response + diff + branch` 자동 수집 시작.

### 2. MCP 연결 (선택)

```json
// .mcp.json
{
  "mcpServers": {
    "huginin": {
      "url": "https://api.huginin.dev/mcp",
      "type": "sse"
    }
  }
}
```

### 3. 대시보드

`https://app.huginin.dev`

---

## 기존 방식과의 차이

| | MD 파일 공유 | Git AI | LangSmith | **HUGININ** |
|---|---|---|---|---|
| 수집 방식 | 직접 작성 | 코드 라인 귀속 | SDK 설치 | Git hook 자동 수집 ✅ |
| 무엇을 저장 | 정리된 요약 | AI 생성 코드 라인 | LLM 요청/응답 | 프롬프트 + 응답 + diff + 맥락 ✅ |
| 팀 가시화 | 수동 공유 | 불가 (로컬) | 없음 | 실시간 팀 타임라인 ✅ |
| AI 기여도 분석 | 없음 | 라인 수준 귀속 | 없음 | 결정 단위 역할 분석 (Phase 2) |
| AI 능동 참조 | 없음 | 없음 | 없음 | MCP로 구현 전 자동 확인 ✅ |

---

## MCP 도구

| 도구 | 설명 | 호출 시점 |
|---|---|---|
| `recall_decisions` | 팀 이력 시맨틱 검색 (cross-workspace) | 구현 시작 전 자동 |
| `collect_event` | AI 결정 수집 | Git hook에서 자동 |

---

## 아키텍처

```
[Claude Code / MCP 호환 도구]
     │
     ├─ recall_decisions  ←─ 구현 전 팀 이력 조회 (MCP)
     └─ collect_event     ←─ Git hook post-commit 자동 호출
          │
          ▼
     [FastAPI Server]
          ├─ PostgreSQL + pgvector (384-dim, HNSW, cosine)
          ├─ fastembed BAAI/bge-small-en-v1.5 (백그라운드 임베딩)
          └─ Clean Architecture (domain → application → infrastructure)
          │
          ▼
     [Next.js Dashboard]
          ├─ 팀 AI 결정 타임라인
          ├─ 텍스트 / 시맨틱 검색
          ├─ 시간 범위 + 브랜치 필터
          └─ 팀 코멘트
```

---

## ETL 파이프라인

커밋 하나가 팀 타임라인에 게시되기까지의 전체 흐름.

### 1. Extract — 수집

```
git commit
   │
   └─ hooks/post-commit  (huginin hook install로 설치)
          │  raw_prompt, raw_response, diff, branch, commit_hash
          ▼
   POST /collect/event                              collect_router.py
          │
          ├─ JWT Bearer → user_id 검증              rbac_middleware.py
          ├─ user_repo.find_by_id() → user.name     pg_user_repository.py
          ├─ RegexPiiMasker.mask()                  pii_masker.py
          │   (이메일, API 키, 토큰 패턴 제거)
          ├─ DecisionEvent.create() → DB INSERT     pg_event_repository.py
          │   status = "pending"
          └─ KafkaProducer.publish_event()          kafka_producer.py
```

### 2. Transform — 백그라운드 분석 (asyncio.create_task)

두 작업이 응답과 무관하게 병렬 실행됩니다:

```
event 저장 직후
   │
   ├─ _embed_async()
   │      fastembed BAAI/bge-small-en-v1.5          embedding_service.py
   │      prompt + response → 384-dim float[]
   │      UPDATE decision_events SET embedding = $1::vector
   │
   └─ _refine_async()
          claude_refiner.refine_event()              claude_refiner.py
          모델: claude-haiku-4-5-20251001
          입력: prompt[:2000] + response[:2000] + diff[:600] + user_name
          │
          ▼ structured JSON output
          {
            "frame":          "A" | "B" | "C" | "D",
            "ai_contribution": 0.0–1.0,
            "decision_type":  "feature" | "bugfix" | ...,
            "what_was_built": "구체적 기술 결과물",
            "problem_solved": "해결한 문제/맥락",
            "ai_role":        "AI vs {user_name} 역할 분담"
          }
          │
          ▼
          UPDATE decision_events                     pg_event_repository.py
             SET frame, ai_contribution, decision_type,
                 what_was_built, problem_solved, ai_role
           WHERE id = $1
          status → "refined"
```

**Frame 정의**

| Frame | 의미 | 예시 |
|---|---|---|
| A | AI 조언, 개발자 결정·코딩 | "이 접근이 맞는지 확인해줘" |
| B | 개발자 방향 지시, AI가 30–70% 구현 | "JWT refresh token 구현해줘" |
| C | AI가 제안+구현, 개발자 검토·승인 | 전체 모듈 설계를 AI가 제안 |
| D | AI 전자동, 최소 인간 개입 | 마이그레이션 스크립트 자동 생성 |

### 3. Backfill — 서버 시작 시 재처리

서버 재시작 시 `what_was_built IS NULL`인 이벤트를 순차 재분석합니다:

```python
# main.py — _backfill_refinement()
SELECT e.id, e.raw_prompt, e.raw_response, e.diff, u.name AS user_name
FROM decision_events e
JOIN users u ON u.id = e.user_id
WHERE e.what_was_built IS NULL
ORDER BY e.created_at DESC

# 이벤트마다 refine_event() 호출 후 0.5s 대기 (API 레이트 리밋)
```

### 4. Load — 서빙

```
GET /dashboard/{workspace_id}/feed                 dashboard_router.py
   │
   └─ SELECT e.*, u.name AS user_name, u.email AS user_email
      FROM decision_events e
      JOIN users u ON u.id = e.user_id
      WHERE workspace_id = $1
      ORDER BY created_at DESC

      → FeedItemResponse (frame, ai_contribution, what_was_built,
                          problem_solved, ai_role, user_name, ...)
   │
   ▼
DecisionTimeline.tsx                               dashboard/src/...
   ├─ whatWasBuilt   → 헤드라인
   ├─ problemSolved  → 서브텍스트 (왜 필요했나)
   └─ aiRole         → 펼침 카드 (AI vs {userName} 역할)
```

### DB 스키마 — decision_events 핵심 컬럼

```sql
-- 수집 시 기록
raw_prompt      TEXT        -- PII 마스킹 후 프롬프트
raw_response    TEXT        -- AI 응답
diff            TEXT        -- git diff
commit_hash     VARCHAR     -- 멱등성 키
branch          VARCHAR
status          VARCHAR     -- 'pending' → 'refined'

-- ETL 분석 후 기록 (migration 004, 005)
frame           CHAR(1)     -- A / B / C / D
ai_contribution FLOAT       -- 0.0–1.0
decision_type   VARCHAR     -- feature / bugfix / ...
what_was_built  TEXT        -- 무엇을 만들었나
problem_solved  TEXT        -- 왜 필요했나
ai_role         TEXT        -- AI vs 개발자 역할

-- 임베딩 (migration 003)
embedding       VECTOR(384) -- fastembed HNSW cosine
```

---

## 기술 스택

| 레이어 | 선택 | 비고 |
|---|---|---|
| MCP 서버 | FastAPI + `fastapi-mcp` | REST API와 단일 서비스 |
| 임베딩 | fastembed BAAI/bge-small-en-v1.5 (384-dim) | CPU-only, 무료 |
| Vector DB | PostgreSQL + pgvector (HNSW, cosine) | 관계형과 벡터 단일 DB |
| 인증 | JWT (argon2) | |
| 대시보드 | Next.js 16 App Router, React 19, TanStack Query 5 | |
| 아키텍처 | Clean Architecture | |

---

## 핵심 설계 원칙

- **Visibility-First**: 팀의 AI 협업 패턴을 가시화하는 것이 핵심 — 저장이 목적이 아니다
- **Zero-Config Collection**: Git hook 자동 수집 — 프롬프트를 따로 공유하거나 정리할 필요 없음
- **Decision-Level Attribution** *(Phase 2)*: 코드 라인 귀속이 아닌 결정 단위 AI 기여도 분석
- **Team Scope**: 개인 도구가 아닌 팀 단위 — 워크스페이스 전체에서 패턴을 본다
- **Async Everything**: 임베딩 생성, 수집 모두 백그라운드 — 개발 흐름을 끊지 않는다
