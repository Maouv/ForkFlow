import json
import re
import time
from typing import NamedTuple

from sqlalchemy.orm import Session

from app.crypto import decrypt_api_key
from app.engine.memory import assemble, ContextEntry
from app.models import Node, AgentProfile, Provider
from app.providers import get_adapter
from app.tools.registry import ToolRegistry

TOOL_PROMPT = """

You have access to these tools:
{tool_list}

To use a tool, respond with:
[TOOL_CALL]{{"name": "<tool_name>", "args": {{...}}}}[/TOOL_CALL]

Wait for the result, then continue.
"""

MAX_TOOL_ITERATIONS = 3
TOOL_CALL_RE = re.compile(r"\[TOOL_CALL\](.*?)\[/TOOL_CALL\]", re.DOTALL)


class NodeRunResult(NamedTuple):
    output: str
    token_count: int | None


class NodeRunner:
    def __init__(self, db: Session):
        self.db = db

    async def run(
        self, node: Node, current_input: str, context: list[ContextEntry]
    ) -> NodeRunResult:
        agent = node.agent_profile
        if not agent:
            # No agent → pass through input
            return NodeRunResult(output=current_input, token_count=None)

        provider = self.db.get(Provider, agent.provider_id)
        if not provider:
            raise Exception(f"Provider not found for agent '{agent.name}'")

        api_key = decrypt_api_key(provider.api_key_encrypted) or ""

        # Build tool prompt
        tools = agent.tools or []
        tool_list = self._format_tools(tools)
        system_prompt = agent.system_prompt
        if tool_list:
            system_prompt += TOOL_PROMPT.format(tool_list=tool_list)

        # Assemble messages
        scope = node.config.get("conversation_scope", agent.conversation_scope)
        messages = assemble(system_prompt, scope, context, current_input)

        adapter = get_adapter(provider.type)
        model = agent.model or provider.default_model or ""

        # ReAct loop
        response = ""
        for i in range(MAX_TOOL_ITERATIONS):
            response = await adapter.call(
                base_url=provider.base_url,
                api_key=api_key,
                messages=messages,
                model=model,
                timeout=60,
            )

            # Check for tool call
            match = TOOL_CALL_RE.search(response)
            if not match:
                return NodeRunResult(output=response, token_count=None)

            # Execute tool
            tool_json = match.group(1).strip()
            tool_result = self._execute_tool_call(tool_json, tools)

            # Append to messages and re-call
            messages.append({"role": "assistant", "content": response})
            messages.append({"role": "user", "content": f"Tool result: {tool_result}"})

        # Max iterations reached
        # ponytail: token_count null until adapter returns usage
        return NodeRunResult(
            output=response + "\n[Warning: max tool iterations reached]",
            token_count=None,
        )

    def _format_tools(self, tools: list[str]) -> str:
        if not tools:
            return ""
        registry = ToolRegistry()
        available = registry.get_available(tools)
        lines = []
        for name, desc in available.items():
            lines.append(f"- {desc}")
        return "\n".join(lines)

    def _execute_tool_call(self, tool_json: str, whitelist: list[str]) -> str:
        try:
            parsed = json.loads(tool_json)
        except json.JSONDecodeError:
            return "Error: invalid tool call JSON"

        name = parsed.get("name", "")
        args = parsed.get("args", {})

        if name not in whitelist:
            return f"Error: tool '{name}' not available"

        registry = ToolRegistry()
        return registry.execute(name, args)
