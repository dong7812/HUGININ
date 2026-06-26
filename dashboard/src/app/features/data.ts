export type Feature = {
  id: string;
  group: "live" | "soon";
  groupLabel: string;
  title: string;
  tagline: string;
  scenario: string;
  usage: string[];
  flow: string[];
  details?: { label: string; values: string[] }[];
  terminal?: { t: string; v?: string }[];
};

export const FEATURES: Feature[] = [
  {
    id: "auto-collect",
    group: "live",
    groupLabel: "수집 · 기록",
    title: "자동 수집",
    tagline: "git commit할 때마다 AI 대화가 자동으로 쌓인다",
    scenario:
      "Claude Code로 인증 리팩토링을 완료하고 커밋했다. 6개월 뒤 '왜 JWT rotation을 선택했지?'라는 질문이 생겼을 때, 당시 Claude와 나눈 대화와 기각된 Redis session 방안이 그대로 남아 있다.",
    usage: [
      "huginin setup으로 프로젝트에 git hook 설치 (1회)",
      "huginin TUI 안에서 claude 실행: huginin → claude",
      "Claude Code와 함께 작업",
      "git commit → post-commit hook이 최근 8시간 AI 세션 자동 파싱",
      "대시보드 '코드 이력' 탭에서 결정 카드 확인",
    ],
    flow: [
      "post-commit hook → 최근 8시간 AI 세션 JSONL 파싱",
      "POST /collect/event 서버 전송 (커밋 블로킹 없음)",
      "Claude Haiku ETL → 7개 필드 자동 추출",
      "fastembed 384-dim → pgvector HNSW 저장",
    ],
    details: [
      {
        label: "ETL 추출 필드",
        values: ["what_was_built", "problem_solved", "ai_role", "tradeoffs", "frame", "ai_contribution", "decision_summary"],
      },
      { label: "지원 도구", values: ["Claude Code", "agy (Antigravity)", "codex"] },
    ],
    terminal: [
      { t: "dim",  v: "# Claude와 작업 후 커밋" },
      { t: "cmd",  v: 'git commit -m "feat: refresh token rotation"' },
      { t: "gap" },
      { t: "info", v: "[huginin] event queued · commit a3f2c1d" },
      { t: "ok",   v: "ETL 완료 — ai_contribution: 0.82 · frame: C" },
    ],
  },
  {
    id: "tui",
    group: "live",
    groupLabel: "수집 · 기록",
    title: "huginin TUI",
    tagline: "claude · agy · codex를 하나의 터미널에서 Ctrl+\\ 로 전환한다. 기본은 claude-code.",
    scenario:
      "codex로 코드 생성을 하다가 복잡한 아키텍처 결정이 필요해졌다. Ctrl+\\를 누르면 codex 화면의 컨텍스트가 자동으로 Claude에 주입된다. 비활성 CLI는 백그라운드에서 잠들어 있다가 전환 즉시 깨어난다.",
    usage: [
      "프로젝트 디렉토리에서 huginin 실행",
      "처음 실행 시: login → setup 순서로 진행",
      "claude (또는 agy, codex) 입력해 AI 도구 실행",
      "Ctrl+\\ 로 다른 AI 도구로 전환 (컨텍스트 자동 이어받기)",
      "huginin > 프롬프트에서 import, backfill 등 커맨드 사용 가능",
    ],
    flow: [
      "huginin 실행 → Bubble Tea TUI 진입 (기본: claude-code)",
      "claude / agy / codex 선택 → PTY 로 실행",
      "Ctrl+\\ → 현재 CLI 화면 스냅샷 4096 chars 추출",
      "다음 CLI 시작 → 스냅샷 자동 주입 (600ms quiet 후)",
    ],
    details: [
      {
        label: "내장 커맨드",
        values: ["login", "setup", "claude / agy / codex", "import <file>", "backfill", "workspace list", "exit"],
      },
      { label: "기본 도구", values: ["claude-code (ActiveTool 미설정 시 자동 선택)"] },
    ],
    terminal: [
      { t: "tui-init" },
      { t: "tui-warn",   v: "로그인 필요 — login 입력" },
      { t: "tui-tool",   v: "claude-code" },
      { t: "gap" },
      { t: "tui-hint" },
      { t: "tui-sep" },
      { t: "tui-prompt", v: "" },
    ],
  },
  {
    id: "import",
    group: "live",
    groupLabel: "수집 · 기록",
    title: "문서 임포트",
    tagline: "기존 ADR · README를 Knowledge Base로 소급 변환한다",
    scenario:
      "프로젝트 6개월 차에 HUGININ을 도입했다. huginin import DECISIONS.md를 실행하면 각 섹션을 Haiku가 분석하고, 실제 코드베이스와 대조해 '아직 유효한 결정인지'를 검증한다.",
    usage: [
      "huginin TUI 안에서: import DECISIONS.md",
      "또는 CLI에서: huginin import README.md",
      "백그라운드에서 ETL + 코드 grep 검증 진행 (수초 소요)",
      "대시보드 '문서' 탭에서 검토 큐 확인",
      "각 항목의 validation_status 검토 후 승인 / 반려",
    ],
    flow: [
      "# / ## / ### 헤딩 기준 섹션 분리",
      "코드베이스 grep → 관련 스니펫 추출",
      "Claude Haiku ETL → 4개 필드 추출",
      "코드 대조 → validation_status 결정",
    ],
    details: [
      {
        label: "ETL 추출 필드",
        values: ["what_was_decided", "why", "alternatives", "constraints"],
      },
      {
        label: "validation_status",
        values: [
          "consistent — 코드에서 확인됨",
          "outdated — 코드와 불일치",
          "unverifiable — 추상적 결정 (코드 근거 없음)",
        ],
      },
    ],
    terminal: [
      { t: "cmd",  v: "huginin import DECISIONS.md" },
      { t: "gap" },
      { t: "info", v: "섹션 7개 파싱 중..." },
      { t: "ok",   v: "3 consistent · 2 unverifiable · 1 outdated" },
      { t: "ok",   v: "임베딩 완료 — Knowledge Base 업데이트" },
    ],
  },
  {
    id: "timeline",
    group: "live",
    groupLabel: "탐색 · 활용",
    title: "결정 타임라인",
    tagline: "커밋 이력과 문서를 탭으로 분리해 한눈에 본다",
    scenario:
      "지난 2주간 어떤 결정들이 있었는지 확인하고 싶다. '코드 이력' 탭에서 커밋별 결정 카드를 보고, '문서' 탭에서 임포트된 ADR 검토 큐를 확인한다.",
    usage: [
      "대시보드 접속 → 워크스페이스 선택",
      "'코드 이력' 탭: 커밋별 결정 카드 확인 (Frame 배지, ai_contribution 수치)",
      "'문서' 탭: 임포트 문서 검토 큐 — 전체 / 검토대기 / 승인 / 불일치 필터",
      "상단 기간 필터 (today / week / all) 로 범위 조절",
      "카드 클릭 → 결정 상세 (왜, 기각된 대안, AI 역할) 확인",
    ],
    flow: [
      "source_type=commit → '코드 이력' 탭 (서버 쿼리 레벨 필터)",
      "source_type=doc → '문서' 탭 (validation_status 필터)",
      "기간 필터: today / week / all",
      "Frame 배지 + ai_contribution 수치 표시",
    ],
    details: [
      {
        label: "필터 옵션",
        values: ["기간 (today / week / all)", "Frame (A / B / C / D)", "문서 상태 (검토대기 / 승인 / 불일치)"],
      },
    ],
  },
  {
    id: "search",
    group: "live",
    groupLabel: "탐색 · 활용",
    title: "시맨틱 검색",
    tagline: "키워드가 달라도 의미로 과거 결정을 찾는다",
    scenario:
      "'Redis 관련 결정'이라고 검색하면 'cache 도입 이유', 'session storage 변경' 같이 키워드는 다르지만 관련된 결정들이 묶여 나온다. Claude Sonnet이 결과를 종합해 답변을 생성한다.",
    usage: [
      "대시보드 우측 하단 채팅 버튼(DecisionChat) 클릭",
      "자연어로 질문 입력 (예: 'auth 관련 결정', 'Redis 도입 이유')",
      "커밋 레코드 + 문서 레코드를 함께 검색",
      "Claude Sonnet이 관련 결정들을 종합해 답변 생성",
      "관련 결정 카드 클릭해 원본 타임라인 확인",
    ],
    flow: [
      "쿼리 텍스트 → fastembed 임베딩",
      "pgvector cosine similarity → top-k 후보 추출",
      "커밋 레코드 + 문서 레코드 함께 검색",
      "Claude Sonnet → 검색 결과 종합 답변 생성",
    ],
    terminal: [
      { t: "dim",  v: "# 대시보드 채팅에서 검색" },
      { t: "info", v: '검색: "Redis 도입 이유"' },
      { t: "gap" },
      { t: "ok",   v: "3개 관련 결정 발견" },
      { t: "info", v: "session storage → Railway 메모리 비용으로 제외" },
      { t: "info", v: "cache layer → pgvector로 통합 결정" },
    ],
  },
  {
    id: "context",
    group: "live",
    groupLabel: "탐색 · 활용",
    title: "컨텍스트 추출",
    tagline: "프로젝트 전체 의사결정을 Markdown으로 다운로드한다",
    scenario:
      "새 Claude 세션을 시작하기 전, 지금까지의 아키텍처 결정 맥락을 추출해 컨텍스트로 붙여넣는다. 3단계 상세도로 요약 / 상세 / 전체를 선택할 수 있다.",
    usage: [
      "대시보드 상단 '브리핑' 버튼 클릭",
      "기간 선택 (지난 주 / 지난 달 / 전체)",
      "상세도 선택: 요약 / 상세 / 전체",
      "Markdown 파일 다운로드",
      "새 Claude 세션 프롬프트에 붙여넣기",
    ],
    flow: [
      "대시보드 컨텍스트 추출 버튼 클릭",
      "상세도 선택: 요약 / 상세 / 전체",
      "결정 이력 Markdown 생성 및 다운로드",
      "새 AI 세션 프롬프트에 붙여넣기",
    ],
  },
  {
    id: "mcp",
    group: "live",
    groupLabel: "AI 연동",
    title: "MCP recall",
    tagline: "Claude 세션 시작 시 과거 결정이 자동으로 주입된다",
    scenario:
      ".mcp.json에 huginin을 등록하면, Claude가 새 세션을 시작할 때 프로젝트 관련 과거 결정들이 자동으로 컨텍스트에 포함된다. 매번 붙여넣을 필요가 없다.",
    usage: [
      "huginin service-token 으로 서비스 토큰 발급",
      "프로젝트 루트에 .mcp.json 파일 생성",
      "huginin MCP 서버 정보 등록 (url, type, Authorization 헤더)",
      "Claude 재시작",
      "새 세션 시작 시 과거 결정이 자동으로 컨텍스트에 포함됨",
    ],
    flow: [
      ".mcp.json에 huginin SSE 서버 등록",
      "Claude 세션 시작 → recall_across_workspaces() 호출",
      "pgvector 유사도 검색 → 관련 결정 추출",
      "consistent / reviewed / unverifiable 만 주입 (outdated · rejected 제외)",
    ],
    terminal: [
      { t: "dim",  v: "# .mcp.json" },
      { t: "info", v: '{ "mcpServers": { "huginin": {' },
      { t: "info", v: '    "url": "https://api.huginin.com/mcp",' },
      { t: "info", v: '    "type": "sse" } } }' },
      { t: "gap" },
      { t: "ok",   v: "세션 시작 시 과거 결정 자동 주입됨" },
    ],
  },
  {
    id: "briefing",
    group: "live",
    groupLabel: "AI 연동",
    title: "AI 브리핑",
    tagline: "최근 결정들을 Claude Sonnet이 PM용 요약으로 만든다",
    scenario:
      "스프린트 리뷰 전 '브리핑' 버튼을 클릭한다. Claude Sonnet이 기간 내 결정들을 분석해 주요 결정 사항, AI 기여도 변화, 반복 패턴을 요약해준다.",
    usage: [
      "대시보드 상단 '브리핑' 버튼 클릭",
      "기간 선택 (지난 주 / 지난 달)",
      "Claude Sonnet이 결정 이력 자동 분석",
      "주요 결정 / AI 기여도 변화 / 반복 패턴 요약 확인",
      "Markdown 형식으로 복사 또는 공유",
    ],
    flow: [
      "기간 선택 → 결정 이벤트 조회",
      "Claude Sonnet → 결정 패턴 분석",
      "주요 결정 / AI 기여도 변화 / 반복 패턴 요약",
      "Markdown 형식으로 출력",
    ],
  },
  {
    id: "frame",
    group: "live",
    groupLabel: "AI 연동",
    title: "Frame 분류",
    tagline: "각 커밋에서 AI가 얼마나 기여했는지 A–D로 자동 분류한다",
    scenario:
      "지난 달 배포된 기능들 중 AI가 주도한 것과 인간이 주도한 것을 구분하고 싶다. Frame 차트에서 A부터 D까지의 분포와 ai_contribution 트렌드를 확인한다.",
    usage: [
      "별도 설정 없음 — 자동 수집 시 Haiku가 자동 분류",
      "대시보드 Frame Stats 차트에서 A/B/C/D 분포 확인",
      "ai_contribution 트렌드 차트에서 시간별 변화 확인",
      "타임라인에서 Frame 배지로 개별 커밋 분류 확인",
      "특정 Frame으로 타임라인 필터링 가능",
    ],
    flow: [
      "Claude Haiku ETL → 대화 패턴 분석",
      "Frame A/B/C/D + ai_contribution(0.0–1.0) 자동 산출",
      "대시보드 Frame Stats 차트에 누적 표시",
    ],
    details: [
      {
        label: "Frame 기준",
        values: [
          "A — Human-led (AI 참고 수준)",
          "B — AI-assisted (AI 주요 기여)",
          "C — AI-led (AI 주도)",
          "D — Automated (자동화)",
        ],
      },
    ],
  },
  {
    id: "graph",
    group: "soon",
    groupLabel: "준비 중",
    title: "결정 그래프",
    tagline: "어떤 결정이 어떤 결정으로 이어졌는지 시각화한다",
    scenario:
      "'auth 리팩토링' 결정이 이후 'session 정책 변경', 'mobile client 수정'으로 이어진 연결 관계를 그래프로 탐색한다.",
    usage: ["준비 중"],
    flow: ["결정 간 의존 관계 추출", "시각적 그래프 뷰어", "클릭으로 결정 상세 탐색"],
  },
  {
    id: "hybrid-search",
    group: "soon",
    groupLabel: "준비 중",
    title: "검색 고도화",
    tagline: "MMR + 하이브리드 검색으로 더 정확한 결과를 제공한다",
    scenario:
      "유사한 결정들이 너무 많이 나올 때 MMR로 다양성을 확보하고, 키워드 + 벡터 하이브리드로 정확도를 높인다.",
    usage: ["준비 중"],
    flow: ["BM25 키워드 + pgvector 벡터 검색 병행", "MMR 알고리즘으로 결과 다양성 확보", "Re-ranking으로 최종 순서 결정"],
  },
];
