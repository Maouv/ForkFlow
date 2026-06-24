<p align="center">
  <img src="frontend/public/logo.png" alt="ForkFlow Logo" width="200" />
</p>

<h1 align="center">ForkFlow</h1>

<p align="center">Open-source, self-hosted AI agent orchestration platform with a visual node-based flow editor.</p>

---

## Features

- **Visual Flow Editor** — Drag-and-drop node editor (React Flow) for building agent workflows
- **Agent Profiles** — Independent agent configs: system prompt, provider, model, tool whitelist, memory type
- **Multi-Provider Support** — OpenAI-compatible APIs (DeepSeek, GLM, MiniMax, Ollama), Anthropic Claude, and custom HTTP endpoints
- **Node Types** — `conversation` (user-facing) and `processor` (background) nodes
- **Conditional Routing** — Route flow based on `contains`, `not_contains`, or `json_path` conditions
- **Live Execution Logs** — Real-time WebSocket streaming of per-agent logs
- **Execution History** — Full audit trail: input, output per node, status, duration, timestamps
- **Built-in Tools** — `read_file`, `write_file`, `web_search`, `execute_code`, `call_agent` (sandboxed)
- **First-Run Setup** — Create admin credentials via web UI on first launch (no hardcoded passwords)
- **Single-User Auth** — Basic Auth with PBKDF2-hashed credentials stored in SQLite
- **API Key Encryption** — Provider API keys encrypted at rest (Fernet/AES)
- **Mobile-First UI** — Responsive design, drawer sidebar, bottom-sheet panels, touch-optimized
- **Docker Compose Deploy** — One command to run the entire stack

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind v4 + @xyflow/react + Zustand |
| Backend | Python FastAPI + SQLAlchemy + SQLite + WebSocket |
| Deploy | Docker Compose (backend uvicorn + frontend nginx) |

---

## Quick Start (Docker Compose)

### Prerequisites

- Docker 20.10+
- Docker Compose v2

### Steps

```bash
git clone https://github.com/Maouv/ForkFlow.git
cd ForkFlow

# 1. Configure environment
cp .env.example .env
# Edit .env: set initial admin credentials (encryption key auto-generated if empty)

# 2. Build and start
docker compose up -d --build

# 3. Open browser
# http://localhost:3000
```

**First launch:** You'll see the **Setup Page** — create your admin username and password. After that, the login page appears on every visit.

### Configuration (`.env`)

| Variable | Required | Description |
|---|---|---|
| `FORKFLOW_USERNAME` | No* | Default admin username (used only before web setup) |
| `FORKFLOW_PASSWORD` | No* | Default admin password (used only before web setup) |
| `FORKFLOW_ENCRYPTION_KEY` | No | Fernet key for encrypting provider API keys (auto-generated if empty) |
| `FORKFLOW_DATABASE_PATH` | No | SQLite path (default: `/data/forkflow.db`) |
| `FORKFLOW_SANDBOX_PATH` | No | Tool sandbox directory (default: `/data/sandbox`) |

*After completing first-run setup via the web UI, DB credentials take precedence over env vars.

---

## Quick Start (Without Docker)

No Docker needed. Two scripts handle everything.

### Prerequisites

- Python 3.11+
- Node.js 20+

### Steps

```bash
git clone https://github.com/Maouv/ForkFlow.git
cd ForkFlow

# 1. Setup (check deps, install, build frontend)
./setup.sh

# 2. Start
./start.sh

# 3. Open browser
# http://localhost:8000
```

`setup.sh` does: check Python/Node versions → create `.env` → backend venv + pip install → frontend npm install + build.

`start.sh` does: load `.env` → activate venv → run uvicorn (serves both API and frontend in one process).

That's it. No nginx, no proxy, no second port.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│  React SPA (Vite build → nginx/CDN)         │
└──────────┬──────────────────┬───────────────┘
           │ HTTP /api/*      │ WS /ws/*
           ▼                  ▼
┌─────────────────────────────────────────────┐
│              FastAPI Backend                 │
│                                              │
│  Routers: providers, agents, flows,         │
│           executions, auth                   │
│                                              │
│  Engine: executor → node_runner → adapter    │
│  Tools: sandboxed read/write/exec/search     │
│  Auth: PBKDF2 + Basic Auth                   │
│  Crypto: Fernet (API key encryption)         │
└──────────┬──────────────────────────────────┘
           │ SQLAlchemy
           ▼
┌─────────────────────────────────────────────┐
│            SQLite (forkflow.db)              │
│  providers, agent_profiles, flows,          │
│  nodes, edges, executions, node_results,    │
│  user_credentials                            │
└─────────────────────────────────────────────┘
```

### Execution Flow

1. User clicks **Run** on a flow with input text
2. Backend creates an `Execution` record (status: `running`)
3. `FlowExecutor` traverses nodes in topological order:
   - `NodeRunner` loads agent profile → resolves provider → calls `ProviderAdapter`
   - Adapter sends LLM request (OpenAI/Anthropic/custom HTTP)
   - Response stored as `NodeResult` (input, output, status, duration)
   - Logs broadcast via WebSocket in real-time
   - `ConditionalRouter` evaluates edge conditions → picks next node
4. Execution completes → status: `completed` or `failed`
5. Frontend polls status + displays per-node timeline + final output

---

## API Reference

### Auth (public before setup)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/status` | Check if setup is required |
| `POST` | `/api/auth/setup` | First-run admin account creation |
| `POST` | `/api/auth/change-password` | Change admin password (auth required) |

### Providers

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/providers` | List all providers |
| `POST` | `/api/providers` | Create provider |
| `GET` | `/api/providers/{id}` | Get provider |
| `PUT` | `/api/providers/{id}` | Update provider |
| `DELETE` | `/api/providers/{id}` | Delete provider (409 if agents attached) |

### Agents

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/agents` | List all agent profiles |
| `POST` | `/api/agents` | Create agent profile |
| `GET` | `/api/agents/{id}` | Get agent profile |
| `PUT` | `/api/agents/{id}` | Update agent profile |
| `DELETE` | `/api/agents/{id}` | Delete agent (409 if used in nodes) |
| `POST` | `/api/agents/{id}/test` | Test agent with a message (mock LLM call) |

### Flows

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/flows` | List all flows |
| `POST` | `/api/flows` | Create empty flow |
| `GET` | `/api/flows/{id}` | Get flow with nodes + edges |
| `PUT` | `/api/flows/{id}` | Replace flow graph (nodes + edges) |
| `DELETE` | `/api/flows/{id}` | Delete flow |
| `POST` | `/api/flows/{id}/execute` | Execute flow with input |

### Executions

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/executions` | List executions (optional `?flow_id=` filter) |
| `GET` | `/api/executions/{id}` | Get execution detail with node results |
| `WS` | `/ws/logs/{id}` | WebSocket: real-time execution logs |

All endpoints except `/api/auth/status` and `/api/auth/setup` require `Authorization: Basic` header.

---

## Testing

```bash
cd backend
source .venv/bin/activate
pytest -v
```

**125 tests** covering: providers, agents, flows, executions, executor, router, memory, tools, WebSocket, auth setup, crypto, and a full E2E integration test.

---

## License

MIT

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/your-feature`)
3. Run tests (`cd backend && pytest -v`)
4. Commit and push
5. Open a Pull Request

---

Built with ponytail (minimal scaffold, no premature abstraction) and impeccable (OKLCH design tokens, mobile-first, accessible).
