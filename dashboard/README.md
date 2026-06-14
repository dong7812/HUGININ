# HUGININ Dashboard

HUGININ 팀 메모리 플랫폼의 Next.js 대시보드.

## 스택

- Next.js 16.2.9 (App Router)
- React 19
- TypeScript
- TanStack Query 5 (서버 상태)
- Zustand 5 (클라이언트 상태)
- Tailwind CSS
- lucide-react

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

서버는 `http://localhost:8000` 에서 실행 중이어야 한다.

## 구조

```
src/
├── app/                        # Next.js App Router 페이지
│   ├── page.tsx                # 랜딩페이지
│   ├── login/                  # 로그인
│   └── workspace/[id]/         # 워크스페이스 대시보드
├── domain/
│   ├── entities.ts             # FeedItem, Workspace 등 도메인 타입
│   └── ports.ts                # 레포지토리 인터페이스
├── infrastructure/
│   └── http/
│       └── dashboardRepository.ts   # API 호출 구현체
├── application/
│   ├── queries/
│   │   └── dashboardQueries.ts      # TanStack Query hooks
│   └── use-cases/
│       └── getEventFeed.ts
└── presentation/
    └── components/
        ├── WorkspaceDashboard.tsx   # 클라이언트 wrapper (timeRange, searchQuery state)
        ├── OverviewCards.tsx        # 시간 범위 필터 버튼 (오늘/이번 주/전체)
        ├── DecisionTimeline.tsx     # 이벤트 피드 + 검색 + diff/response 확장
        ├── TokenChart.tsx           # 토큰 사용량 차트
        └── CommentSection.tsx       # 이벤트별 팀 코멘트
```

## 주요 기능

- **의사결정 타임라인**: AI 프롬프트 + 응답 + diff + 커밋 해시 연결 뷰
- **텍스트 검색**: 2자 이상 입력 시 ILIKE 검색 (raw_prompt + raw_response)
- **시간 범위 필터**: 오늘 / 이번 주 / 전체
- **브랜치 필터**: 타임라인 내 브랜치 드롭다운 (검색 중 숨김)
- **Diff 뷰어**: +/- 라인 컬러링, 인라인 렌더링 (외부 라이브러리 없음)
- **팀 토론**: 각 이벤트에 코멘트 추가/조회
- **토큰 분석**: 일별 prompt/response 토큰 차트

## API 엔드포인트 (로컬 서버)

```
GET  /dashboard/{workspace_id}/feed?limit&offset&branch&date_from
GET  /dashboard/{workspace_id}/search?q=...
GET  /dashboard/{workspace_id}/overview
GET  /dashboard/{workspace_id}/token-stats?days=
GET  /dashboard/{workspace_id}/branches
POST /comments/{event_id}
GET  /comments/{event_id}
```
