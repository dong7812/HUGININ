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
