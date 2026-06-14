from fastapi import FastAPI
from fastapi_mcp import FastApiMCP


def mount_mcp(app: FastAPI) -> None:
    """MCP tool 노출:
    - collect_event: AI 결정 수집
    - recall_decisions: 팀 과거 결정 시맨틱 검색

    Claude Code .mcp.json 설정:
      { "mcpServers": { "huginin": { "url": "http://localhost:8000/mcp", "type": "sse" } } }
    """
    mcp = FastApiMCP(
        app,
        name="HUGININ",
        description=(
            "Team AI decision memory. "
            "Use recall_decisions BEFORE starting any significant implementation "
            "to check if the team has solved similar problems before."
        ),
        include_operations=["collect_event_collect_event_post", "recall_decisions_memory_recall_get"],
    )
    mcp.mount()
