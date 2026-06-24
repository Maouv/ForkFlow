import os
from pathlib import Path

from app.config import settings


def _sandbox_root() -> Path:
    return Path(settings.forkflow_sandbox_dir).resolve()


def _safe_path(path: str) -> Path:
    """Resolve path within sandbox. Raise ValueError if traversal attempt."""
    root = _sandbox_root()
    full = (root / path).resolve()
    if not str(full).startswith(str(root)):
        raise ValueError(f"Path outside sandbox: {path}")
    return full


def tool_read_file(path: str) -> str:
    try:
        full = _safe_path(path)
    except ValueError as e:
        return f"Error: {e}"
    if not full.exists():
        return f"Error: file not found: {path}"
    if not full.is_file():
        return f"Error: not a file: {path}"
    return full.read_text()


def tool_write_file(path: str, content: str) -> str:
    try:
        full = _safe_path(path)
    except ValueError as e:
        return f"Error: {e}"
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content)
    return "ok"
