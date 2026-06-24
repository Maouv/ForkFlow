import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import AsyncMock, patch

from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    _auth = {"Authorization": "Basic YWRtaW46Y2hhbmdlbWU="}
    app.dependency_overrides[get_db] = override_get_db
    c = TestClient(app, headers=_auth)
    c._test_session = TestingSession
    yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)


def _create_provider(client, name="deepseek"):
    r = client.post("/api/providers", json={
        "name": name,
        "type": "openai_compatible",
        "base_url": "https://api.deepseek.com",
        "api_key": "sk-test",
        "default_model": "deepseek-chat",
    })
    return r.json()["id"]


def _create_agent(client, provider_id, name="planner"):
    r = client.post("/api/agents", json={
        "name": name,
        "system_prompt": "You are a planner",
        "provider_id": provider_id,
        "tools": ["read_file", "web_search"],
    })
    return r.json()


def test_create_agent(client):
    pid = _create_provider(client)
    a = _create_agent(client, pid)
    assert a["name"] == "planner"
    assert a["provider_id"] == pid
    assert a["tools"] == ["read_file", "web_search"]
    assert a["active"] is True
    assert a["memory_type"] == "session"
    assert a["conversation_scope"] == "full_history"


def test_create_duplicate_409(client):
    pid = _create_provider(client)
    _create_agent(client, pid, "dup")
    r = client.post("/api/agents", json={
        "name": "dup", "system_prompt": "x", "provider_id": pid, "tools": []
    })
    assert r.status_code == 409


def test_list_agents(client):
    pid = _create_provider(client)
    _create_agent(client, pid, "a1")
    _create_agent(client, pid, "a2")
    r = client.get("/api/agents")
    assert len(r.json()) == 2


def test_get_agent(client):
    pid = _create_provider(client)
    a = _create_agent(client, pid)
    r = client.get(f"/api/agents/{a['id']}")
    assert r.status_code == 200
    assert r.json()["name"] == "planner"


def test_get_agent_404(client):
    assert client.get("/api/agents/999").status_code == 404


def test_update_agent(client):
    pid = _create_provider(client)
    a = _create_agent(client, pid)
    r = client.put(f"/api/agents/{a['id']}", json={
        "name": "updated", "model": "deepseek-coder"
    })
    assert r.status_code == 200
    assert r.json()["name"] == "updated"
    assert r.json()["model"] == "deepseek-coder"


def test_toggle_agent(client):
    pid = _create_provider(client)
    a = _create_agent(client, pid)
    assert a["active"] is True
    r = client.patch(f"/api/agents/{a['id']}/toggle")
    assert r.status_code == 200
    assert r.json()["active"] is False
    r = client.patch(f"/api/agents/{a['id']}/toggle")
    assert r.json()["active"] is True


def test_delete_agent(client):
    pid = _create_provider(client)
    a = _create_agent(client, pid)
    r = client.delete(f"/api/agents/{a['id']}")
    assert r.status_code == 204
    assert client.get(f"/api/agents/{a['id']}").status_code == 404


def test_delete_agent_with_node_409(client):
    pid = _create_provider(client)
    a = _create_agent(client, pid)
    # Insert node directly via test DB (flows router not yet built)
    from app.models import Flow, Node
    db = client._test_session()
    flow = Flow(name="f1")
    db.add(flow)
    db.commit()
    db.refresh(flow)
    db.add(Node(flow_id=flow.id, node_type="conversation", agent_profile_id=a["id"], label="n1"))
    db.commit()
    db.close()
    r = client.delete(f"/api/agents/{a['id']}")
    assert r.status_code == 409


def test_test_agent_mock(client):
    pid = _create_provider(client)
    a = _create_agent(client, pid)

    mock_adapter = AsyncMock()
    mock_adapter.call = AsyncMock(return_value="Hello!")
    with patch("app.routers.agents.get_adapter", return_value=mock_adapter):
        r = client.post(f"/api/agents/{a['id']}/test", json={"message": "hi"})
    assert r.status_code == 200
    assert r.json()["response"] == "Hello!"
    # Verify adapter was called with correct args
    mock_adapter.call.assert_called_once()
    call_kwargs = mock_adapter.call.call_args
    assert call_kwargs.kwargs["model"] == "deepseek-chat"
    assert call_kwargs.kwargs["messages"][0]["role"] == "system"
    assert call_kwargs.kwargs["messages"][1]["content"] == "hi"


def test_test_agent_inactive_400(client):
    pid = _create_provider(client)
    a = _create_agent(client, pid)
    client.patch(f"/api/agents/{a['id']}/toggle")  # deactivate
    r = client.post(f"/api/agents/{a['id']}/test", json={"message": "hi"})
    assert r.status_code == 400


def test_test_agent_404(client):
    r = client.post("/api/agents/999/test", json={"message": "hi"})
    assert r.status_code == 404
