# HUGININ Dashboard

HUGININ의 Next.js 대시보드. [huginin.vercel.app](https://huginin.vercel.app)에 배포됨.

## 스택

- Next.js 16 (App Router, Turbopack)
- React 19 / TypeScript
- TanStack Query 5 (서버 상태)
- Zustand 5 (클라이언트 상태)
- Tailwind CSS / lucide-react

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

서버는 `http://localhost:8000`에서 실행 중이어야 한다.

## 구조

```
src/
├── app/
│   ├── page.tsx                    # 랜딩페이지
│   ├── InstallSlider.tsx           # Quick Start 인터랙티브 슬라이더
│   ├── login/page.tsx              # 로그인 (이메일 + Google OAuth)
│   ├── signup/page.tsx             # 회원가입 (이름/이메일/비밀번호 + Google)
│   ├── auth/
│   │   ├── verify/page.tsx         # 이메일 인증 링크 처리
│   │   ├── cli/page.tsx            # CLI 브라우저 로그인 승인
│   │   └── google/callback/        # Google OAuth 콜백
│   └── workspace/
│       ├── new/page.tsx            # 워크스페이스 생성
│       └── [id]/page.tsx           # 메인 대시보드
├── domain/
│   ├── entities.ts                 # FeedItem, WorkspaceOverview 등
│   └── ports.ts                    # IDashboardRepository 인터페이스
├── infrastructure/http/
│   ├── apiClient.ts                # 로그인/회원가입/CLI session API
│   ├── dashboardRepository.ts      # 피드/검색/통계/AI브리핑
│   └── commentRepository.ts
├── application/
│   ├── queries/dashboardQueries.ts # TanStack Query hooks
│   ├── stores/authStore.ts
│   └── stores/workspaceStore.ts
└── presentation/components/
    ├── WorkspaceDashboard.tsx       # 대시보드 레이아웃 + 상태 관리
    ├── DecisionTimeline.tsx         # 피드 + Frame 필터 + 시맨틱 검색
    ├── PmBriefing.tsx               # AI 브리핑 슬라이드오버 패널
    ├── OverviewCards.tsx            # 오늘/이번주/전체 통계
    ├── FrameChart.tsx               # Frame A/B/C/D 분포 차트
    ├── TokenChart.tsx               # 토큰 사용량 차트
    ├── CacheSuggestions.tsx         # 반복 프롬프트 캐시 제안
    ├── LoginForm.tsx                # 로그인 폼
    └── CommentSection.tsx           # 결정별 팀 코멘트
```

## 배포

```bash
# 프로젝트 루트에서 실행
npx vercel --prod
```

## 주요 API 엔드포인트

```
POST /auth/register
POST /auth/login
GET  /auth/google
GET  /auth/verify-email?token=
POST /auth/cli/session
GET  /auth/cli/poll/{session_id}

GET  /dashboard/{workspace_id}/feed?limit&offset&branch&date_from&frame
GET  /dashboard/{workspace_id}/overview
GET  /dashboard/{workspace_id}/token-stats?days=
GET  /dashboard/{workspace_id}/frame-stats?days=
POST /dashboard/{workspace_id}/pm-brief
GET  /dashboard/{workspace_id}/cache-suggestions
POST /comments/{event_id}
GET  /memory/recall?q=
```
