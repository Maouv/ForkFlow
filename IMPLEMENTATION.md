# Forkflow — Implementation Execution Plan

> **CRITICAL: Baca plan sebelum mulai sesuatu.**
> Sebelum setiap task, buka file plan yang relevan di `/workspace/.hermes/plans/forkflow/` dan baca ulang.
> Jangan asumsi. Jangan skip. Baca → pahami → baru code.

## Principles

1. **Pelan-pelan.** Satu task per session kalau perlu. Verifikasi sebelum lanjut.
2. **Baca plan dulu.** Setiap task punya referensi file plan. Baca sebelum code.
3. **TDD.** Test dulu → fail → implement → pass → commit.
4. **Ponytail mindset.** YAGNI. Stdlib dulu. Minimal code. Kalau bisa 1 line, 1 line. Kalau ga perlu, jangan buat.
5. **Incremental verify.** User mau verifikasi tiap langkah sebelum lanjut.
6. **Commit per task.** Bite-sized commit, jelas message-nya.
7. **Jangan install deps tanpa izin.** Tanya user dulu kalau butuh package baru.

## Skills to Load

| Skill | Kapan | Untuk apa |
|---|---|---|
| `ponytail` | Setiap task backend/engine | YAGNI discipline, minimal code, no over-engineering |
| `ponytail-review` | Sebelum commit | Cek over-engineering di diff |
| `impeccable` | Sprint 3 (frontend) | Design system, typography, color, anti-pattern detection |
| `test-driven-development` | Setiap task | RED-GREEN-REFACTOR enforcement |

---

## Sprint 1: Backend Foundation (Task 1-8)

### Task 1: Project Scaffold
- **Baca dulu:** `00-overview.md`, `08-project-structure.md`, `09-env-config.md`
- **Buat:** requirements.txt, config.py, database.py, main.py, Dockerfile, .env.example, docker-compose.yml
- **Verify:** `uvicorn app.main:app` → GET `/api/health` → `{"status":"ok"}`
- **Commit:** `feat: project scaffold + health endpoint`

### Task 2: Crypto Module
- **Baca dulu:** `06-gap-fixes.md` (API key encryption row), `11-phase1-tasks.md` Task 2
- **TDD:** test_crypto.py → fail → crypto.py → pass
- **Verify:** `pytest tests/test_crypto.py -v`
- **Commit:** `feat: fernet crypto module for api key encryption`

### Task 3: Database Models
- **Baca dulu:** `02-database-schema.md` (semua 7 tabel), `08-project-structure.md` (models/)
- **Buat:** provider.py, agent.py, flow.py, execution.py models per schema
- **Verify:** `python -c "from app.models import *; Base.metadata.create_all(engine)"`
- **Commit:** `feat: sqlalchemy models for 7 tables`

### Task 4: Alembic Migrations
- **Baca dulu:** `11-phase1-tasks.md` Task 4, `14-open-questions.md` (Q3)
- **Setup:** alembic init, configure env.py, autogenerate initial migration
- **Verify:** `alembic upgrade head` → tables exist
- **Commit:** `feat: alembic setup + initial schema migration`

### Task 5: Pydantic Schemas
- **Baca dulu:** `03-api-design.md`, `02-database-schema.md` (validasi rules), `11-phase1-tasks.md` Task 5
- **Buat:** provider.py, agent.py, flow.py, execution.py schemas
- **Key:** validators untuk tools whitelist, timeout range, condition_type enum, json_path parseable
- **Verify:** import semua schema, no error
- **Commit:** `feat: pydantic v2 request/response schemas`

### Task 6: Provider CRUD Router
- **Baca dulu:** `03-api-design.md` (Providers section), `11-phase1-tasks.md` Task 6
- **Implement:** GET/POST/PUT/DELETE, encrypt api_key on save, has_api_key on response, 409 on delete-with-reference
- **TDD:** test_providers.py
- **Verify:** `pytest tests/test_providers.py -v`
- **Commit:** `feat: provider CRUD router`

### Task 7: Agent Profile CRUD Router
- **Baca dulu:** `03-api-design.md` (Agent Profiles section), `11-phase1-tasks.md` Task 7
- **Implement:** CRUD + PATCH toggle + POST test endpoint
- **TDD:** test_agents.py (mock provider untuk test endpoint)
- **Verify:** `pytest tests/test_agents.py -v`
- **Commit:** `feat: agent profile CRUD + toggle + test endpoint`

