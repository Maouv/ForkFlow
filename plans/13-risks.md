## 13. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| ReAct tool calling unreliable (LLM doesn't follow format) | Agent can't use tools | Prompt engineering + max 3 iterations + fallback to no-tools response |
| React Flow state sync with backend | Lost edges/nodes on save | Full graph save (atomic), no incremental sync. Load → edit → save cycle. |
| Provider API format differences | Adapter bugs | Abstract interface + per-adapter tests with mocked HTTP |
| SQLite concurrent writes (WS + HTTP) | Database locked | SQLAlchemy `check_same_thread=False` + single writer. Phase 2: WAL mode. |
| Context overflow with full_history | Token limit exceeded | Truncate at 8000 chars, keep most recent. Phase 2: summarization. |
| Tool sandbox escape | Security risk | Path resolution + prefix check. Subprocess with restricted cwd. No network for code tool. |

---
