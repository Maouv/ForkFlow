import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from unittest.mock import AsyncMock, patch

from app.database import Base, get_db
from app.models import Flow, Node, Edge, Execution, NodeResult
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

    _auth = {"Authorization": "Basic YWRtaW46Y2hhbmdlbWU="}
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app, headers=_auth)
    app.dependency_overrides.clear()
    session.close()


def _make_flow(db_session, nodes_count=2, edges=None):
    flow = Flow(name="test_flow", description="test")
    db_session.add(flow)
    db_session.commit()

    for i in range(1, nodes_count + 1):
        db_session.add(Node(
            id=i,
            flow_id=flow.id,
            node_type="processor",
            label=f"Node_{i}",
            config={},
            position_x=0.0,
            position_y=0.0,
        ))
    db_session.commit()

    for src, tgt in (edges or [(1, 2)]):
        db_session.add(Edge(
            flow_id=flow.id,
            source_node_id=src,
            target_node_id=tgt,
            condition_type="none",
            condition_value=None,
        ))
    db_session.commit()
    return flow


def test_execute_flow_mock(client):
    """POST /api/flows/{id}/execute with mocked executor."""
    # Get session from override
    session = app.dependency_overrides[get_db]().__next__()

    flow = _make_flow(session)

    mock_executor = AsyncMock()
    mock_executor.execute = AsyncMock(return_value=42)

    with patch("app.routers.executions.FlowExecutor", return_value=mock_executor):
        r = client.post(f"/api/flows/{flow.id}/execute", json={"input": "hello"})
    
    assert r.status_code == 200
    assert r.json()["execution_id"] == 42


def test_execute_flow_not_found(client):
    r = client.post("/api/flows/999/execute", json={"input": "hello"})
    assert r.status_code == 404


def test_list_executions_empty(client):
    r = client.get("/api/executions")
    assert r.status_code == 200
    assert r.json() == []


def test_list_executions_with_data(client):
    session = app.dependency_overrides[get_db]().__next__()
    flow = _make_flow(session)

    for i in range(3):
        session.add(Execution(
            flow_id=flow.id,
            status="completed",
            input=f"input_{i}",
            output=f"output_{i}",
        ))
    session.commit()

    r = client.get("/api/executions")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 3


def test_list_executions_filter_by_flow(client):
    session = app.dependency_overrides[get_db]().__next__()
    flow1 = _make_flow(session)
    flow2 = Flow(name="other", description="other")
    session.add(flow2)
    session.commit()

    session.add(Execution(flow_id=flow1.id, status="completed", input="a", output="b"))
    session.add(Execution(flow_id=flow2.id, status="completed", input="c", output="d"))
    session.commit()

    r = client.get(f"/api/executions?flow_id={flow1.id}")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["flow_id"] == flow1.id


def test_get_execution_detail(client):
    session = app.dependency_overrides[get_db]().__next__()
    flow = _make_flow(session)

    exec_obj = Execution(flow_id=flow.id, status="completed", input="hi", output="bye")
    session.add(exec_obj)
    session.commit()
    session.refresh(exec_obj)

    session.add(NodeResult(
        execution_id=exec_obj.id,
        node_id=1,
        status="completed",
        input="hi",
        output="processed",
    ))
    session.commit()

    r = client.get(f"/api/executions/{exec_obj.id}")
    assert r.status_code == 200
    data = r.json()
    assert data["execution"]["id"] == exec_obj.id
    assert data["execution"]["status"] == "completed"
    assert len(data["node_results"]) == 1
    assert data["node_results"][0]["output"] == "processed"


def test_get_execution_not_found(client):
    r = client.get("/api/executions/999")
    assert r.status_code == 404


def test_list_executions_pagination(client):
    session = app.dependency_overrides[get_db]().__next__()
    flow = _make_flow(session)

    for i in range(5):
        session.add(Execution(flow_id=flow.id, status="completed", input=f"i{i}", output=f"o{i}"))
    session.commit()

    r = client.get("/api/executions?skip=2&limit=2")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2
