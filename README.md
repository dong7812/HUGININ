# HUGININ — Claude Code × Team Memory

Claude Code가 구현을 시작하기 전, 팀이 같은 문제를 어떻게 풀었는지 자동으로 확인한다.
`.mcp.json` 한 줄로 연결 — Git hook으로 자동 수집 — 시맨틱 검색으로 팀 전체 조회.

---

## 한 줄 요약

> **Claude Code가 구현 전 자동으로 `recall_decisions`를 호출해 팀 이력을 참조한다.**

---

## 작동 방식

```
[개발자 A]                          [개발자 B / 팀 전체]
  Claude Code 세션 시작
    │
    ▼
  [huginin.recall_decisions]        ← MCP 자동 호출
    │ "rate limiting API" 검색
    │ → 3주 전 token bucket 시도 → Redis 비용으로 반려
    │ → in-memory sliding window로 최종 결정
    ▼
  팀 이력 기반으로 구현...
    │
    ▼
  git commit -m "feat: rate limiting"
    │
    ├─ [huginin git hook]            ← post-commit 자동 실행
    │   prompt + response + diff + branch 수집
    │   임베딩 생성 → 팀 메모리 인덱싱
    │
    ▼
  워크스페이스 KB 업데이트            → B도 다음 세션에 참조 가능
```

---

## 로컬 개발 환경

### 사전 요구사항

- Docker & Docker Compose
- Python 3.12+
- Node.js 20+

### 1. 서버 실행

```bash
# 환경변수 설정
cp server/.env.example server/.env
# JWT_SECRET은 실제 값으로 교체 권장

# PostgreSQL + Kafka 시작
docker-compose up -d postgres kafka

# 의존성 설치 및 서버 실행
cd server
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

마이그레이션은 docker-compose에서 `postgres` 컨테이너 시작 시 자동 적용된다
(`server/infrastructure/persistence/migrations/`가 init 디렉토리로 마운트됨).

### 2. 대시보드 실행

```bash
cd dashboard
npm install
npm run dev   # http://localhost:3000
```

### 3. MCP 로컬 연결 (선택)

```json
// 테스트할 프로젝트의 .mcp.json
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

### 1. Claude Code에 연결

```json
// .mcp.json (프로젝트 루트)
{
  "mcpServers": {
    "huginin": {
      "url": "https://api.huginin.dev/mcp",
      "type": "sse"
    }
  }
}
```

Claude Code 재시작 → 자동 연결 완료.

### 2. Git hook 설치

```bash
# 프로젝트 루트에서
curl -s https://api.huginin.dev/install | bash
```

커밋마다 `prompt + response + diff + branch` 자동 수집 시작.

### 3. 대시보드 확인

팀의 AI 결정 타임라인, 시맨틱 검색, 토큰 분석: `https://app.huginin.dev`

---

## MCP 도구

Claude Code에 노출되는 두 가지 도구:

| 도구 | 설명 | 호출 시점 |
|---|---|---|
| `recall_decisions` | 팀 이력 시맨틱 검색 (cross-workspace) | 구현 시작 전 자동 |
| `collect_event` | AI 결정 수집 | Git hook에서 자동 |

---

## 경쟁 서비스 비교

| | Git AI | LangSmith / Langfuse | **HUGININ** |
|---|---|---|---|
| 주요 질문 | 이 코드 누가 만들었나? | LLM 호출 비용/성능? | 왜 이 결정을 내렸나? |
| 저장 위치 | Git Notes (로컬) | 중앙 DB | 중앙 DB + pgvector |
| AI 참조 | 없음 | 없음 | **Claude가 구현 전 자동 참조** |
| 팀 검색 | 불가 | 불가 | 시맨틱 검색 (cross-workspace) |
| 수집 방식 | 라인 귀속 | SDK 설치 | MCP + Git hook |

---

## 아키텍처

```
[Claude Code]
     │
     ├─ MCP (recall_decisions)  ←─ 구현 전 팀 이력 조회
     │
     └─ MCP (collect_event)     ←─ Git hook이 대신 호출
          │
          ▼
     [FastAPI Server]
          ├─ PostgreSQL + pgvector (384-dim, fastembed BAAI/bge-small-en-v1.5)
          ├─ HNSW 인덱스 (cosine similarity)
          └─ cross-workspace recall (workspace_members JOIN)
          │
          ▼
     [Next.js Dashboard]
          ├─ 의사결정 타임라인 (diff / response / commit 연결)
          ├─ ILIKE 텍스트 검색
          ├─ 시간 범위 필터 (오늘 / 이번 주 / 전체)
          └─ 팀 토론 (event 단위 코멘트)
```

---

## 기술 스택

| 레이어 | 선택 | 비고 |
|---|---|---|
| MCP 서버 | FastAPI + `fastapi-mcp` | REST API와 단일 서비스 |
| 임베딩 | fastembed BAAI/bge-small-en-v1.5 (384-dim) | CPU-only, 로컬 실행, 무료 |
| Vector DB | PostgreSQL + pgvector (HNSW, cosine) | 관계형과 벡터 단일 DB |
| 인증 | JWT (argon2) | |
| 대시보드 | Next.js 16 App Router, React 19, TanStack Query 5 | |
| 상태 관리 | Zustand 5 (client state) | |
| 아키텍처 | Clean Architecture (domain → application → infrastructure) | |

---

## 핵심 설계 원칙

- **MCP-First**: 개발자가 직접 호출하지 않아도 Claude가 자동으로 팀 이력을 참조
- **Zero-Config Collection**: Git hook이 자동 수집 — 코딩 습관 변경 없음
- **Team Memory**: Claude Memory는 나만 안다, HUGININ은 팀 전체가 공유한다
- **Decision Context**: 단순 코드 귀속이 아닌 "왜 이 결정을 내렸나"를 저장
- **Async Everything**: 임베딩 생성, 수집 모두 백그라운드 — 사용자 워크플로우 블로킹 없음
