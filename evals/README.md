# evals/ — 품질 평가 (Phase 3 예정)

현재 임베딩 생성은 fastembed로 자동화되어 있음.
Hermes 기반 LLM 정제 평가 파이프라인은 Phase 3에서 활성화 예정.

---

## 폴더 구조

```
evals/
├── schemas/
│   └── reasoning_trace.json       # CoT 로그 표준 포맷 (Hermes 호환)
├── benchmarks/
│   ├── code_refactoring/
│   ├── architecture_decision/
│   └── bug_resolution/
├── metrics/
│   └── success_rate.py            # 의사결정 품질 자동 평가 스크립트
├── harness_logs/
└── README.md
```

---

## 현재 상태

| 기능 | 상태 | 비고 |
|---|---|---|
| 임베딩 생성 | ✅ 자동화 | fastembed BAAI/bge-small-en-v1.5, 백그라운드 |
| 시맨틱 검색 | ✅ 운영 중 | pgvector HNSW, `/memory/recall` MCP 도구 |
| Hermes 품질 평가 | Phase 3 | LLM 정제 파이프라인 활성화 후 |
| Decision Graph | Phase 3 | Neo4j AuraDB 도입 후 |

---

## Hermes 기반 평가 기준 (Phase 3)

`reasoning_trace.json` 포맷:

```json
{
  "trace_id": "커밋 해시 기반 고유 ID",
  "timestamp": "ISO 8601",
  "agent": "claude-code | codex | other",
  "model": "claude-sonnet-4-6 | ...",
  "prompt": "원본 프롬프트",
  "reasoning_steps": ["CoT 단계별 추론"],
  "output": "최종 생성 코드 또는 응답",
  "diff": "연관된 git diff",
  "commit_hash": "git commit SHA",
  "decision_tags": ["best-practice", "tech-debt", "architecture-change"],
  "hermes_score": 0.0
}
```

---

## 평가 지표 (`metrics/success_rate.py`)

| 지표 | 설명 |
|---|---|
| `hermes_score` | Hermes 벤치마크 기준 추론 품질 점수 (0~1) |
| `decision_integrity` | 승인된 아키텍처 규칙 준수 여부 |
| `token_efficiency` | 동일 결과 대비 토큰 사용 효율 |
| `reuse_rate` | 지식베이스 기존 패턴 재사용 비율 |

---

## 지식베이스 등록 기준 (Phase 3 목표)

1. `hermes_score >= 0.7`
2. `decision_integrity == pass`
3. 프롬프트 원문 포함 (마스킹 처리 완료)
4. 연관 커밋 해시 존재

현재는 모든 수집 이벤트가 평가 없이 즉시 지식베이스에 등록됨.
Phase 3에서 품질 게이트 도입 예정.
