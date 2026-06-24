import json
import re

from dataclasses import dataclass


@dataclass
class EdgeForEval:
    target_node_id: int
    condition_type: str
    condition_value: str | None


def evaluate_edges(edges: list[EdgeForEval], node_output: str) -> int | None:
    """Evaluate outgoing edges, return first matching target_node_id or None."""
    for edge in edges:
        if _matches(edge, node_output):
            return edge.target_node_id
    return None


def _matches(edge: EdgeForEval, node_output: str) -> bool:
    ct = edge.condition_type
    cv = edge.condition_value or ""

    if ct == "none":
        return True
    if ct == "contains":
        return cv in str(node_output)
    if ct == "not_contains":
        return cv not in str(node_output)
    if ct == "json_path":
        return _eval_json_path(node_output, cv)
    return False


_OPERATORS = ["==", "!=", ">=", "<=", ">", "<", "contains"]


def _eval_json_path(node_output: str, expr: str) -> bool:
    """Parse 'field operator value' against JSON node_output."""
    # Find operator (check 2-char ops first)
    op = None
    field = ""
    value = ""

    for candidate in _OPERATORS:
        idx = expr.find(candidate)
        if idx != -1:
            # Pick the first match by operator list order
            # But need to pick the one that appears earliest for correctness
            op = candidate
            field = expr[:idx].strip()
            value = expr[idx + len(candidate):].strip()
            break

    if op is None:
        return False

    # Parse JSON output
    try:
        data = json.loads(node_output)
    except (json.JSONDecodeError, TypeError):
        return False

    if not isinstance(data, dict):
        return False

    if field not in data:
        return False

    actual = data[field]

    # Strip quotes from value
    if (value.startswith('"') and value.endswith('"')) or \
       (value.startswith("'") and value.endswith("'")):
        value = value[1:-1]

    # Try numeric comparison
    try:
        actual_num = float(actual)
        value_num = float(value)
        if op == "==":
            return actual_num == value_num
        if op == "!=":
            return actual_num != value_num
        if op == ">":
            return actual_num > value_num
        if op == "<":
            return actual_num < value_num
        if op == ">=":
            return actual_num >= value_num
        if op == "<=":
            return actual_num <= value_num
    except (ValueError, TypeError):
        pass

    # String comparison
    if op == "==":
        return str(actual) == value
    if op == "!=":
        return str(actual) != value
    if op == "contains":
        return value in str(actual)

    return False
