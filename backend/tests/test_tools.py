import os
import tempfile

import pytest

from app.tools.registry import ToolRegistry


@pytest.fixture
def sandbox(tmp_path, monkeypatch):
    """Set sandbox dir to tmp_path."""
    monkeypatch.setenv("FORKFLOW_SANDBOX_DIR", str(tmp_path))
    # Reimport config to pick up new env
    import importlib
    import app.config
    importlib.reload(app.config)
    import app.tools.file_ops
    importlib.reload(app.tools.file_ops)
    return tmp_path


def test_read_file_within_sandbox(sandbox):
    test_file = sandbox / "test.txt"
    test_file.write_text("hello world")
    reg = ToolRegistry()
    result = reg.execute("read_file", {"path": "test.txt"})
    assert result == "hello world"


def test_read_file_outside_sandbox(sandbox):
    reg = ToolRegistry()
    result = reg.execute("read_file", {"path": "../../etc/passwd"})
    assert "Error" in result
    assert "outside sandbox" in result


def test_read_file_not_found(sandbox):
    reg = ToolRegistry()
    result = reg.execute("read_file", {"path": "nonexistent.txt"})
    assert "Error" in result
    assert "not found" in result


def test_write_file_within_sandbox(sandbox):
    reg = ToolRegistry()
    result = reg.execute("write_file", {"path": "output.txt", "content": "data"})
    assert result == "ok"
    assert (sandbox / "output.txt").read_text() == "data"


def test_write_file_path_traversal_blocked(sandbox):
    reg = ToolRegistry()
    result = reg.execute("write_file", {"path": "../../etc/hack", "content": "bad"})
    assert "Error" in result
    assert "outside sandbox" in result


def test_write_file_nested_dirs(sandbox):
    reg = ToolRegistry()
    result = reg.execute("write_file", {"path": "sub/dir/file.txt", "content": "nested"})
    assert result == "ok"
    assert (sandbox / "sub" / "dir" / "file.txt").read_text() == "nested"


def test_execute_code_simple():
    reg = ToolRegistry()
    result = reg.execute("execute_code", {"code": "print('hello from code')"})
    assert "hello from code" in result


def test_execute_code_returns_stdout():
    reg = ToolRegistry()
    result = reg.execute("execute_code", {"code": "x=5; print(x*2)"})
    assert "10" in result


def test_execute_code_timeout():
    reg = ToolRegistry()
    result = reg.execute("execute_code", {"code": "while True: pass"})
    assert "timed out" in result


def test_execute_code_error():
    reg = ToolRegistry()
    result = reg.execute("execute_code", {"code": "raise ValueError('boom')"})
    assert "Error" in result or "boom" in result


def test_unknown_tool():
    reg = ToolRegistry()
    result = reg.execute("hack_mainframe", {})
    assert "not found" in result


def test_get_available_whitelist():
    reg = ToolRegistry()
    available = reg.get_available(["read_file", "web_search"])
    assert "read_file" in available
    assert "web_search" in available
    assert "write_file" not in available
    assert "execute_code" not in available


def test_get_available_empty_whitelist():
    reg = ToolRegistry()
    available = reg.get_available([])
    assert available == {}


def test_get_available_all():
    reg = ToolRegistry()
    available = reg.get_available(["read_file", "write_file", "web_search", "execute_code"])
    assert len(available) == 4
