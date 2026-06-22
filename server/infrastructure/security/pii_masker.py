import re

from application.ports.pii_port import PiiPort

# 순서 중요: 더 구체적인 패턴을 먼저 매칭
_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"sk-ant-[A-Za-z0-9\-_]{20,}"), "[ANTHROPIC_KEY]"),
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "[OPENAI_KEY]"),
    (re.compile(r"(?i)AKIA[A-Z0-9]{16}"), "[AWS_ACCESS_KEY]"),
    (re.compile(r"(?i)(?:password|passwd|pwd)\s*[:=]\s*\S+"), "[PASSWORD]"),
    (re.compile(r"(?i)(?:token|bearer)\s*[:=]\s*[A-Za-z0-9\-_.]{16,}"), "[TOKEN]"),
    (re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Z|a-z]{2,}"), "[EMAIL]"),
    # IP 주소는 인프라 컨텍스트(CIDR 블록 등)에서 핵심 정보이므로 마스킹하지 않음
]


class RegexPiiMasker(PiiPort):
    def mask(self, text: str) -> str:
        for pattern, replacement in _PATTERNS:
            text = pattern.sub(replacement, text)
        return text
