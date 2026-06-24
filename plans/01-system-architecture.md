## 1. System Architecture

```
┌──────────────────────────────────────────────┐
│  Frontend (React + React Flow + Zustand)     │
│                                              │
│  - Node editor canvas (React Flow)           │
│  - Agent profile manager                     │
│  - Provider config manager                   │
│  - Execution panel + live logs (WebSocket)   │
│  - Basic auth login                          │
└────────────────┬─────────────────────────────┘
                 │ HTTP REST + WebSocket
┌────────────────▼─────────────────────────────┐
│  Backend (FastAPI)                            │
│                                               │
│  API Layer (routers):                         │
│    /api/auth, /api/providers, /api/agents,    │
│    /api/flows, /api/executions, /ws/logs      │
│                                               │
│  Core Engine:                                 │
│    FlowExecutor → NodeRunner → ProviderAdapter│
│    Router (conditional) → MemoryManager       │
│    ToolRegistry → WSManager (broadcast logs)  │
│                                               │
│  Data Layer:                                  │
│    SQLAlchemy ORM + SQLite (encrypted keys)   │
└───────────────────────────────────────────────┘
```

### Module Responsibilities

| Module | Responsibility |
|---|---|
| `routers/` | HTTP endpoints, request validation, response serialization |
| `models/` | SQLAlchemy ORM models, DB schema |
| `schemas/` | Pydantic v2 request/response schemas, config validation |
| `engine/executor.py` | Flow graph traversal, node orchestration, error handling |
| `engine/node_runner.py` | Per-node execution: assemble context → call provider → return output |
| `engine/router.py` | Evaluate edge conditions, select next node |
| `engine/memory.py` | Assemble conversation scope (full_history / previous_only) |
| `engine/ws_manager.py` | WebSocket connection pool, broadcast log events |
| `providers/base.py` | Abstract provider adapter interface |
| `providers/openai_compat.py` | OpenAI-compatible API adapter (DeepSeek, GLM, Ollama, etc.) |
| `providers/anthropic.py` | Anthropic Claude adapter |
| `tools/registry.py` | Tool registration, whitelist enforcement, dispatch |
| `tools/*.py` | Individual tool implementations |
| `auth/` | Basic auth middleware, password hashing |

---
