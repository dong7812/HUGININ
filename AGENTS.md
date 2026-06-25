# HUGININ 시스템 구성 요소

## 방향성 요약

**포지셔닝**: AI 의사결정 버전 관리 — Git이 코드 이력을 남기듯, HUGININ은 AI 결정 이력을 남긴다.

**핵심 가치 순서**:
1. **자동 수집** — git commit 시 AI 대화(claude · agy · codex)가 자동으로 쌓인다. 별도 입력 없음.
2. **역추적** — 6개월 전 결정도 왜 그렇게 했는지 꺼낼 수 있다.
3. **지식베이스** — 쌓인 이력이 팀 자산이 된다. MCP로 새 세션에 주입된다.

```
Phase 1 ✅  자동 수집 파이프 + ETL 정제 + 팀 타임라인 + huginin TUI (PTY 멀티플렉서)
Phase 2     역추적 인터페이스 강화 + 지식베이스 뷰
Phase 3     결정 그래프 + Neo4j + 검색 고도화 (MMR)
```

---

## 현재 아키텍처 (Phase 1 ✅ 완료)

```
[huginin TUI — PTY 멀티플렉서]
     │  Ctrl+\: claude ↔ agy ↔ codex 전환 (컨텍스트 자동 이어받기)
     │  각 CLI를 별도 PTY로 실행; syscall.Select polling (macOS blocking Read 회피)
     │
     ├── [Claude Code PTY]  ─┐
     ├── [agy PTY]           ├── post-commit hook
     └── [codex PTY]        ─┘     └── POST /collect/event
                                         ├── raw_prompt (실제 AI 대화)
                                         ├── raw_response
                                         ├── diff / branch / commit_hash / committed_at
                                         ├── tool (claude / agy / codex)
                                         └── Claude Haiku ETL 백그라운드 정제
                                               → frame (A/B/C/D)
                                               → ai_contribution (0.0–1.0)
                                               → what_was_built / problem_solved / ai_role / tradeoffs

     MCP recall_decisions
           └── GET /memory/recall?q=...
                 └── fastembed 임베딩 → pgvector cosine search
                     → 과거 팀 결정 컨텍스트 주입
     │
     ▼
[FastAPI 서버 — Railway]
     ├── Clean Architecture (domain → application → infrastructure → interfaces)
     ├── PostgreSQL + pgvector (HNSW, cosine, 384-dim)
     ├── asyncio 백그라운드 ETL + 임베딩 백필
     └── backfill — 과거 커밋 소급 수집 + FORCE_REREFINE 재정제
     │
     ▼
[Next.js Dashboard — Vercel]
     ├── 결정 타임라인 (Frame / 브랜치 / 시간 범위 필터)
     ├── 시맨틱 검색 (pgvector + LLM 합성)
     ├── Frame A/B/C/D 분포 + AI 기여도 추이 차트
     ├── AI 브리핑 슬라이드오버 + 팀 코멘트
     └── 컨텍스트 추출 (3단계 Markdown 다운로드)
```

---

## Phase 2 아키텍처 (예정) — 역추적 인터페이스 강화

Phase 1에서 수집 + ETL 완료. Phase 2는 쌓인 데이터를 역추적과 지식베이스로 꺼내 쓰는 인터페이스.

```
역추적 쿼리 (파일/키워드)
     │
     └── GET /dashboard/{id}/traceback?file=auth.py
           └── decision_events WHERE diff LIKE '%auth.py%'
               + pgvector 시맨틱 검색
               → 이 파일을 건드린 AI 결정들 타임라인 + 당시 맥락
     │
     ▼
지식베이스 뷰
     └── decision_type 별 집계 / 팀 패턴 요약 / related decisions 패널
```

---

## 수집 경로

### 경로 1: Git Hook (post-commit, 권장)

```bash
git commit -m "feat: add rate limiting"
# → huginin hook → POST /collect/event
#   { raw_prompt, raw_response, diff, branch, commit_hash, committed_at, tool }
```

hook JSONL 추출 로직:
- tool 자동 감지 (claude / agy / codex) → event.tool 필드로 저장
- claude: `~/.claude/` 내 `-mmin -480` (8시간 이내) JSONL 파일 스캔
- agy: `~/.agy/` 세션 JSONL 유사 방식
- `type=user` + `type=text` 메시지를 PROMPT로 추출 (`tool_result` 건너뜀)
- `type=assistant` + `type=text` 메시지를 RESPONSE로 추출

### 경로 2: MCP collect_event

Claude Code가 직접 호출. 커밋 없는 세션에서도 수집 가능.

### git 엣지 케이스

| 케이스 | 처리 |
|---|---|
| rebase / squash / amend | hash-map.json에 원본 해시 보존 |
| force push | diverged history 감지 → reconcile 플래그 |
| CI/CD 환경 | CI=true 감지 → 수집 자동 건너뜀 |
| 동시 AI 도구 | session.lock으로 충돌 방지 |

---

## ETL 파이프라인 (Claude Haiku)

**입력**: raw_prompt + raw_response + diff  
**출력**: 7개 필드 자동 추출

