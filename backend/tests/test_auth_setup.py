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
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        try:
            db = TestingSession()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# --- Auth status (no credentials) ---
def test_status_setup_required(client):
    r = client.get("/api/auth/status")
    assert r.status_code == 200
    assert r.json() == {"setup_required": True}


# --- Setup ---
def test_setup_success(client):
    r = client.post("/api/auth/setup", json={"username": "admin", "password": "secret123"})
    assert r.status_code == 201
    assert r.json() == {"setup_required": False}


def test_setup_after_completed(client):
    client.post("/api/auth/setup", json={"username": "admin", "password": "secret123"})
    r = client.post("/api/auth/setup", json={"username": "hacker", "password": "letmein"})
    assert r.status_code == 400


def test_setup_short_password(client):
    r = client.post("/api/auth/setup", json={"username": "admin", "password": "ab"})
    assert r.status_code == 422  # validation error


def test_setup_short_username(client):
    r = client.post("/api/auth/setup", json={"username": "ab", "password": "secret123"})
    assert r.status_code == 422


# --- Login after setup ---
def test_login_with_setup_credentials(client):
    client.post("/api/auth/setup", json={"username": "admin", "password": "secret123"})
    r = client.get("/api/providers", auth=("admin", "secret123"))
    assert r.status_code == 200


def test_login_wrong_password_after_setup(client):
    client.post("/api/auth/setup", json={"username": "admin", "password": "secret123"})
    r = client.get("/api/providers", auth=("admin", "wrongpass"))
    assert r.status_code == 401


def test_login_env_fallback_before_setup(client):
    """Before setup, env var credentials still work."""
    r = client.get("/api/providers", auth=("admin", "changeme"))
    assert r.status_code == 200


# --- Change password ---
def test_change_password_success(client):
    client.post("/api/auth/setup", json={"username": "admin", "password": "secret123"})
    r = client.post(
        "/api/auth/change-password",
        json={"current_password": "secret123", "new_password": "newpass456"},
        auth=("admin", "secret123"),
    )
    assert r.status_code == 200
    # Old password fails
    r2 = client.get("/api/providers", auth=("admin", "secret123"))
    assert r2.status_code == 401
    # New password works
    r3 = client.get("/api/providers", auth=("admin", "newpass456"))
    assert r3.status_code == 200


def test_change_password_wrong_current(client):
    client.post("/api/auth/setup", json={"username": "admin", "password": "secret123"})
    r = client.post(
        "/api/auth/change-password",
        json={"current_password": "wrong", "new_password": "newpass456"},
        auth=("admin", "secret123"),
    )
    assert r.status_code == 401


def test_change_password_no_auth(client):
    client.post("/api/auth/setup", json={"username": "admin", "password": "secret123"})
    r = client.post(
        "/api/auth/change-password",
        json={"current_password": "secret123", "new_password": "newpass456"},
    )
    assert r.status_code == 401
