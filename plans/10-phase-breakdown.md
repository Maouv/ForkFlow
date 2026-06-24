## 10. Phase Breakdown

### Phase 1 — Trimmed MVP (4-6 weeks)

**In scope:**
- Agent CRUD + profile + toggle + test
- Provider config (openai_compatible + anthropic)
- Provider adapter (2 adapters)
- Visual node editor (React Flow)
- 2 node types: conversation, processor
- Sequential flow only
- 3 condition types: contains, not_contains, json_path
- Session memory (full_history + previous_only)
- 5 tools: read_file, write_file, web_search, execute_code, call_agent
- Manual trigger execution
- Execution history (per-node results)
- WebSocket live logs (non-streaming)
- Basic auth
- API key encryption (Fernet)
- Node timeout
- Error handling (node fail → flow stop)
- Flow persistence (save/load full graph)
- Schema validation (Pydantic)
- Context overflow protection (truncate)
- Rate limiting (semaphore per provider)
- Docker Compose deployment

**Deferred:**
- ~~hybrid, formatter node types~~
- ~~Parallel flow~~
- ~~starts_with, regex condition types~~
- ~~custom_http provider (external node)~~
- ~~Retry per agent~~
- ~~Persistent/hybrid memory~~
- ~~Selective conversation scope~~
- ~~Remaining 8 tools~~
- ~~Streaming~~
- ~~Webhook/schedule trigger~~
- ~~Cost tracking~~
- ~~Loop/subflow~~
- ~~Flow versioning~~

### Phase 2 — Feature Expansion

- hybrid + formatter node types
- Parallel flow (fork/join)
- starts_with + regex conditions
- custom_http provider (external node — Hermes integration)
- Retry failed agent (without re-running flow)
- Persistent + hybrid memory
- Selective conversation scope
- Remaining 8 tools (list_directory, delete_file, web_fetch, execute_command, read_json, write_json, wait, log)
- Streaming LLM responses via WebSocket
- Webhook + scheduled triggers
- Flow versioning (draft/published)
- Cost tracking per execution

### Phase 3 — Advanced

- Loop / subflow nodes
- API key rotation
- Multi-user auth
- Flow templates / marketplace
- Export/import flow as JSON file
- Execution replay
- Metrics dashboard (success rate, avg duration, cost)

---
