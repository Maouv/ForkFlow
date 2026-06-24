## 5. Tool System

### ToolRegistry

```python
class ToolRegistry:
    _tools: dict[str, Callable] = {
        "read_file": tool_read_file,
        "write_file": tool_write_file,
        "web_search": tool_web_search,
        "execute_code": tool_execute_code,
        "call_agent": tool_call_agent,
    }

    def get_available(self, whitelist: list[str]) -> dict[str, Callable]:
        return {name: fn for name, fn in self._tools.items() if name in whitelist}

    def execute(self, name: str, args: dict) -> str:
        if name not in self._tools:
            return f"Error: tool '{name}' not found"
        return self._tools[name](**args)
```

### Tool Implementations

| Tool | Signature | Implementation |
|---|---|---|
| `read_file` | `(path: str) → str` | Open file, return content. Sandbox: restrict to `/workspace/forkflow-sandbox/` |
| `write_file` | `(path: str, content: str) → bool` | Write to sandbox dir only |
| `web_search` | `(query: str) → str` | Use DuckDuckGo HTML scrape (no API key needed) or Brave API if configured |
| `execute_code` | `(code: str) → str` | Run Python in subprocess, capture stdout, 10s timeout |
| `call_agent` | `(agent_name: str, input: str) → str` | Look up agent by name, call provider, return response (nested agent call) |

**Sandbox:** All file/code tools restricted to `/workspace/forkflow-sandbox/`. Path traversal blocked (resolve + check prefix).

---
