## 4. Core Engine Design

### FlowExecutor

```
execute(flow_id, user_input) → execution_id
  1. Load flow: nodes + edges from DB
  2. Create execution record (status=running)
  3. Build adjacency map from edges
  4. Find entry node (no incoming edges, node_type=conversation)
  5. Set current_node = entry_node, current_input = user_input
  6. Loop:
     a. Run node via NodeRunner(current_node, current_input, context)
     b. Save node_result
     c. Broadcast log via WSManager
     d. Find outgoing edges of current_node
     e. Evaluate conditions via Router
     f. If match → current_node = target, current_input = node_output
     g. If no match → stop flow (status=completed or failed if error)
  7. Update execution status + output
```

### NodeRunner

```
run(node, input, context) → output
  1. Load agent_profile (if node has one)
  2. Assemble messages via MemoryManager(scope, context)
  3. Check agent.tools → load via ToolRegistry
  4. Call ProviderAdapter(agent.provider, agent.model, messages, tools)
  5. If LLM response contains tool call → execute tool, append result, re-call LLM (ReAct loop, max 3 iterations)
  6. Return final LLM response
  7. Timeout enforcement: asyncio.wait_for(run, timeout_seconds)
```

### Router (Conditional Routing)

```python
def evaluate_edges(edges, node_output) -> target_node_id | None:
    # node_output can be string or JSON
    for edge in edges:  # ordered by priority
        if edge.condition_type == "none":
            return edge.target_node_id
        elif edge.condition_type == "contains":
            if edge.condition_value in str(node_output):
                return edge.target_node_id
        elif edge.condition_type == "not_contains":
            if edge.condition_value not in str(node_output):
                return edge.target_node_id
        elif edge.condition_type == "json_path":
            # Parse "verdict == \"APPROVED\"" or "score > 7"
            if evaluate_json_path(node_output, edge.condition_value):
                return edge.target_node_id
    return None  # no match → flow stops
```

**JSON path expression parser:**
- Format: `field operator value`
- Operators: `==`, `!=`, `>`, `<`, `>=`, `<=`, `contains`
- Example: `verdict == "APPROVED"`, `score > 7`
- Parse node_output as JSON, extract field, compare

### MemoryManager

```
assemble(scope, context) → messages[]
  context contains: all previous node_results in execution order

  full_history:
    → messages = [
        {role: "system", content: agent.system_prompt},
        {role: "user", content: "Previous context:\n" + format_all_results(context)},
        {role: "user", content: current_input}
      ]

  previous_only:
    → messages = [
        {role: "system", content: agent.system_prompt},
        {role: "user", content: previous_node_output},
        {role: "user", content: current_input}
      ]
```

**Conversation history format** (per spec):

```
{user}: pesan dari user
{agent_planner}: pesan dari agent bernama planner
{agent_reviewer}: pesan dari agent bernama reviewer
```

Each node result in context is formatted as:
```
{agent_name}: {output}
```
or
```
{user}: {original_input}
```
for the initial user input.

### ProviderAdapter

```python
class ProviderAdapter(ABC):
    @abstractmethod
    async def call(
        self, 
        messages: list[dict], 
        model: str, 
        tools: list[dict] | None = None,
        timeout: int = 60
    ) -> str:
        """Call LLM, return text response."""
        pass

class OpenAICompatAdapter(ProviderAdapter):
    async def call(self, messages, model, tools=None, timeout=60):
        # POST {base_url}/v1/chat/completions
        # Headers: Authorization: Bearer ***        # Body: {"model": model, "messages": messages, "tools": tools}
        # Return: response.choices[0].message.content

class AnthropicAdapter(ProviderAdapter):
    async def call(self, messages, model, tools=None, timeout=60):
        # POST {base_url}/v1/messages
        # Headers: x-api-key: {api_key}, anthropic-version: 2023-06-01
        # System prompt extracted from messages[0] if role=system
        # Body: {"model": model, "messages": [...], "system": system_prompt}
        # Return: response.content[0].text
```

### Tool Calling (ReAct-style)

Phase 1 uses **prompt-based tool calling** (universal, works with all providers including those without native function calling):

```
System prompt appended with:
You have access to these tools:
- read_file(path: str) → str: Read a file
- write_file(path: str, content: str) → bool: Write a file
- web_search(query: str) → str: Search the web
- execute_code(code: str) → str: Execute Python code
- call_agent(agent_name: str, input: str) → str: Call another agent

To use a tool, respond with:
[TOOL_CALL]{"name": "read_file", "args": {"path": "/tmp/data.txt"}}[/TOOL_CALL]

Wait for the result, then continue.
```

**ReAct loop (max 3 iterations):**
1. Call LLM with messages
2. Check response for `[TOOL_CALL]...[/TOOL_CALL]`
3. If found → parse JSON, execute tool via ToolRegistry, append tool result to messages, re-call LLM
4. If not found → return response as final output
5. Max 3 iterations → return last response with warning

---