### Task 8: Flow CRUD Router
- **Baca dulu:** `03-api-design.md` (Flows section + PUT body), `11-phase1-tasks.md` Task 8
- **Implement:** GET/POST/PUT/DELETE, full graph save in single transaction
- **TDD:** test_flows.py
- **Verify:** `pytest tests/test_flows.py -v`
- **Commit:** `feat: flow CRUD router with full graph save`

---

## Sprint 2: Core Engine (Task 9-16)

### Task 9: Provider Adapters
- **Baca dulu:** `04-core-engine.md` (ProviderAdapter section), `11-phase1-tasks.md` Task 9
- **Buat:** base.py (abstract), openai_compat.py, anthropic.py
- **TDD:** test_providers_adapter.py (mock httpx)
- **Verify:** `pytest tests/test_providers_adapter.py -v`
- **Commit:** `feat: openai-compatible + anthropic provider adapters`

### Task 10: Tool Registry + 5 Tools
- **Baca dulu:** `05-tool-system.md`, `04-core-engine.md` (Tool Calling section), `11-phase1-tasks.md` Task 10
- **Buat:** registry.py, file_ops.py, web.py, code.py, flow_control.py
- **Key:** sandbox path enforcement, path traversal block, subprocess timeout 10s
- **TDD:** test_tools.py (all cases dari plan)
- **Verify:** `pytest tests/test_tools.py -v`
- **Commit:** `feat: tool registry + 5 tools with sandbox`

### Task 11: Memory Manager
- **Baca dulu:** `04-core-engine.md` (MemoryManager section), `11-phase1-tasks.md` Task 11
- **Implement:** assemble(scope, context, agent, current_input), full_history + previous_only, truncate >8000 chars
- **TDD:** test_memory.py
- **Verify:** `pytest tests/test_memory.py -v`
- **Commit:** `feat: memory manager with full_history + previous_only scope`

### Task 12: Conditional Router
- **Baca dulu:** `04-core-engine.md` (Router section), `11-phase1-tasks.md` Task 12, `02-database-schema.md` (edges)
- **Implement:** evaluate_edges(edges, node_output), 4 condition types + json_path parser
- **TDD:** test_router.py (all cases dari plan)
- **Verify:** `pytest tests/test_router.py -v`
- **Commit:** `feat: conditional router with 4 condition types`

### Task 13: WebSocket Manager
- **Baca dulu:** `03-api-design.md` (WebSocket section), `11-phase1-tasks.md` Task 13
- **Implement:** WSManager class (connect, disconnect, broadcast)
- **Verify:** import + instantiate, no error
- **Commit:** `feat: websocket manager for live log broadcast`

### Task 14: Flow Executor + Node Runner
- **Baca dulu:** `04-core-engine.md` (FlowExecutor + NodeRunner section), `11-phase1-tasks.md` Task 14
- **Implement:** executor.py (graph traversal, timeout, error handling), node_runner.py (assemble context, call provider, ReAct loop max 3)
- **TDD:** test_executor.py (mock NodeRunner, sequential flow, conditional, timeout, error)
- **Verify:** `pytest tests/test_executor.py -v`
- **Commit:** `feat: flow executor + node runner with react loop`

### Task 15: Execution Router + WS Endpoint
- **Baca dulu:** `03-api-design.md` (Executions section), `11-phase1-tasks.md` Task 15
- **Implement:** POST execute, GET list, GET detail, WS /ws/logs/{execution_id}
- **Verify:** manual test via curl + websocket client
- **Commit:** `feat: execution router + websocket log endpoint`

### Task 16: Basic Auth
- **Baca dulu:** `11-phase1-tasks.md` Task 16, `12-design-decisions.md` (Basic auth row)
- **Implement:** basic_auth.py, apply to all routers except /api/health
- **Verify:** curl without auth → 401, curl with auth → 200
- **Commit:** `feat: basic auth middleware`

---

## Sprint 3: Frontend (Task 17-22)

> **Load `impeccable` skill sebelum Sprint 3.** Frontend design system, anti-patterns, typography, color.

