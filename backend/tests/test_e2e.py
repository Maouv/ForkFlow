"""E2E integration test: full flow lifecycle with mocked provider.

Scenario:
1. Create provider (mocked LLM endpoint)
2. Create agent profiles (conversation + processor)
3. Create flow with 2 nodes: conversation → processor
4. Connect with unconditional edge
5. Execute flow with input "Hello"
6. Verify: execution status=completed, 2 node_results saved
7. Verify: execution history shows the run
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.providers.base import ProviderAdapter


class MockAdapter(ProviderAdapter):
    """Returns deterministic responses for E2E testing."""

    def __init__(self):
        self.call_count = 0

    async def call(
        self,
        base_url: str,
        api_key: str,
        messages: list[dict],
        model: str,
        tools: list[dict] | None = None,
        timeout: int = 60,
    ) -> str:
        self.call_count += 1
        # Return different responses based on call order
        if self.call_count == 1:
            return "Hello! I received your message. PROCEED"
        return "Processed: Hello! I received your message. PROCEED"


@pytest.fixture
def client(monkeypatch):
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

    # Mock the adapter (node_runner imports get_adapter at module level)
    mock = MockAdapter()
    monkeypatch.setattr("app.engine.node_runner.get_adapter", lambda _: mock)

    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers():
    import base64
    cred = base64.b64encode(b"admin:changeme").decode()
    return {"Authorization": f"Basic {cred}"}


def test_e2e_full_flow(client, auth_headers):
    # Step 1: Create provider
    r = client.post(
        "/api/providers",
        json={
            "name": "mock-llm",
            "type": "openai_compatible",
            "base_url": "http://mock:8080",
            "api_key": "test-key",
            "default_model": "mock-model",
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    provider_id = r.json()["id"]

    # Step 2: Create conversation agent
    r = client.post(
        "/api/agents",
        json={
            "name": "greeter",
            "system_prompt": "You are a friendly greeter.",
            "provider_id": provider_id,
            "model": "mock-model",
            "tools": ["web_search"],
            "memory_type": "session",
            "conversation_scope": "full_history",
            "active": True,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    agent1_id = r.json()["id"]

    # Step 3: Create processor agent
    r = client.post(
        "/api/agents",
        json={
            "name": "processor",
            "system_prompt": "You process and format responses.",
            "provider_id": provider_id,
            "model": "mock-model",
            "tools": [],
            "memory_type": "session",
            "conversation_scope": "previous_only",
            "active": True,
        },
        headers=auth_headers,
    )
    assert r.status_code == 201
    agent2_id = r.json()["id"]

    # Step 4: Create flow
    r = client.post(
        "/api/flows",
        json={"name": "greet-and-process", "description": "E2E test flow"},
        headers=auth_headers,
    )
    assert r.status_code == 201
    flow_id = r.json()["id"]

    # Step 5: Add nodes + edge via PUT (temp IDs mapped to real IDs)
    r = client.put(
        f"/api/flows/{flow_id}",
        json={
            "nodes": [
                {
                    "id": 1,  # temp ID for edge reference
                    "node_type": "conversation",
                    "agent_profile_id": agent1_id,
                    "label": "Greeter",
                    "config": {"conversation_scope": "full_history", "timeout_seconds": 60},
                    "position": {"x": 100, "y": 100},
                },
                {
                    "id": 2,  # temp ID for edge reference
                    "node_type": "processor",
                    "agent_profile_id": agent2_id,
                    "label": "Processor",
                    "config": {"conversation_scope": "previous_only", "timeout_seconds": 60},
                    "position": {"x": 400, "y": 100},
                },
            ],
            "edges": [
                {
                    "source_node_id": 1,
                    "target_node_id": 2,
                    "condition_type": "none",
                    "condition_value": None,
                    "label": "",
                },
            ],
        },
        headers=auth_headers,
    )
    assert r.status_code == 200

    # Step 6: Execute flow
    r = client.post(
        f"/api/flows/{flow_id}/execute",
        json={"input": "Hello"},
        headers=auth_headers,
    )
    assert r.status_code == 200
    execution_id = r.json()["execution_id"]

    # Step 7: Verify execution detail
    r = client.get(
        f"/api/executions/{execution_id}",
        headers=auth_headers,
    )
    assert r.status_code == 200
    detail = r.json()
    assert detail["execution"]["status"] == "completed"
    assert detail["execution"]["input"] == "Hello"
    assert len(detail["node_results"]) == 2
    assert detail["node_results"][0]["status"] == "completed"
    assert detail["node_results"][1]["status"] == "completed"

    # Step 8: Verify execution history
    r = client.get(
        "/api/executions",
        headers=auth_headers,
    )
    assert r.status_code == 200
    history = r.json()
    assert len(history) == 1
    assert history[0]["id"] == execution_id
    assert history[0]["status"] == "completed"
