# Dashboard WORKLOG

---

2026-06-14 | FEATURE_BUILDING | MCP-first 랜딩페이지 재설계 — "Claude Code × Team Memory" 포지셔닝, recall_decisions 인라인 데모, vs Git AI 비교 섹션
2026-06-14 | FEATURE_BUILDING | DecisionTimeline 확장 — raw_response 프리뷰 토글, DiffView (인라인 +/- 컬러링), CopyButton (1500ms 복사 상태), CommentSection 통합
2026-06-14 | FEATURE_BUILDING | 검색 + 필터 — useSearchQuery (ILIKE, 2자 트리거), OverviewCards 시간 범위 필터 버튼 (오늘/이번 주/전체), WorkspaceDashboard 클라이언트 wrapper
2026-06-14 | BUG_FIXING | button 중첩 hydration 오류 수정 — diff 헤더 button → div[role="button"]로 변경
2026-06-14 19:00 | commit | 2c37b20 | branch:main | Initial commit from Create Next App
2026-06-15 16:42 | commit | 782d9d9 | branch:feature/interactive-login | Make login interactive: prompt for email/password when flags omitted
2026-06-16 19:03 | commit | 4e99c5a | branch:main | Add AI trend chart + cache strategy suggestions panel
2026-06-16 20:29 | commit | 4c10063 | branch:main | Fix sidebar card clipping: add self-start to right column
2026-06-16 20:37 | commit | 62f0403 | branch:main | Refactor AiTrendChart → 팀 생산성 리듬 + Frame legend tooltip
2026-06-16 20:47 | commit | 50e7787 | branch:main | Rewrite landing page: center on 팀 생산성 리듬 + Frame A/B/C/D concept
2026-06-16 21:01 | commit | 03a66bc | branch:main | Reframe landing page: 'AI 쓰다 까먹는 why를 자동 기록'으로 포지셔닝
2026-06-16 21:19 | commit | 7e2614b | branch:main | Landing: add Claude Code badge + interactive install slider
2026-06-16 21:27 | commit | c4f6323 | branch:main | Fix InstallSlider: left sidebar nav + correct email/password login
2026-06-16 21:33 | commit | 0aad96a | branch:main | Redesign install section: unified 3-column card
2026-06-16 21:38 | commit | cf91e38 | branch:main | CacheSuggestions: 3개씩 페이지네이션
2026-06-16 21:39 | commit | 819ac4c | branch:main | Add real install.sh + fix install URL in landing slider
2026-06-16 21:46 | commit | 21695f0 | branch:main | Host CLI binaries on Vercel: public/cli/ + install.sh
2026-06-16 21:54 | commit | 7d71cf5 | branch:main | Fix refine_event: max_tokens 512→1024 + truncation recovery
2026-06-16 21:57 | commit | 17204ef | branch:main | Fix Railway startup crash: DB connect retry with backoff
2026-06-17 01:54 | commit | aaf9139 | branch:main | Fix search: semantic vector search + fix workspace creation button
2026-06-17 10:49 | commit | 1c05cfa | branch:main | Logo: remove circle bg, hero 52→120px, nav icon 22→40px
2026-06-18 23:55 | commit | b155f2c | branch:main | Fix TUI session: remove alt screen, add login/logout commands
2026-06-22 17:54 | commit | 9aff557 | branch:main | ETL: add rejected_alternatives + implicit_constraints fields
2026-06-22 19:46 | commit | 52b51fd | branch:main | Redesign timeline card: REJECTED/CONSTRAINT front, drop what/how grid
2026-06-22 20:14 | commit | de6aafa | branch:main | Fix decision card: restore tradeoffs as core rationale row
2026-06-22 20:17 | commit | 7e2474a | branch:main | Simplify expanded card: no grid, lead with rejected/constraint blocks
2026-06-22 20:38 | commit | 65c4084 | branch:main | Fix: add rejected_alternatives + implicit_constraints to API response schema
2026-06-22 21:24 | commit | 59894db | branch:main | Redesign card: clean why/what/tradeoff sections, no colored blocks