### Task 17: Frontend Scaffold
- **Baca dulu:** `07-frontend.md`, `08-project-structure.md` (frontend/), `11-phase1-tasks.md` Task 17
- **Buat:** package.json, vite.config.ts, tsconfig.json, App.tsx, types/, api/client.ts, Dockerfile
- **Deps:** react, react-dom, @xyflow/react, zustand, axios, react-router-dom, tailwindcss
- **Verify:** `npm run dev` → blank page loads, no console error
- **Commit:** `feat: frontend scaffold with vite + react + tailwind`

### Task 18: React Flow Node Editor
- **Baca dulu:** `07-frontend.md` (React Flow Integration), `11-phase1-tasks.md` Task 18
- **Baca dulu:** `impeccable` skill reference/craft.md + reference/layout.md
- **Buat:** FlowCanvas, NodePalette, PropertiesPanel, ConversationNode, ProcessorNode, flowStore.ts, FlowEditorPage
- **Verify:** drag node, connect edge, edit properties, save → PUT API
- **Commit:** `feat: react flow node editor with custom nodes`

### Task 19: Agent Manager UI
- **Baca dulu:** `07-frontend.md` (Pages), `11-phase1-tasks.md` Task 19
- **Buat:** AgentList, AgentForm, AgentTestDialog, AgentsPage
- **Verify:** CRUD via UI, test dialog shows response
- **Commit:** `feat: agent manager UI with test dialog`

### Task 20: Provider Manager UI
- **Baca dulu:** `07-frontend.md`, `11-phase1-tasks.md` Task 20
- **Buat:** ProviderList, ProviderForm, ProvidersPage
- **Verify:** CRUD via UI, api_key never displayed
- **Commit:** `feat: provider manager UI`

### Task 21: Execution Panel + Live Logs
- **Baca dulu:** `03-api-design.md` (WebSocket message format), `07-frontend.md` (WebSocket Hook), `11-phase1-tasks.md` Task 21
- **Buat:** ExecutionHistory, ExecutionDetail, LiveLogs, useWebSocket.ts, ExecutionsPage
- **Verify:** run flow → see live logs streaming, history table populates
- **Commit:** `feat: execution panel with live websocket logs`

### Task 22: Auth Login Page
- **Baca dulu:** `11-phase1-tasks.md` Task 22
- **Buat:** LoginPage, localStorage credential storage, redirect on success
- **Verify:** login → redirect to flow editor, 401 → error shown
- **Commit:** `feat: auth login page`

---

## Sprint 4: Integration & Deploy (Task 23-25)

### Task 23: Docker Compose
- **Baca dulu:** `09-env-config.md`, `11-phase1-tasks.md` Task 23
- **Buat/Fix:** backend Dockerfile, frontend Dockerfile, docker-compose.yml, .env.example
- **Verify:** `docker-compose up --build` → backend :8000, frontend :3000, health check pass
- **Commit:** `feat: docker compose deployment`

### Task 24: E2E Integration Test
- **Baca dulu:** `11-phase1-tasks.md` Task 24 (test scenario)
- **Buat:** test_e2e.py — full flow with mocked provider
- **Verify:** `pytest tests/test_e2e.py -v` → all pass
- **Commit:** `test: e2e integration test`

### Task 25: README + Docs
- **Baca dulu:** `00-overview.md`
- **Buat:** README.md
- **Commit:** `docs: readme with quickstart and api reference`

---

## Execution Rules

1. **Sebelum mulai task:** baca file plan yang dirujuk. Always.
2. **Satu task pada satu waktu.** Selesai → verify → tanya user → lanjut.
3. **TDD setiap task yang punya logic.** Test dulu.
4. **Commit setelah task selesai + verified.** Jangan akumulasi.
5. **Ponytail check sebelum commit:** apakah ada yang over-engineered? Apakah bisa lebih simpel?
6. **Kalau stuck/butuh dep baru:** tanya user. Jangan install sendiri.
7. **Kalau plan kurang jelas di titik tertentu:** baca ulang plan, kalau masih ga jelas → tanya user.
8. **Verifikasi = tool output nyata.** Bukan "harusnya jalan". Run test, cek output.

## Pre-Task Checklist (setiap task)

```
[ ] File plan relevan udah dibaca?
[ ] Files yang akan dibuat/ubah jelas?
[ ] Test cases jelas?
[ ] Verification step jelas?
[ ] Commit message siap?
```
