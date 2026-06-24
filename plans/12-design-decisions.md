## 12. Key Design Decisions

| Decision | Rationale |
|---|---|
| **ReAct-style tool calling** (not native function calling) | Universal — works with all providers including Ollama, DeepSeek, GLM. Less reliable but Phase 1 priority is compatibility. Phase 2 can add native function calling for providers that support it. |
| **Fernet for API key encryption** | Simple, symmetric, built into `cryptography` library. Good enough for self-hosted single-user. Phase 3: consider KMS integration. |
| **SQLite (not Postgres)** | Self-hosted, single-user, zero-config. File-based, easy Docker volume mount. Phase 3: offer Postgres option for multi-user. |
| **Zustand (not Redux)** | Minimal boilerplate, perfect for this app size. React Flow's state coexists cleanly. |
| **Prompt-based conversation scope** | `full_history` + `previous_only` covers 90% of use cases. Selective scope adds UI complexity (node picker) — defer to Phase 2. |
| **Full graph save (not incremental node/edge CRUD)** | React Flow manages graph state in frontend. Single PUT with full graph avoids sync issues. Atomic transaction in DB. |
| **Node timeout via asyncio.wait_for** | Clean async timeout. Exceed → node fails, flow stops. No complex retry logic in Phase 1. |
| **Sandbox for file/code tools** | Security: path traversal blocked, subprocess code runs in restricted dir. No host filesystem access. |
| **Basic auth (not JWT/OAuth)** | Self-hosted, single-user. Minimal complexity. Phase 3: multi-user → JWT. |
| **Non-streaming LLM responses** | Phase 1 simplicity. Logs show "calling..." → "response received". Phase 2: streaming via WebSocket. |

---
