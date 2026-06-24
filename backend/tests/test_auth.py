import base64

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
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    def override_get_db():
        try:
            yield session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    session.close()


def _auth_header(user: str = "admin", pw: str = "changeme") -> dict:
    cred = base64.b64encode(f"{user}:{pw}".encode()).decode()
    return {"Authorization": f"Basic {cred}"}


def test_health_no_auth_required(client):
    """Health endpoint should work without auth."""
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_protected_route_no_auth_401(client):
    r = client.get("/api/providers")
    assert r.status_code == 401
    assert "WWW-Authenticate" in r.headers


def test_protected_route_wrong_password_401(client):
    r = client.get("/api/providers", headers=_auth_header("admin", "wrong"))
    assert r.status_code == 401


def test_protected_route_wrong_username_401(client):
    r = client.get("/api/providers", headers=_auth_header("wrong", "changeme"))
    assert r.status_code == 401


def test_protected_route_valid_auth_200(client):
    r = client.get("/api/providers", headers=_auth_header())
    assert r.status_code == 200


def test_agents_route_requires_auth(client):
    r = client.get("/api/agents")
    assert r.status_code == 401


def test_flows_route_requires_auth(client):
    r = client.get("/api/flows")
    assert r.status_code == 401


def test_executions_route_requires_auth(client):
    r = client.get("/api/executions")
    assert r.status_code == 401


def test_valid_auth_all_routes(client):
    """All protected routes accept valid auth."""
    h = _auth_header()
    assert client.get("/api/providers", headers=h).status_code == 200
    assert client.get("/api/agents", headers=h).status_code == 200
    assert client.get("/api/flows", headers=h).status_code == 200
    assert client.get("/api/executions", headers=h).status_code == 200
