import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

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
    client = TestClient(app, headers=_auth)
    client._test_session = TestingSession
    yield client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)


def test_create_provider(client):
    resp = client.post("/api/providers", json={
        "name": "deepseek",
        "type": "openai_compatible",
        "base_url": "https://api.deepseek.com",
        "api_key": "sk-test123",
        "default_model": "deepseek-chat",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "deepseek"
    assert data["has_api_key"] is True
    assert "api_key" not in data
    assert "api_key_encrypted" not in data


def test_create_provider_no_key(client):
    resp = client.post("/api/providers", json={
        "name": "ollama",
        "type": "openai_compatible",
        "base_url": "http://localhost:11434",
        "default_model": "llama3",
    })
    assert resp.status_code == 201
    assert resp.json()["has_api_key"] is False


def test_create_duplicate_name_409(client):
    payload = {
        "name": "dup",
        "type": "openai_compatible",
        "base_url": "http://x",
        "default_model": "m",
    }
    client.post("/api/providers", json=payload)
    resp = client.post("/api/providers", json=payload)
    assert resp.status_code == 409


def test_list_providers(client):
    client.post("/api/providers", json={
        "name": "a", "type": "openai_compatible", "base_url": "http://a", "default_model": "m"
    })
    client.post("/api/providers", json={
        "name": "b", "type": "anthropic", "base_url": "http://b", "default_model": "m"
    })
    resp = client.get("/api/providers")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_provider(client):
    r = client.post("/api/providers", json={
        "name": "x", "type": "openai_compatible", "base_url": "http://x", "default_model": "m"
    })
    pid = r.json()["id"]
    resp = client.get(f"/api/providers/{pid}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "x"


def test_get_provider_404(client):
    assert client.get("/api/providers/999").status_code == 404


def test_update_provider(client):
    r = client.post("/api/providers", json={
        "name": "old", "type": "openai_compatible", "base_url": "http://x", "default_model": "m"
    })
    pid = r.json()["id"]
    resp = client.put(f"/api/providers/{pid}", json={"name": "new", "api_key": "sk-new"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "new"
    assert resp.json()["has_api_key"] is True


def test_delete_provider(client):
    r = client.post("/api/providers", json={
        "name": "del", "type": "openai_compatible", "base_url": "http://x", "default_model": "m"
    })
    pid = r.json()["id"]
    resp = client.delete(f"/api/providers/{pid}")
    assert resp.status_code == 204
    assert client.get(f"/api/providers/{pid}").status_code == 404


def test_delete_provider_with_agent_409(client):
    r = client.post("/api/providers", json={
        "name": "ref", "type": "openai_compatible", "base_url": "http://x", "default_model": "m"
    })
    pid = r.json()["id"]
    # Insert agent directly via test DB (agents router not yet built)
    from app.models import AgentProfile
    db = client._test_session()
    db.add(AgentProfile(name="a1", system_prompt="x", provider_id=pid, tools=[]))
    db.commit()
    db.close()
    resp = client.delete(f"/api/providers/{pid}")
    assert resp.status_code == 409
