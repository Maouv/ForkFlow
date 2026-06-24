import json

import pytest
from unittest.mock import AsyncMock, MagicMock

from app.engine.ws_manager import WSManager


@pytest.fixture
def manager():
    return WSManager()


def _mock_ws():
    ws = MagicMock()
    ws.accept = MagicMock()
    ws.send_text = AsyncMock()
    return ws


def test_connect_accepts_and_stores(manager):
    ws = _mock_ws()
    manager.connect(1, ws)
    ws.accept.assert_called_once()
    assert 1 in manager.connections
    assert ws in manager.connections[1]


def test_disconnect_removes_ws(manager):
    ws = _mock_ws()
    manager.connect(1, ws)
    manager.disconnect(1, ws)
    assert 1 not in manager.connections


def test_disconnect_unknown_execution_noop(manager):
    ws = _mock_ws()
    manager.disconnect(999, ws)  # should not raise


def test_disconnect_unknown_ws_noop(manager):
    ws1 = _mock_ws()
    ws2 = _mock_ws()
    manager.connect(1, ws1)
    manager.disconnect(1, ws2)  # ws2 never connected
    assert ws1 in manager.connections[1]


def test_multiple_connections_same_execution(manager):
    ws1 = _mock_ws()
    ws2 = _mock_ws()
    manager.connect(1, ws1)
    manager.connect(1, ws2)
    assert len(manager.connections[1]) == 2
    manager.disconnect(1, ws1)
    assert len(manager.connections[1]) == 1
    assert ws2 in manager.connections[1]


@pytest.mark.asyncio
async def test_broadcast_sends_to_all(manager):
    ws1 = _mock_ws()
    ws2 = _mock_ws()
    manager.connect(1, ws1)
    manager.connect(1, ws2)
    await manager.broadcast(1, 5, "Agent A", "info", "started")
    assert ws1.send_text.called
    assert ws2.send_text.called
    msg = json.loads(ws1.send_text.call_args[0][0])
    assert msg["node_id"] == 5
    assert msg["node_label"] == "Agent A"
    assert msg["level"] == "info"
    assert msg["message"] == "started"
    assert "timestamp" in msg


@pytest.mark.asyncio
async def test_broadcast_no_connections_noop(manager):
    # No connections for execution_id=42
    await manager.broadcast(42, 1, "X", "info", "msg")  # should not raise


@pytest.mark.asyncio
async def test_broadcast_only_target_execution(manager):
    ws1 = _mock_ws()
    ws2 = _mock_ws()
    manager.connect(1, ws1)
    manager.connect(2, ws2)
    await manager.broadcast(1, 1, "A", "info", "hello")
    assert ws1.send_text.called
    assert not ws2.send_text.called
