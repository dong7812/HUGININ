# RESEARCH.md — 시장 조사 및 경쟁 분석

조사 기준일: 2026년 6월 14일

---

## 1. 시장 카테고리 분류

이 플랫폼이 속하는 도메인은 두 가지 기존 카테고리의 교차점이다.

| 카테고리 | 정의 | 대표 서비스 |
|---|---|---|
| **LLMOps / AI Observability** | LLM 요청·응답의 트레이싱, 토큰 비용, 성능 평가 | LangSmith, Langfuse, Braintrust, Latitude, Arize |
| **AI Code Provenance** | AI가 생성한 코드의 출처·귀속을 git에 기록 | Git AI, cursor/agent-trace, Lore Protocol |

HUGININ은 두 카테고리 모두에 속하지 않는 **세 번째 영역**을 목표로 한다:
> 팀 워크스페이스 단위의 AI 의사결정 지식베이스 + MCP 능동 참조

---

## 2. 핵심 경쟁사: Git AI (usegitai.com)

2026년 6월 기준 가장 직접적인 경쟁 포지션.

### Git AI가 하는 것

- 커밋 단위로 AI가 생성한 코드 라인을 추적 (line-level attribution)
- Git Notes에 메타데이터 저장
- "이 코드 라인은 어떤 AI가 작성했나?"에 답변
- GitHub PR 뷰에 통합 (AI 기여도 표시)

### Git AI의 한계

| 한계 | 설명 |
|---|---|
| 의사결정 맥락 없음 | "왜 이 방식을 선택했나?"를 저장하지 않음 — 코드 귀속만 |
| 팀 검색 불가 | Git Notes는 로컬 저장 — 다른 팀원이 조회 불가 |
| AI가 참조 불가 | Claude Code가 구현 전 과거 이력을 참조하는 구조 없음 |
| 워크스페이스 없음 | 팀 단위 지식베이스 개념 없음 |
| cross-project 검색 없음 | 프로젝트 경계를 넘는 의사결정 재사용 불가 |

### HUGININ vs Git AI 차별점

| 차원 | Git AI | HUGININ |
|---|---|---|
| **핵심 질문** | 이 줄 누가 만들었나? | 왜 이 결정을 내렸나? |
| **저장 단위** | 코드 라인 | AI 대화 + diff + 맥락 |
| **저장 위치** | Git Notes (로컬) | 중앙 DB + pgvector |
| **팀 검색** | 불가 | 시맨틱 검색 (cross-workspace) |
| **AI 능동 참조** | 없음 | Claude가 구현 전 자동 호출 |
| **MCP 지원** | 없음 | 핵심 아키텍처 |
| **팀 토론** | 없음 | 이벤트별 코멘트 |

---

## 3. LLMOps / AI Observability 서비스 현황

### LangSmith
- LangChain 생태계의 공식 관측 도구
- LLM 요청 트레이싱, 토큰 비용, 프롬프트 버전 관리, CI/CD 평가 게이트
- **한계**: SDK 강제 설치, 팀 간 의사결정 맥락 공유 없음, 코드-프롬프트 인과관계 추적 없음

### Langfuse
- 2026년 1월 Clickhouse에 인수됨
- Self-hosted 지원, GDPR/데이터 레지던시 요구사항에 강점
- OpenTelemetry(OTel) 표준 기반
- **한계**: 개별 LLM 요청 단위 관측에 집중, 의사결정 히스토리 자산화 없음

### Braintrust
- Eval-driven 개발 방식에 특화, CI/CD 품질 게이트
- 무료 티어: 월 1M spans, 10K evals
- **한계**: 코드 변경과 AI 추론의 인과관계 추적 없음

### Latitude
- 에이전트 세션 전체를 분석 단위로 취급
- 실패 패턴 탐지 → 도메인 전문가 주석 → 회귀 테스트 자동 생성(GEPA)
- **한계**: Claude Code 직접 연동 없음, 워크스페이스 지식베이스 없음

### Helicone
- LLM 요청 프록시 방식, 코드 변경 없이 연동
- 비용 추적과 캐싱에 강점
- **한계**: 의사결정 컨텍스트 없음

---

## 4. AI Code Provenance 서비스 현황

### cursor/agent-trace
- AI 생성 코드 메타데이터 표준 포맷 제안
- **한계**: 단순 메타데이터, 추론 맥락 없음, 팀 지식베이스 없음

### Lore Protocol
- 커밋 메시지를 의사결정 레코드로 구조화하는 컨벤션
- **한계**: CLI 도구 수준, 플랫폼/워크스페이스 없음, 시맨틱 검색 없음

---

## 5. HUGININ의 포지셔닝

```
기존 서비스             HUGININ
─────────────────      ──────────────────────────────────────
LLM 호출 관측  ──┐
                 ├──▶  Git hook 자동 수집 (Zero-config)
코드 귀속 추적  ──┘      + 팀 워크스페이스 지식베이스 (중앙 DB)
                         + MCP 능동 참조 (Claude가 구현 전 자동 조회)
                         + 시맨틱 검색 (cross-workspace, pgvector)
                         + 팀 토론 (이벤트별 코멘트)
```

### MCP Universal Advantage

Cursor, Claude Code, 향후 다른 AI 코딩 도구들이 모두 MCP를 지원하는 방향으로 수렴 중.
`.mcp.json` 하나로 모든 MCP 호환 도구에서 HUGININ 연결 가능 — 특정 도구에 종속되지 않음.

### 타깃 시나리오

1. **신입 온보딩**: 팀 결정 이력 즉시 접근 — "왜 이 아키텍처?" 스스로 발견
2. **중복 실수 방지**: Claude가 구현 전 "3주 전 이 방식 시도했다가 반려됨" 자동 알림
3. **기술 부채 감사**: "Redis 관련 모든 결정" 검색 → 일관성 확인
4. **PM/디자이너 리뷰**: comment 권한으로 CLI 없이 의사결정 검토
