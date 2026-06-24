## 3. API Design

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Basic auth, returns session token |

### Providers

| Method | Path | Description |
|---|---|---|
| GET | `/api/providers` | List all |
| POST | `/api/providers` | Create |
| GET | `/api/providers/{id}` | Get one |
| PUT | `/api/providers/{id}` | Update |
| DELETE | `/api/providers/{id}` | Delete (block if agents reference it) |

### Agent Profiles

| Method | Path | Description |
|---|---|---|
| GET | `/api/agents` | List all |
| POST | `/api/agents` | Create |
| GET | `/api/agents/{id}` | Get one |
| PUT | `/api/agents/{id}` | Update |
| DELETE | `/api/agents/{id}` | Delete (block if nodes reference it) |
| PATCH | `/api/agents/{id}/toggle` | Toggle active on/off |
| POST | `/api/agents/{id}/test` | Test agent: send a message, get response (no flow needed) |

### Flows

| Method | Path | Description |
|---|---|---|
| GET | `/api/flows` | List all |
| POST | `/api/flows` | Create (empty flow) |
| GET | `/api/flows/{id}` | Get flow with nodes + edges |
| PUT | `/api/flows/{id}` | Update flow (save full graph: nodes + edges in one transaction) |
| DELETE | `/api/flows/{id}` | Delete |

**PUT `/api/flows/{id}` body** — saves entire graph in one request:

```json
{
  "name": "Content Review Pipeline",
  "description": "Review and approve content",
  "nodes": [
    {
      "id": 1,
      "node_type": "conversation",
      "agent_profile_id": 3,
      "label": "User Input",
      "config": {"prompt_template": "...", "timeout_seconds": 60},
      "position": {"x": 100, "y": 200}
    }
  ],
  "edges": [
    {
      "source_node_id": 1,
      "target_node_id": 2,
      "condition_type": "none",
      "condition_value": null,
      "label": ""
    }
  ]
}
```

### Executions

| Method | Path | Description |
|---|---|---|
| POST | `/api/flows/{id}/execute` | Trigger flow. Body: `{"input": "user message"}` |
| GET | `/api/executions` | List (paginated, filter by flow_id) |
| GET | `/api/executions/{id}` | Get detail with all node_results |

### WebSocket

| Path | Description |
|---|---|
| `WS /ws/logs/{execution_id}` | Subscribe to live log events for an execution |

**WebSocket message format:**

```json
{
  "timestamp": "2026-06-24T10:30:00.123",
  "node_id": 2,
  "node_label": "Analyzer",
  "level": "info",
  "message": "Calling provider deepseek with model deepseek-chat..."
}
```

**Log levels:** `info`, `warning`, `error`, `debug`

---
