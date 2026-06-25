# HUGININ

**Git이 코드 이력을 남기듯, HUGININ은 AI 결정 이력을 남긴다.**

Claude Code · agy · codex로 커밋할 때마다 무엇을, 왜, 어떻게 결정했는지가 자동으로 쌓인다.  
지금 쌓지 않으면 6개월 뒤에도 없다.

→ **[huginin.com](https://huginin.com)**

---

## 문제

```
git log --oneline

a3f2c1d  refactor: simplify auth          ← 6개월 전
```

커밋 diff는 무엇이 바뀌었는지만 보여준다.  
**왜 그 결정을 내렸는지, Claude가 어떻게 기여했는지는 사라진다.**

---

## HUGININ이 남기는 것

```
같은 커밋, HUGININ 역추적 결과

왜    OAuth 세션 만료로 UX 깨짐 → 자동 갱신 필요
AI    refresh token rotation + silent renewal 구현 주도
검토  cookie session 유지 방안 → CORS 이슈로 제외
기여  AI-led (ai_contribution: 0.82)
```

---

## 비교

|  | Git | HUGININ | Claude Skill |
|---|---|---|---|
| 무엇을 저장 | 코드 변경 | AI 결정 이력 | — |
| 언제 | 커밋마다 자동 | 커밋마다 자동 | 물어볼 때만 |
| 역추적 | diff 수준 | 왜 그 결정인지까지 | 과거 데이터 없음 |
| 팀 누적 | ✅ | ✅ | ❌ |

"Grill Me 쓰면 되지 않나?" → Grill Me는 지금 분석. HUGININ은 과거 역추적.

---

## 작동 방식

```
huginin               ← TUI 실행 (PTY 멀티플렉서)
    │
    ├─ Claude Code · agy · codex 중 하나를 PTY로 실행
    │   Ctrl+\  →  CLI 전환 (컨텍스트 자동 이어받기)
    │
    └─ git commit 시 post-commit hook 자동 실행
         │  tool별 세션 JSONL → 실제 대화 추출 (8시간 윈도우)
         │  prompt + response + diff + tool
         ▼
    POST /collect/event → DB 저장 → Claude Haiku ETL

    ETL 추출 결과:
    ├─ what_was_built   — 무엇을 만들었나
    ├─ problem_solved   — 왜 필요했나
    ├─ ai_role          — AI가 어떤 역할을 했나
    ├─ tradeoffs        — 검토했으나 버린 대안
    ├─ frame            — A(Human-led) / B(AI-assisted) / C(AI-led) / D(Automated)
    └─ ai_contribution  — 0.0–1.0
```

---

## 시작하기

```bash
# 1. CLI 설치
curl -sSL https://huginin.com/install.sh | bash

# 2. 로그인
huginin login

# 3. 레포 연결 + git hook 설치 (한 번에)
cd your-project
huginin setup

# 4. TUI 진입 — Claude · agy · codex 중 선택, Ctrl+\로 전환
huginin

# 이후 커밋할 때마다 자동 기록
```

과거 커밋 소급 수집:
```bash
huginin backfill
```

---

## MCP 연결

새 Claude 세션 시작 전 과거 팀 결정이 자동으로 참조된다.

```json
{
  "mcpServers": {
    "huginin": {
      "url": "https://api.huginin.com/mcp",
      "type": "sse",
      "headers": { "Authorization": "Bearer <service-token>" }
    }
  }
}
```

```bash
huginin service-token
```

---

## 기능 현황

| 기능 | 상태 |
|---|---|
| git commit 시 AI 대화 자동 수집 (claude · agy · codex) | ✅ |
| huginin TUI — PTY 멀티플렉서 (Ctrl+\ CLI 전환) | ✅ |
| Claude Haiku ETL (7개 필드 자동 추출) | ✅ |
| Frame A/B/C/D 자동 분류 | ✅ |
| 결정 타임라인 (팀 피드 + 필터) | ✅ |
| 시맨틱 검색 (pgvector + LLM) | ✅ |
| MCP recall_decisions | ✅ |
| AI 브리핑 | ✅ |
| 컨텍스트 추출 (3단계 Markdown 다운로드) | ✅ |
| huginin setup (연결 + hook 한 번에) | ✅ |
| huginin backfill (과거 커밋 소급) | ✅ |
| 파일 기반 역추적 | Phase 2 |
| 검색 고도화 (MMR + 하이브리드) | Phase 3 |
| 결정 그래프 시각화 | Phase 3 |

---

## 아키텍처

```
[huginin TUI — PTY 멀티플렉서]
    │  Ctrl+\: claude ↔ agy ↔ codex 전환 (컨텍스트 이어받기)
    │
    ├─ [Claude Code PTY]   ─┐
    ├─ [agy PTY]            ├─ post-commit hook → POST /collect/event
    └─ [codex PTY]         ─┘   └─ MCP recall_decisions
                                         │
                                         ▼
                                  [FastAPI — Railway]
                                         ├─ PostgreSQL + pgvector
                                         ├─ Claude Haiku ETL
                                         └─ Clean Architecture
                                         │
                                         ▼
                                  [Next.js — Vercel]
```

| | |
|---|---|
| 서버 | FastAPI + asyncpg (Python 3.12) |
| DB | PostgreSQL + pgvector (384-dim HNSW cosine) |
| 임베딩 | fastembed BAAI/bge-small-en-v1.5 (CPU-only) |
| LLM | Claude Haiku (ETL) · Claude Sonnet (브리핑) |
| 대시보드 | Next.js 16, React 19, TanStack Query 5 |
| CLI | Go 1.22 + Bubble Tea (darwin/linux arm64/amd64) |
| 배포 | Railway + Vercel |

---

## 로컬 개발

```bash
# DB
docker-compose up -d postgres

# 서버
cd server && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 대시보드
cd dashboard && npm install && npm run dev

# CLI
cd cli && go build -o huginin .
./huginin login --server http://localhost:8000
```