| 필드 | 설명 |
|---|---|
| `frame` | A(Human-led) / B(AI-assisted) / C(AI-led) / D(Automated) |
| `ai_contribution` | 0.0–1.0 (AI가 얼마나 기여했나) |
| `what_was_built` | 무엇을 만들었나 |
| `problem_solved` | 왜 필요했나 |
| `ai_role` | AI가 어떤 역할을 했나 |
| `tradeoffs` | 어떤 트레이드오프가 있었나 |
| `decision_type` | bugfix / feature / refactor / architecture / other |

**backfill**: 서버 시작 시 `what_was_built IS NULL` 레코드 자동 재정제 (0.5s 간격)  
**FORCE_REREFINE=1**: 모든 ETL 필드 초기화 후 전체 재정제 트리거

---

## 임베딩 파이프라인

**모델**: fastembed BAAI/bge-small-en-v1.5 (384-dim)

- CPU-only, 로컬 실행, 무료
- lazy singleton — 첫 요청 시 로드
- `asyncio.run_in_executor(None, ...)` — CPU 작업 이벤트 루프 외부 실행
- 초기 임베딩: raw_prompt 기반 / 재임베딩: ETL 정제 후 what_was_built + problem_solved + ai_role 기반

---

## 백엔드 계층 구조

```
domain/
  entities/           # DecisionEvent, Workspace, User ...
  repositories/       # 인터페이스 (추상)

application/
  use_cases/          # CollectEventUseCase, GetFeedUseCase ...

infrastructure/
  persistence/        # PgEventRepository ...
  embedding/          # EmbeddingService (fastembed)
  llm/                # claude_refiner.py (Haiku ETL)
  security/           # JwtService, Argon2PasswordService, RegexPiiMasker
  messaging/          # KafkaProducer / NullQueuePort

interfaces/
  http/routers/       # FastAPI 라우터
  mcp/                # FastApiMCP 마운트
```

---

## 대시보드 구조

```
WorkspaceDashboard (Client)   ← timeRange + searchQuery state
  ├── OverviewCards           시간 범위 필터 (오늘/이번 주/전체)
  ├── DecisionTimeline        이벤트 피드 + 검색 + diff 뷰 + 코멘트
  ├── FrameStats              Frame A/B/C/D 분포 + 팀원별 AI 기여도 패턴
  ├── AiTrendChart            AI 기여도 추이 (날짜별)
  ├── PmBriefingButton        AI 브리핑 슬라이드오버 트리거
  └── WorkspaceSettings       초대코드 생성 + 워크스페이스 삭제 모달
```

**서버 상태**: TanStack Query 5 (`useFeedQuery`, `useSearchQuery`, `useWorkspacesQuery`)  
**클라이언트 상태**: Zustand 5 (워크스페이스 ID, 인증 토큰)

---

## CLI TUI 세션

`huginin` 단독 실행 시 Bubble Tea REPL 진입.

```
cli/interfaces/tui/session.go
  ├── Init()      — 웰컴 메시지 (tea.Println, alt screen 없음)
  ├── Update()    — textinput + KeyEnter → dispatch
  ├── dispatch()  — claude: tea.ExecProcess
  │                 login:  tea.ExecProcess(os.Args[0], "login")
  │                 logout: ks.Clear() + config.Save
  │                 workspace [list|current]
  │                 help / exit / quit
  └── View()      — textinput.View() (prompt 라인만)
```

- `tea.WithAltScreen()` 제거 — Claude Code 터미널 제어와 충돌
- `tea.ExecProcess` — subprocess에 stdin/stdout 완전 위임 (claude 정상 핸드오프)

---

## huginin TUI — PTY 멀티플렉서

`huginin` 단독 실행 시 PTY 멀티플렉서 진입 (기존 Bubble Tea REPL 대체).

```
cli/interfaces/tui/multiplexer.go
  ├── Multiplexer struct
  │     ├── ptys map[string]*os.File   — CLI별 PTY
  │     ├── active string              — 현재 활성 CLI
  │     ├── paused bool                — 전환 중 출력 차단
  │     └── suppressing bool          — context 주입 중 echo 차단
  │
  ├── startStdinReader()  — syscall.Select 10ms polling (macOS Read() 블로킹 회피)
  ├── stopStdinReader()   — stopRead 채널 close → goroutine 종료 (최대 ~10ms)
  ├── injectSilent()      — suppressing=true → PTY 주입 → 300ms 대기 → false
  ├── outputLoop()        — suppressing 체크 후 Stdout 출력
  └── escKey handler      — Ctrl+\ (0x1C)
        1. paused=true
        2. promptui pick (claude / agy / codex)
        3. switchTo(next) → clearScreen() → showBanner(next)
        4. paused=false
        5. go injectContext(next, extractContext(prev))
```

**핵심 기술 결정**:
- macOS에서 fd close 시 Read()가 unblock 되지 않음 → syscall.Select polling으로 해결
- ANSI 제거 정규식: CSI `[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]` + OSC + 단일 escape 포괄
- 전환 순서: switchTo → clearScreen → showBanner → paused=false (이전 CLI 출력 overlap 방지)

---

## huginin setup

`huginin setup` — 워크스페이스 연결 + git hook 설치를 한 번에 처리.

```bash
huginin setup
# 1. 워크스페이스 목록 표시 (TUI)
# 2. 선택 시 project_id 저장 (.huginin/config.json)
# 3. .git/hooks/post-commit 설치 + chmod +x
# 4. 완료 메시지
```
