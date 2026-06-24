from app.tools.code import tool_execute_code
from app.tools.file_ops import tool_read_file, tool_write_file
from app.tools.web import tool_web_search


# call_agent is async + needs DB access — registered separately, called by engine
# For Phase 1 sync registry, call_agent handled directly by NodeRunner (Task 14)
class ToolRegistry:
    _tools: dict = {
        "read_file": tool_read_file,
        "write_file": tool_write_file,
        "web_search": tool_web_search,
        "execute_code": tool_execute_code,
        # "call_agent" — handled by NodeRunner directly (needs DB + provider)
    }

    def get_available(self, whitelist: list[str]) -> dict:
        return {name: fn for name, fn in self._tools.items() if name in whitelist}

    def execute(self, name: str, args: dict) -> str:
        if name not in self._tools:
            return f"Error: tool '{name}' not found"
        try:
            return self._tools[name](**args)
        except Exception as e:
            return f"Error: {e}"
