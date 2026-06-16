from collections import Counter
from dataclasses import dataclass, field
from uuid import UUID

# 분석 대상 기술 키워드 → 한국어 레이블
_DOMAIN_KEYWORDS: dict[str, list[str]] = {
    "DB 스키마": ["schema", "migration", "table", "column", "database", "db", "postgres", "sql", "asyncpg"],
    "인증/권한": ["auth", "jwt", "token", "login", "password", "user", "permission", "rbac", "session"],
    "API 설계": ["api", "endpoint", "router", "fastapi", "request", "response", "route", "handler"],
    "ETL 파이프라인": ["etl", "pipeline", "refine", "embedding", "backfill", "batch", "process"],
    "대시보드 UI": ["dashboard", "component", "chart", "timeline", "card", "ui", "react", "tsx"],
    "배포/인프라": ["deploy", "railway", "vercel", "docker", "ci", "cd", "environment", "env"],
    "테스트": ["test", "pytest", "mock", "fixture", "coverage"],
    "Git/버전관리": ["commit", "branch", "merge", "pr", "pull request", "hook", "git"],
}


@dataclass
class CacheSuggestion:
    domain: str          # "DB 스키마"
    count: int           # 반복 횟수
    priority: str        # "HIGH" | "MED" | "LOW"
    action: str          # "CLAUDE.md에 DB 스키마 추가" 등
    example: str         # 실제 what_was_built 예시
    suggestion_type: str # "domain" | "decision_type" | "token"


@dataclass
class CacheSuggestionsOutput:
    suggestions: list[CacheSuggestion] = field(default_factory=list)
    total_events_analyzed: int = 0
    avg_prompt_tokens: float = 0.0
    high_token_alert: bool = False  # 평균 prompt_tokens > 2000


@dataclass
class CacheSuggestionsInput:
    workspace_id: UUID
    user_id: UUID


class GetCacheSuggestionsUseCase:
    def __init__(self, event_repo):
        self._events = event_repo

    async def execute(self, input: CacheSuggestionsInput) -> CacheSuggestionsOutput:
        rows = await self._events.get_events_for_cache_analysis(input.workspace_id)

        if not rows:
            return CacheSuggestionsOutput()

        total = len(rows)
        suggestions: list[CacheSuggestion] = []

        # ── 1. 도메인 키워드 빈도 분석
        domain_hits: dict[str, list[str]] = {d: [] for d in _DOMAIN_KEYWORDS}
        for row in rows:
            text = " ".join(filter(None, [
                row.get("what_was_built") or "",
                row.get("problem_solved") or "",
            ])).lower()
            for domain, keywords in _DOMAIN_KEYWORDS.items():
                if any(kw in text for kw in keywords):
                    domain_hits[domain].append(row.get("what_was_built") or "")

        for domain, examples in domain_hits.items():
            count = len(examples)
            if count < 2:
                continue
            ratio = count / total
            priority = "HIGH" if ratio > 0.4 else "MED" if ratio > 0.2 else "LOW"
            suggestions.append(CacheSuggestion(
                domain=domain,
                count=count,
                priority=priority,
                action=f"CLAUDE.md에 {domain} 컨텍스트 고정",
                example=next((e for e in examples if e), ""),
                suggestion_type="domain",
            ))

        # ── 2. decision_type 반복 분석
        type_counter: Counter = Counter(
            row["decision_type"] for row in rows
            if row.get("decision_type") and row["decision_type"] != "other"
        )
        for dtype, count in type_counter.most_common(3):
            if count < 3:
                continue
            ratio = count / total
            priority = "HIGH" if ratio > 0.5 else "MED"
            label = {
                "feature": "기능 개발",
                "bugfix": "버그 픽스",
                "refactor": "리팩토링",
                "config": "설정/인프라",
                "docs": "문서화",
                "test": "테스트",
            }.get(dtype, dtype)
            suggestions.append(CacheSuggestion(
                domain=f"{label} 패턴",
                count=count,
                priority=priority,
                action=f"'{dtype}' 작업 시 자주 쓰는 컨텍스트를 CLAUDE.md에 추가",
                example=f"전체 {total}개 중 {count}개 ({round(ratio*100)}%) 가 {label}",
                suggestion_type="decision_type",
            ))

        # ── 3. 토큰 비용 경고
        token_rows = [r for r in rows if r.get("prompt_tokens")]
        avg_tokens = (
            sum(r["prompt_tokens"] for r in token_rows) / len(token_rows)
            if token_rows else 0.0
        )
        high_token = avg_tokens > 2000

        # 우선순위 정렬 (HIGH → MED → LOW, count 내림차순)
        priority_order = {"HIGH": 0, "MED": 1, "LOW": 2}
        suggestions.sort(key=lambda s: (priority_order[s.priority], -s.count))

        return CacheSuggestionsOutput(
            suggestions=suggestions[:6],  # 최대 6개
            total_events_analyzed=total,
            avg_prompt_tokens=round(avg_tokens),
            high_token_alert=high_token,
        )
