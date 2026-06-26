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

### 문서 임포트 (콜드스타트 해결)

```
huginin import DECISIONS.md
    │
    ├─ # ## ### 헤딩 기준 섹션 분리
    ├─ 코드베이스 grep → 관련 스니펫 추출
    │
    ▼
POST /workspace/{id}/import-doc
    │
    └─ 백그라운드: Claude Haiku ETL + 임베딩
         ├─ what_was_decided / why / alternatives / constraints
         ├─ validation_status (consistent | outdated | unverifiable)
         └─ pgvector 저장 → MCP 검색 대상에 포함
```

프로젝트 중간에 HUGININ을 도입해도 기존 ADR·README·DECISIONS.md를 임포트하면 이전 결정 맥락을 복구할 수 있다.

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

기존 문서 임포트:
```bash
huginin import DECISIONS.md
huginin import README.md
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
| 시맨틱 검색 (pgvector + LLM 합성) | ✅ |
| MCP recall_decisions | ✅ |
| AI 브리핑 | ✅ |
| 컨텍스트 추출 (3단계 Markdown 다운로드) | ✅ |
| huginin setup (연결 + hook 한 번에) | ✅ |
| huginin backfill (과거 커밋 소급) | ✅ |
| huginin import (문서 ETL + 코드 검증) | ✅ |
| 문서 검토 큐 (대시보드 인라인 카드뷰) | ✅ |
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
    └─ [codex PTY]         ─┘
    │
    └─ huginin import → POST /workspace/{id}/import-doc
                              │
                              ▼
                       [FastAPI — Railway]
                              ├─ PostgreSQL + pgvector
                              ├─ Claude Haiku ETL (commit + doc)
                              ├─ fastembed (384-dim, 로컬 CPU)
                              ├─ MCP recall_decisions
                              └─ Clean Architecture
                              │
                              ▼
                       [Next.js — Vercel]
                              ├─ 결정 타임라인 (코드 이력 탭)
                              ├─ 문서 탭 (인라인 카드뷰 + 검토 큐)
                              └─ 시맨틱 검색 + AI 브리핑
```

| | |
|---|---|
| 서버 | FastAPI + asyncpg (Python 3.12) |
| DB | PostgreSQL + pgvector (384-dim HNSW cosine) |
| 임베딩 | fastembed paraphrase-multilingual-MiniLM-L12-v2 (CPU-only) |
| LLM | Claude Haiku (ETL) · Claude Sonnet (브리핑·검색) |
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
