# HUGININ — AI 협업 가시화

팀이 AI로 개발할 때 서로 뭘 하는지 보이지 않는다.
누가 어떤 결정을 AI와 함께 내렸는지, AI가 어디서 어떻게 기여했는지 — HUGININ이 보여준다.

---

## 왜 만들었나

팀에서 AI 도구를 각자 쓰기 시작하면 세 가지 문제가 생긴다.

1. **프롬프트는 공유되지 않는다** — 팀원이 비슷한 시도를 중복으로 하고 있어도 서로 모른다
2. **AI 기여가 불명확하다** — 이 결정이 개발자 판단인지 Claude 판단인지 팀이 모른다
3. **결정 맥락이 사라진다** — 코드는 남지만 왜 그렇게 됐는지는 남지 않는다

MD 파일로 정리해서 공유하는 방식은 "의식적으로 쓰는 사람"이 있어야 작동한다.
HUGININ은 Git hook이 자동으로 수집하고, 팀 타임라인이 자동으로 만들어진다.

---

## 무엇을 보여주나

```
팀원 A  feat/notification  14:32
  └ WebSocket → SSE 전환 결정
    AI: 구조 제안  |  개발자: 방향 결정  |  AI: 연결 관리 복잡성 발견

팀원 B  feat/auth  11:15
  └ JWT refresh token 전략
    개발자: 주도  |  AI: 구현 생성

팀원 C  fix/query-perf  09:40
  └ N+1 쿼리 최적화
    AI: 문제 발견  |  개발자: 해결책 결정
```

누가, 어떤 결정에서, AI를 어떻게 활용했는지 팀 단위로 가시화한다.

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

## 기존 방식과의 차이

| | MD 파일 공유 | Git AI | LangSmith | **HUGININ** |
|---|---|---|---|---|
| 수집 방식 | 직접 작성 | 코드 라인 귀속 | SDK 설치 | Git hook 자동 수집 |
| 무엇을 저장 | 정리된 요약 | AI 생성 코드 라인 | LLM 요청/응답 | 프롬프트 + 응답 + diff + 맥락 |
| AI 기여도 | 없음 | 라인 수준 귀속 | 없음 | **결정 단위 역할 분석** |
| 팀 가시화 | 수동 공유 | 불가 (로컬) | 없음 | **실시간 팀 타임라인** |
| AI 능동 참조 | 없음 | 없음 | 없음 | MCP로 구현 전 자동 확인 |

## MCP 도구

Git hook 외에 Claude Code에 직접 연결할 수 있다.

| 도구 | 설명 | 호출 시점 |
|---|---|---|
| `recall_decisions` | 팀 이력 시맨틱 검색 (cross-workspace) | 구현 시작 전 자동 |
| `collect_event` | AI 결정 수집 | Git hook에서 자동 |

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

- **Visibility-First**: 팀의 AI 협업 패턴을 가시화하는 것이 핵심 — 저장이 목적이 아니다
- **Zero-Config Collection**: Git hook이 자동 수집 — 프롬프트를 따로 공유하거나 정리할 필요 없음
- **Decision-Level Attribution**: 코드 라인 귀속이 아닌 결정 단위 AI 기여도 분석
- **Team Scope**: 개인 도구가 아닌 팀 단위 — 워크스페이스 전체에서 패턴을 본다
- **Async Everything**: 임베딩 생성, 수집 모두 백그라운드 — 개발 흐름을 끊지 않는다
