from dataclasses import dataclass


@dataclass
class ContextEntry:
    sender: str  # "user" or agent name
    output: str


MAX_CONTEXT_CHARS = 8000


def _format_entry(entry: ContextEntry) -> str:
    return f"{{{entry.sender}}}: {entry.output}"


def assemble(
    scope: str,
    system_prompt: str,
    context: list[ContextEntry],
    current_input: str,
) -> list[dict]:
    """Assemble messages list for provider call.

    Args:
        scope: "full_history" or "previous_only"
        system_prompt: Agent's system prompt
        context: Previous node results in execution order
        current_input: This node's input

    Returns:
        List of message dicts [{role, content}, ...]
    """
    messages: list[dict] = [{"role": "system", "content": system_prompt}]

    if scope == "full_history":
        if context:
            formatted = "\n".join(_format_entry(e) for e in context)
            if len(formatted) > MAX_CONTEXT_CHARS:
                # Truncate: keep most recent entries
                truncated = []
                total = 0
                for entry in reversed(context):
                    line = _format_entry(entry)
                    if total + len(line) > MAX_CONTEXT_CHARS:
                        break
                    truncated.insert(0, line)
                    total += len(line)
                formatted = "\n".join(truncated)
            messages.append(
                {"role": "user", "content": f"Previous context:\n{formatted}"}
            )
    elif scope == "previous_only":
        if context:
            messages.append(
                {"role": "user", "content": _format_entry(context[-1])}
            )

    messages.append({"role": "user", "content": current_input})
    return messages
