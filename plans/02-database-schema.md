## 2. Database Schema

### ER Diagram

```
providers 1───* agent_profiles
agent_profiles 1───* nodes
flows 1───* nodes
flows 1───* edges
flows 1───* executions
executions 1───* node_results
nodes 1───* node_results
```

### Table Definitions

#### providers

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | auto-increment |
| name | String(50) | unique, not null |
| type | String(20) | `openai_compatible` / `anthropic` |
| base_url | String(255) | not null |
| api_key_encrypted | Text | Fernet-encrypted, nullable (for local Ollama) |
| default_model | String(100) | not null |
| created_at | DateTime | server default |

#### agent_profiles

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(50) | unique, not null |
| system_prompt | Text | not null |
| provider_id | Integer FK → providers.id | not null |
| model | String(100) | override provider default, nullable |
| tools | JSON | array of tool name strings, e.g. `["read_file", "web_search"]` |
| memory_type | String(20) | `session` (Phase 1 only) |
| conversation_scope | String(20) | `full_history` / `previous_only` |
| active | Boolean | default true |
| created_at | DateTime | |

#### flows

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(100) | not null |
| description | Text | nullable |
| created_at | DateTime | |
| updated_at | DateTime | onupdate |

#### nodes

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| flow_id | Integer FK → flows.id | |
| node_type | String(20) | `conversation` / `processor` |
| agent_profile_id | Integer FK → agent_profiles.id | nullable (processor may not need agent) |
| label | String(100) | display name in editor |
| config | JSON | node-specific config (see below) |
| position_x | Float | React Flow canvas position |
| position_y | Float | |

**Node config JSON shapes:**

```json
// conversation node
{
  "prompt_template": "User said: {input}. Respond accordingly.",
  "timeout_seconds": 60
}

// processor node
{
  "instruction": "Analyze the input JSON and return a verdict.",
  "output_schema": {"verdict": "string", "score": "int"},
  "timeout_seconds": 60
}
```

#### edges

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| flow_id | Integer FK → flows.id | |
| source_node_id | Integer FK → nodes.id | |
| target_node_id | Integer FK → nodes.id | |
| condition_type | String(20) | `contains` / `not_contains` / `json_path` / `none` |
| condition_value | String(255) | keyword string or JSON path expression |
| label | String(100) | edge label in editor |

**Condition evaluation:**
- `none` → always route (unconditional edge)
- `contains` → route if node output string contains `condition_value`
- `not_contains` → route if output does NOT contain `condition_value`
- `json_path` → evaluate expression like `verdict == "APPROVED"` or `score > 7` against parsed JSON output

#### executions

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| flow_id | Integer FK → flows.id | |
| status | String(20) | `pending` / `running` / `completed` / `failed` |
| started_at | DateTime | |
| completed_at | DateTime | nullable |
| input | Text | initial user input (conversation nodes) |
| output | Text | final output (last node or error) |

#### node_results

| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| execution_id | Integer FK → executions.id | |
| node_id | Integer FK → nodes.id | |
| status | String(20) | `pending` / `running` / `completed` / `failed` / `skipped` |
| input | JSON | input data sent to node |
| output | JSON | output data from node |
| error_message | Text | nullable |
| started_at | DateTime | |
| completed_at | DateTime | nullable |
| duration_ms | Integer | |

---
