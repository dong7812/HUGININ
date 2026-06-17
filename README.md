# HUGININ

Claude Code 세션마다 무엇을 만들었고, 왜 그렇게 결정했는지를 git commit과 함께 자동으로 기록한다.

> **"AI로 만들기는 쉽다. 추적 관리하기는 어렵다."**

---

## 문제

Claude Code로 개발하면 결정이 빠르다. 그만큼 "왜 이렇게 됐지?"도 빠르게 사라진다.

- 커밋 메시지는 WHAT만 담는다 — WHY는 Claude 대화창 안에 있다
- 3주 뒤 같은 시도를 다시 한다 — 당시 시도한 걸 기억 못해서
- 팀이 있으면 더 심하다 — 팀원이 어떤 결정을 AI와 함께 내렸는지 서로 모른다

---

## 작동 방식

```
git commit
    │
    └─ post-commit hook (huginin hook install로 설치)
         │  Claude Code 세션 감지 → prompt + response + diff
         ▼
    POST /collect/event  →  DB 저장  →  Claude Haiku로 정제
         │
         ▼
    결정 타임라인 (huginin.vercel.app/workspace/...)
         ├─ 무엇을 만들었나
         ├─ 왜 필요했나
         ├─ AI vs 나의 역할 분담
         └─ 트레이드오프 (미룬 것, 선택한 이유)
```

---

## 기능

| 기능 | 설명 |
|------|------|
| **자동 수집** | git commit 시 Claude Code 세션 자동 감지 — 별도 입력 없음 |
| **Frame 분류** | A(인간 주도) / B(AI 보조) / C(AI 주도) / D(자동화) 자동 분류 |
| **AI 기여도** | 결정마다 AI 기여 % 자동 측정 |
| **결정 정제** | what_was_built / problem_solved / ai_role / tradeoffs 추출 |
| **시맨틱 검색** | "Redis 관련 결정 전부", "인증 방식 바꾼 이유" — 의미로 검색 |
| **AI 브리핑** | 전체 결정 데이터 분석 → 패턴, 미해결 트레이드오프, 다음 포커스 제안 |
| **MCP 연동** | Claude가 구현 전 과거 결정을 자동 참조 |
| **캐시 제안** | 반복 프롬프트 감지 → CLAUDE.md 최적화 제안 |
| **팀 댓글** | 각 결정에 팀 코멘트 |

---

## 시작하기

### 1. 회원가입

[huginin.vercel.app](https://huginin.vercel.app) → 회원가입 또는 Google로 가입

### 2. CLI 설치

```bash
curl -sSL https://huginin.vercel.app/install.sh | bash
```

### 3. 로그인

```bash
huginin login
# 브라우저가 열립니다 — 로그인 후 자동으로 CLI에 토큰이 전달됩니다
```

### 4. 프로젝트 연결 + Hook 설치

```bash
cd your-project
huginin project link
huginin hook install
```

이후 Claude Code로 커밋할 때마다 자동으로 기록됩니다.

---

## MCP 연결 (선택)

Claude가 구현 시작 전 과거 결정을 자동으로 참조하게 만들려면:

```json
{
  "mcpServers": {
    "huginin": {
      "url": "https://huginin-server-production.up.railway.app/mcp",
      "type": "sse",
      "headers": { "Authorization": "Bearer <service-token>" }
    }
  }
}
```

서비스 토큰 발급:

```bash
huginin login mcp-token
```

---

## 로컬 개발

### 사전 요구사항

- Docker & Docker Compose
- Python 3.12+
- Node.js 20+
- Go 1.22+

### 실행

```bash
# DB
docker-compose up -d postgres

# 서버
cd server
cp .env.example .env
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 대시보드
cd dashboard
npm install
npm run dev   # http://localhost:3000

# CLI (로컬 빌드)
cd cli
go build -o huginin .
./huginin login --server http://localhost:8000 --password
```

---

## 아키텍처

```
[Claude Code]
    │
    ├─ post-commit hook → POST /collect/event
    └─ MCP recall_decisions  ← 구현 전 자동 참조
              │
              ▼
       [FastAPI Server — Railway]
              ├─ PostgreSQL + pgvector (시맨틱 검색)
              ├─ Claude Haiku (결정 정제 + AI 브리핑)
              └─ Clean Architecture
              │
              ▼
       [Next.js Dashboard — Vercel]
              ├─ 결정 타임라인 (Frame / AI기여도 / what/why/how/tradeoffs)
              ├─ 시맨틱 + 텍스트 검색
              ├─ Frame A/B/C/D 필터
              ├─ AI 브리핑 슬라이드오버
              └─ 캐시 최적화 제안
```

---

## 기술 스택

| | |
|---|---|
| 서버 | FastAPI + asyncpg (Python 3.12) |
| DB | PostgreSQL + pgvector (384-dim HNSW cosine) |
| 임베딩 | fastembed BAAI/bge-small-en-v1.5 (CPU-only) |
| LLM | Claude Haiku (결정 정제, AI 브리핑) |
| 대시보드 | Next.js 16, React 19, TanStack Query 5, Zustand 5, Tailwind |
| CLI | Go 1.22 (darwin/linux amd64/arm64) |
| 배포 | Railway (서버) + Vercel (프론트) |

---

## 환경변수 (서버)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
ANTHROPIC_API_KEY=...

# 이메일 인증
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://<server>/auth/google/callback
FRONTEND_URL=https://huginin.vercel.app
```
