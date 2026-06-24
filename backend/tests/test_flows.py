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

    app.dependency_overrides[get_db] = override_get_db
    c = TestClient(app)
    c._test_session = TestingSession
    yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)


def test_create_empty_flow(client):
    r = client.post("/api/flows", json={"name": "My Flow", "description": "test"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "My Flow"
    assert data["nodes"] == []
    assert data["edges"] == []


def test_list_flows(client):
    client.post("/api/flows", json={"name": "f1"})
    client.post("/api/flows", json={"name": "f2"})
    r = client.get("/api/flows")
    assert len(r.json()) == 2


def test_get_flow(client):
    r = client.post("/api/flows", json={"name": "f1"})
    fid = r.json()["id"]
    r = client.get(f"/api/flows/{fid}")
    assert r.status_code == 200
    assert r.json()["name"] == "f1"


def test_get_flow_404(client):
    assert client.get("/api/flows/999").status_code == 404


def test_put_add_nodes_edges(client):
    r = client.post("/api/flows", json={"name": "f1"})
    fid = r.json()["id"]

    r = client.put(f"/api/flows/{fid}", json={
        "nodes": [
            {"id": 100, "node_type": "conversation", "agent_profile_id": None, "label": "Start", "config": {"timeout_seconds": 60}, "position": {"x": 0, "y": 0}},
            {"id": 200, "node_type": "processor", "agent_profile_id": None, "label": "Process", "config": {"timeout_seconds": 30}, "position": {"x": 200, "y": 0}},
        ],
        "edges": [
            {"source_node_id": 100, "target_node_id": 200, "condition_type": "none", "condition_value": None, "label": ""},
        ],
    })
    assert r.status_code == 200
    data = r.json()
    assert len(data["nodes"]) == 2
    assert len(data["edges"]) == 1

    # Verify GET returns same graph
    r = client.get(f"/api/flows/{fid}")
    assert len(r.json()["nodes"]) == 2
    assert len(r.json()["edges"]) == 1


def test_put_replaces_graph(client):
    r = client.post("/api/flows", json={"name": "f1"})
    fid = r.json()["id"]

    # Add 2 nodes
    client.put(f"/api/flows/{fid}", json={
        "nodes": [
            {"node_type": "conversation", "label": "A", "config": {"timeout_seconds": 60}, "position": {"x": 0, "y": 0}},
            {"node_type": "conversation", "label": "B", "config": {"timeout_seconds": 60}, "position": {"x": 100, "y": 0}},
        ],
        "edges": [],
    })

    # Replace with 1 node
    r = client.put(f"/api/flows/{fid}", json={
        "nodes": [
            {"node_type": "processor", "label": "C", "config": {"timeout_seconds": 60}, "position": {"x": 50, "y": 50}},
        ],
        "edges": [],
    })
    assert r.status_code == 200
    data = r.json()
    assert len(data["nodes"]) == 1
    assert data["nodes"][0]["label"] == "C"
    assert len(data["edges"]) == 0


def test_put_conditional_edge(client):
    r = client.post("/api/flows", json={"name": "f1"})
    fid = r.json()["id"]

    r = client.put(f"/api/flows/{fid}", json={
        "nodes": [
            {"id": 1, "node_type": "processor", "label": "Check", "config": {"timeout_seconds": 60}, "position": {"x": 0, "y": 0}},
            {"id": 2, "node_type": "processor", "label": "Go", "config": {"timeout_seconds": 60}, "position": {"x": 100, "y": 0}},
        ],
        "edges": [
            {"source_node_id": 1, "target_node_id": 2, "condition_type": "json_path", "condition_value": "score > 7", "label": "if approved"},
        ],
    })
    assert r.status_code == 200
    edge = r.json()["edges"][0]
    assert edge["condition_type"] == "json_path"
    assert edge["condition_value"] == "score > 7"


def test_delete_flow(client):
    r = client.post("/api/flows", json={"name": "f1"})
    fid = r.json()["id"]
    r = client.delete(f"/api/flows/{fid}")
    assert r.status_code == 204
    assert client.get(f"/api/flows/{fid}").status_code == 404


def test_delete_flow_404(client):
    assert client.delete("/api/flows/999").status_code == 404
