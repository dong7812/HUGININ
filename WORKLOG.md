# WORKLOG

---
2026-06-15 02:12 | EXPLORING | HIGH | D:0.7 | cache:93% | tok:97124K | 제품 핵심 방향 "AI 협업 가시화 + Frame A/B/C/D 팀 스케일"로 확정, 허위 클레임 제거, GitHub 첫 push (dong7812/HUGININ)

2026-06-14 (야간) | FEATURE_BUILDING | HIGH | D:0.8 | cache:n/a | tok:n/a | MCP recall_decisions 도구 구현 + fastembed 임베딩 파이프라인 완성 — Claude Code가 구현 전 팀 이력을 자동 참조하는 핵심 루프 완성
2026-06-14 (오후) | FEATURE_BUILDING | HIGH | D:0.7 | cache:n/a | tok:n/a | 대시보드 타임라인 세부 정보 확장 (raw_response, diff, commit_hash, comment_count) + DiffView + CopyButton 구현
2026-06-14 (오후) | FEATURE_BUILDING | HIGH | D:0.7 | cache:n/a | tok:n/a | 검색 기능 구현 (ILIKE, useSearchQuery) + OverviewCards 시간 범위 필터 재설계 + WorkspaceDashboard 클라이언트 wrapper
2026-06-14 (오후) | FEATURE_BUILDING | HIGH | D:0.8 | cache:n/a | tok:n/a | 랜딩페이지 MCP-first 아키텍처로 전면 재설계 — "Claude Code × Team Memory" 포지셔닝
2026-06-13 18:46 | EXPLORING | HIGH | D:0.8 | cache:96% | tok:5213K | CLI-First LLMOps 플랫폼 아키텍처 설계 완료 (README/AGENTS/PLANS/evals/RESEARCH) — 시장 조사로 포지셔닝 확정, Notion 2레벨 RBAC + collab-proof git 훅 파이프라인 구조 확립
2026-06-14 22:39 | commit | 25a4164 | branch:main | Remove collab-proof tmp snapshots from tracking
2026-06-14 22:51 | commit | 355f3f6 | branch:main | Add local dev setup to README and server/.env.example
2026-06-15 02:05 | commit | 98ecb0e | branch:main | Reframe core value: AI collaboration visibility over team memory
2026-06-15 02:12 | commit | 8b018a1 | branch:main | Clarify direction: AI collaboration visibility, Frame A/B/C/D as north star
2026-06-15 02:19 | commit | 6ccc32f | branch:main | collab-proof: session 2026-06-15 — EXPLORING HIGH, direction reframe
2026-06-15 02:39 | commit | 533846f | branch:main | Add CLI installation: Makefile + hooks/install.sh auto-build + README guide
2026-06-15 10:54 | session-end | files_changed:2 | branch:main | 533846f Add CLI installation: Makefile + hooks/install.sh auto-build + README guide
2026-06-15 15:57 | session-end | files_changed:3 | branch:main | 533846f Add CLI installation: Makefile + hooks/install.sh auto-build + README guide
2026-06-15 16:08 | commit | 8f26533 | branch:main | Add service-token command for MCP/Git hook automation
2026-06-15 16:25 | commit | a5263eb | branch:main | Add interactive workspace picker on login
2026-06-15 16:29 | commit | 782d9d9 | branch:feature/interactive-login | Make login interactive: prompt for email/password when flags omitted
2026-06-15 17:16 | commit | f12a5a1 | branch:feature/interactive-login | Add ETL pipeline + git hook embed + git branch graph
2026-06-15 17:33 | session-end | files_changed:8 | branch:feature/interactive-login | f12a5a1 Add ETL pipeline + git hook embed + git branch graph
2026-06-15 17:35 | commit | a52239d | branch:feature/interactive-login | Fix Ctrl+C handling in login prompt + add ETL backfill on server start
2026-06-15 17:43 | session-end | files_changed:17 | branch:feature/interactive-login | a52239d Fix Ctrl+C handling in login prompt + add ETL backfill on server start
2026-06-15 17:48 | commit | 5968260 | branch:feature/interactive-login | Add rich ETL narrative fields: what_was_built, problem_solved, ai_role
2026-06-15 18:30 | commit | 217d83b | branch:feature/interactive-login | Show committer name instead of '인간' in AI contribution card
2026-06-15 18:31 | commit | 39db4ca | branch:feature/interactive-login | Fix dataclass field ordering: non-default 'status' must precede default 'user_name'
2026-06-15 18:34 | commit | 79129d5 | branch:feature/interactive-login | Expand AI contribution card into 3-part narrative: 무엇 → 왜 → AI
2026-06-15 19:02 | commit | 711482c | branch:feature/interactive-login | Add ETL pipeline visualization: abstract (landing) + concrete (README)
2026-06-15 19:45 | commit | 6100644 | branch:feature/interactive-login | Add favicon + Huginn brand concept to landing page
2026-06-15 19:47 | commit | edbe23b | branch:feature/interactive-login | Fix favicon: replace app/favicon.ico (Next.js App Router priority override)
2026-06-15 19:57 | commit | dfe1486 | branch:feature/interactive-login | Redesign timeline card preview: visual UI mockup + minimal empty state
2026-06-15 20:01 | commit | e4edb7e | branch:feature/interactive-login | Remove 'no session data detected' — show raw git log + '0 context' instead
2026-06-15 20:10 | FEATURE_BUILDING | HIGH | D:0.8 | cache:98% | tok:18760K | user_name DB 조회 전파 + ETL 3-part 서사 카드 + Huginn 브랜드 랜딩 + favicon 수정(app/ 우선순위 버그) + Before 패널 공허함 시각화
2026-06-15 20:15 | commit | 2bd9a54 | branch:feature/interactive-login | collab-proof: session 2026-06-15 — FEATURE_BUILDING HIGH, Huginn brand + ETL narrative + user_name propagation
2026-06-16 02:24 | commit | bf6affc | branch:feature/interactive-login | Add GitHub Webhook integration: PR events in dashboard timeline
2026-06-16 02:43 | commit | 7dd667b | branch:feature/interactive-login | Add Frame A/B/C/D team statistics panel (Phase 2)
2026-06-16 03:04 | commit | 53c067f | branch:feature/interactive-login | Add Railway + Vercel deployment config
2026-06-16 15:55 | commit | 70330e9 | branch:feature/interactive-login | Fix Railway healthcheck: add /health endpoint, timeout 120s
2026-06-16 16:10 | commit | 0050635 | branch:feature/interactive-login | Update CLI default server URL to Railway production + add --server flag
2026-06-16 18:08 | commit | 91f3da6 | branch:feature/interactive-login | Add /workspace/new page for workspace creation from dashboard
2026-06-16 18:26 | commit | f0e2028 | branch:main | Merge feature/interactive-login: add workspace/new page
2026-06-16 18:36 | commit | 9822cf1 | branch:main | Fix CLI: SIGINT handler for Ctrl+C + skip workspace picker when empty
2026-06-16 18:49 | commit | a4eefd8 | branch:main | Sync worklogs, session history, decisions + gitignore cleanup
2026-06-16 19:14 | commit | 4e99c5a | branch:main | Add AI trend chart + cache strategy suggestions panel
2026-06-16 19:26 | commit | e566219 | branch:main | chore: trigger Railway rebuild for new dashboard endpoints
2026-06-16 19:29 | commit | deb0b3f | branch:main | Sync worklogs and collab-proof snapshots
2026-06-16 20:23 | commit | 4500995 | branch:main | Fix: link project to Railway production workspace
2026-06-16 20:25 | commit | 965f60b | branch:main | Sync worklogs
2026-06-16 21:41 | commit | 819ac4c | branch:main | Add real install.sh + fix install URL in landing slider
2026-06-17 00:40 | commit | 1ffd7cd | branch:main | Fix DB ssl: skip ssl for Railway internal network (.railway.internal)
2026-06-17 02:03 | commit | 87838e2 | branch:main | Fix search debounce + workspace list refresh after creation
2026-06-17 03:58 | commit | 41b3728 | branch:main | Fix embedding model: use paraphrase-multilingual-MiniLM-L12-v2 (fastembed 0.8.0 지원)
2026-06-17 04:07 | commit | e19037c | branch:main | Smart search: 합성 텍스트 200자 이후 더보기/접기 버튼
2026-06-17 04:25 | commit | 5a752ca | branch:main | Redesign dashboard: light theme (Tesla + Multica.ai inspired)
2026-06-17 04:38 | commit | a737ba8 | branch:main | Increase SmartSearch collapse threshold 200→350 chars
2026-06-17 04:40 | commit | 47ad704 | branch:main | Restore Huginn raven logo to landing page
2026-06-17 04:42 | commit | 1c05cfa | branch:main | Logo: remove circle bg, hero 52→120px, nav icon 22→40px
2026-06-17 12:57 | commit | d4bd553 | branch:main | Add tradeoffs field full-stack + richer timeline UX
2026-06-17 13:15 | commit | 88d9e2d | branch:main | Add PM briefing: on-demand AI analysis of decision patterns
2026-06-17 13:23 | commit | f6d7382 | branch:main | Fix pm_briefer: datetime object not subscriptable
2026-06-17 17:07 | commit | 4c21cf6 | branch:main | Fix pm_briefer: format string KeyError on curly braces in decision content
2026-06-17 17:27 | commit | 5a3d39a | branch:main | PM briefing: slide-over panel instead of inline card
2026-06-17 17:35 | commit | 142625f | branch:main | Fix today count (KST midnight) + add frame filter to timeline
2026-06-17 17:39 | commit | 751ca13 | branch:main | Rename PM 브리핑 → AI 브리핑
2026-06-17 17:43 | commit | 21a47f5 | branch:main | Fix pm-brief 500: use tool_use for structured output instead of raw JSON
2026-06-17 17:58 | commit | 5c4c562 | branch:main | Fix install.sh: add --version flag to CLI + rebuild all platform binaries
2026-06-17 18:29 | commit | 67aa7af | branch:main | Add signup, Google OAuth, email verification, and CLI browser login
2026-06-17 23:53 | commit | 4cb8c8c | branch:main | Update READMEs: reflect actual current state
2026-06-18 00:00 | commit | aef866d | branch:main | Add decision chat (채널톡 style) + weekly AI brief auto-generation
2026-06-18 00:02 | commit | eb96064 | branch:main | Fix: revert AI 브리핑 name (keep weekly auto-generation logic)
2026-06-18 00:08 | commit | 0efb21d | branch:main | Update URLs: huginin.vercel.app → huginin.com, api.huginin.com
2026-06-18 00:08 | commit | 3ba7554 | branch:main | Shorten chat replies: 3 sentences max, max_tokens 800→300
2026-06-18 15:18 | commit | 2b9d300 | branch:main | Force Railway rebuild: invalidate Docker layer cache
2026-06-18 20:01 | commit | a76d322 | branch:main | Fix workspace slug collision: append random hex suffix
2026-06-18 20:09 | commit | c8ac1b4 | branch:main | Expand smart-search synthesis: max_tokens 400→900, collapse threshold 350→600 chars
2026-06-18 20:33 | commit | 93845e3 | branch:main | Add logout command + workspace create flow on login
2026-06-18 20:37 | commit | b974975 | branch:main | LoginForm: redirect to CLI auth page after login when ?redirect= param exists
2026-06-18 20:40 | commit | 3b37c71 | branch:main | Fix CLI install: archive binary as 'huginin' not platform-specific name
2026-06-18 20:43 | commit | 9957a08 | branch:main | Rebuild CLI binaries: include logout command
2026-06-18 20:51 | commit | 3157f0a | branch:main | install.sh: remove old binary before install + xattr quarantine fix + uninstall mode
2026-06-18 20:53 | commit | ea7b6b4 | branch:main | install.sh: use /opt/homebrew/bin on Apple Silicon Macs
2026-06-18 20:57 | commit | 2a79acd | branch:main | Fix ETL: detect Claude session within 30min window instead of newer-than-lock
2026-06-18 21:08 | commit | fb51024 | branch:main | Landing: redirect logged-in users to dashboard, smart start buttons
2026-06-18 21:12 | commit | 53777e4 | branch:main | Landing: remove auto-redirect, keep smart start button only
2026-06-18 21:23 | commit | 33cd0ef | branch:main | Fix workspace delete: redirect to existing workspace if available
2026-06-18 21:26 | commit | 3c687fd | branch:main | Fix sidebar stale data after workspace delete
2026-06-18 23:39 | commit | e429e7a | branch:main | Add Bubble Tea TUI session: huginin enters interactive REPL on bare invocation
2026-06-18 23:45 | session-end | files_changed:6 | branch:main | e429e7a Add Bubble Tea TUI session: huginin enters interactive REPL on bare invocation
2026-06-18 23:46 | session-end | files_changed:7 | branch:main | e429e7a Add Bubble Tea TUI session: huginin enters interactive REPL on bare invocation
2026-06-18 23:51 | commit | b155f2c | branch:main | Fix TUI session: remove alt screen, add login/logout commands
2026-06-19 00:07 | session-end | files_changed:8 | branch:main | b155f2c Fix TUI session: remove alt screen, add login/logout commands
2026-06-19 05:00 | FEATURE_BUILDING | HIGH | D:0.8 | cache:98% | tok:219269K | Bubble Tea TUI REPL + workspace delete/invite popup + datetime timezone 전역 수정(9파일) + TanStack Query stale cache 즉시 무효화 — workspace join 500 및 사이드바 잔존 버그 수정, huginin 단독 실행 시 claude 세션 진입 구현
2026-06-19 18:43 | session-end | files_changed:18 | branch:main | b155f2c Fix TUI session: remove alt screen, add login/logout commands
2026-06-19 18:43 | session-end | files_changed:19 | branch:main | b155f2c Fix TUI session: remove alt screen, add login/logout commands
2026-06-19 18:43 | session-end | files_changed:19 | branch:main | b155f2c Fix TUI session: remove alt screen, add login/logout commands
2026-06-19 18:43 | session-end | files_changed:19 | branch:main | b155f2c Fix TUI session: remove alt screen, add login/logout commands
2026-06-19 19:17 | commit | ed91f05 | branch:main | Add huginin setup command: TUI-driven repo link + hook install
2026-06-19 19:17 | session-end | files_changed:21 | branch:main | ed91f05 Add huginin setup command: TUI-driven repo link + hook install
2026-06-19 19:24 | commit | ef1d6f1 | branch:main | Add huginin backfill: retroactive collection of uncollected commits
2026-06-19 19:37 | commit | b3264ab | branch:main | Fix backfill: compare with server hashes, fix login overwriting token
2026-06-19 19:39 | commit | d80d845 | branch:main | Add uninstall command to TUI
2026-06-19 19:47 | commit | 779889f | branch:main | chore: trigger Railway rebuild for commit-hashes endpoint
2026-06-19 20:19 | commit | 36c109c | branch:main | chore: trigger HUGININ service redeploy after env var fix
2026-06-19 20:32 | commit | d1c6d86 | branch:main | Fix Dockerfile CMD to use PORT env var (Railway healthcheck fix)
2026-06-19 20:52 | commit | 4b5d46e | branch:main | Fix backfill timeline: pass committed_at from git log, batch fix existing timestamps
2026-06-19 20:55 | commit | f73a09a | branch:main | Fix no-AI-session commits: classify as Frame A (human-led) instead of automated
2026-06-19 20:57 | commit | 98ce5b3 | branch:main | Fix backfill: always run timestamp fix before early return
2026-06-19 21:08 | commit | 47f6adb | branch:main | Deploy CLI binaries: committed_at + fix-timestamps + 8h session window
2026-06-19 21:11 | commit | 061dcf8 | branch:main | ETL: analyze diff even for no-session commits; never show raw commit msg
2026-06-19 21:18 | commit | 2ce4833 | branch:main | Fix: one project per workspace; revert ETL to stable flow with frame post-fix
2026-06-19 21:23 | commit | 66cc6c9 | branch:main | Fix install.sh: tarball now contains 'huginin' not platform-specific name
2026-06-19 21:24 | commit | 6e66324 | branch:main | Add FORCE_REREFINE=1: reset all ETL fields on startup for full re-processing
2026-06-19 21:33 | commit | d81967d | branch:main | Restore original ETL + keep FORCE_REREFINE for timeline re-refinement
2026-06-19 21:35 | commit | 7bcb49e | branch:main | Fix startup crash: remove unimplemented find_by_name abstract method
2026-06-19 21:40 | commit | 3557a3e | branch:main | Fix: cap project count display at 1 (workspace has one project)
2026-06-19 21:47 | commit | 437242d | branch:main | Fix backfill visibility: use print() for Railway log output
2026-06-19 22:20 | commit | e7afeb2 | branch:main | Update landing install guide: huginin setup + 8h session window
2026-06-20 19:36 | commit | 444c277 | branch:main | Reposition landing: AI decision version control, not analytics tool
2026-06-22 09:37 | session-end | files_changed:24 | branch:main | 444c277 Reposition landing: AI decision version control, not analytics tool
2026-06-22 15:03 | session-end | files_changed:25 | branch:main | 444c277 Reposition landing: AI decision version control, not analytics tool
2026-06-22 16:51 | commit | 9aff557 | branch:main | ETL: add rejected_alternatives + implicit_constraints fields
2026-06-22 18:44 | commit | 7d415e4 | branch:main | Redesign landing: Glide-style hero with pain-first Korean headline
2026-06-22 20:53 | commit | 67ba6de | branch:main | Rewrite ETL: full conversation analysis, not last-message extraction
2026-06-22 21:27 | commit | 3adfdc1 | branch:main | Color label text: 왜(blue) 무엇(emerald) 트레이드오프(violet)
2026-06-22 22:22 | commit | 1b0ca87 | branch:main | Add context export: 3-level Markdown download of decision history
2026-06-22 23:27 | commit | 1fdaa30 | branch:main | Add onboarding modal: feature overview on first dashboard visit
2026-06-22 23:33 | commit | ce6055b | branch:main | Replace popup onboarding with step-by-step spotlight tour
2026-06-22 23:44 | commit | b57bc81 | branch:main | Update landing features: add 컨텍스트추출, mark MCP/ROI as coming soon
2026-06-23 10:08 | commit | b2d8e43 | branch:main | Fix tour spotlight: poll for data-tour element instead of one-shot timer
2026-06-23 10:18 | commit | 8771737 | branch:main | Fix Vercel build: exclude Playwright files from tsconfig
2026-06-23 20:43 | commit | b154086 | branch:main | Fix CLI tarballs: binary named huginin inside archive
2026-06-23 20:51 | session-end | files_changed:41 | branch:main | b154086 Fix CLI tarballs: binary named huginin inside archive
2026-06-23 21:07 | commit | 3d7c44d | branch:main | Fix multiplexer pick UI freezing: stop stdin goroutine during promptui
2026-06-23 21:07 | session-end | files_changed:42 | branch:main | 3d7c44d Fix multiplexer pick UI freezing: stop stdin goroutine during promptui
2026-06-23 21:19 | commit | 6af75ba | branch:main | Fix pick UI arrow key freeze: use syscall.Select polling in stdin goroutine
2026-06-23 21:19 | session-end | files_changed:43 | branch:main | 6af75ba Fix pick UI arrow key freeze: use syscall.Select polling in stdin goroutine
2026-06-24 18:15 | session-end | files_changed:45 | branch:main | 6af75ba Fix pick UI arrow key freeze: use syscall.Select polling in stdin goroutine
2026-06-24 18:16 | commit | 256a734 | branch:main | Fix ANSI stripping: cover CSI private-mode params and OSC sequences
2026-06-24 18:21 | session-end | files_changed:45 | branch:main | 256a734 Fix ANSI stripping: cover CSI private-mode params and OSC sequences
2026-06-24 18:22 | session-end | files_changed:46 | branch:main | 256a734 Fix ANSI stripping: cover CSI private-mode params and OSC sequences
2026-06-24 18:28 | commit | 476b5ba | branch:main | Hide context injection echo: suppress PTY output during handoff write
2026-06-24 18:30 | session-end | files_changed:47 | branch:main | 476b5ba Hide context injection echo: suppress PTY output during handoff write
2026-06-24 18:49 | session-end | files_changed:49 | branch:main | 476b5ba Hide context injection echo: suppress PTY output during handoff write
2026-06-24 18:53 | commit | 2d6a584 | branch:main | Fix CLI switch UX: clear screen + banner, prevent output overlap
2026-06-24 20:20 | commit | 21a957c | branch:main | Landing: add multi-CLI support messaging; fix broken use-case imports
2026-06-25 | FEATURE_BUILDING + DOCS | HIGH | D:0.8 | PTY 멀티플렉서 버그 수정 완료 (arrow key freeze syscall.Select, ANSI regex CSI 확장, context injection suppression, CLI switch UX clearScreen+banner) + 랜딩 멀티 CLI 메시지 + MMR 검색 고도화 조사 + priority.html Phase 3 업데이트 + docs 업데이트 (README/PLANS/AGENTS/DECISIONS/WORKLOG)
