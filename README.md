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

### 1. Git hook 설치

```bash
curl -s https://api.huginin.dev/install | bash
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
