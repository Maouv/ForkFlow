import asyncio
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models import Flow, Node, Edge, Provider, AgentProfile
from app.engine.executor import FlowExecutor
from app.engine.memory import ContextEntry


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def _make_flow(db, nodes_spec, edges_spec):
    """Create flow with nodes and edges.
    nodes_spec: [(id, label, agent_profile_id, config)]
    edges_spec: [(source, target, cond_type, cond_value)]
    """
    flow = Flow(name="test_flow", description="test")
    db.add(flow)
    db.commit()

    for nid, label, aid, cfg in nodes_spec:
        node = Node(
            id=nid,
            flow_id=flow.id,
            node_type="processor",
            agent_profile_id=aid,
            label=label,
            config=cfg or {},
            position_x=0.0,
            position_y=0.0,
        )
        db.add(node)
    db.commit()

    for src, tgt, ct, cv in edges_spec:
        edge = Edge(
            flow_id=flow.id,
            source_node_id=src,
            target_node_id=tgt,
            condition_type=ct,
            condition_value=cv,
        )
        db.add(edge)
    db.commit()
    return flow


@pytest.mark.asyncio
async def test_sequential_flow(db):
    """A → B → C, verify all 3 nodes executed in order."""
    flow = _make_flow(db, [
        (1, "Node A", None, {}),
        (2, "Node B", None, {}),
        (3, "Node C", None, {}),
    ], [
        (1, 2, "none", None),
        (2, 3, "none", None),
    ])

    outputs = {"1": "out_A", "2": "out_B", "3": "out_C"}
    mock_runner = AsyncMock()
    mock_runner.run = AsyncMock(side_effect=lambda node, inp, ctx: outputs[str(node.id)])

    executor = FlowExecutor(db)
    executor.runner = mock_runner

    exec_id = await executor.execute(flow.id, "start")

    # Verify all 3 nodes called
    assert mock_runner.run.call_count == 3
    # First call input = "start"
    assert mock_runner.run.call_args_list[0].args[1] == "start"
    # Second call input = output of node 1
    assert mock_runner.run.call_args_list[1].args[1] == "out_A"
    # Third call input = output of node 2
    assert mock_runner.run.call_args_list[2].args[1] == "out_B"

    from app.models import Execution
    execution = db.get(Execution, exec_id)
    assert execution.status == "completed"
    assert execution.output == "out_C"


@pytest.mark.asyncio
async def test_conditional_routing(db):
    """A → (contains "GO") → B, (contains "STOP") → C."""
    flow = _make_flow(db, [
        (1, "Router", None, {}),
        (2, "GoPath", None, {}),
        (3, "StopPath", None, {}),
    ], [
        (1, 2, "contains", "GO"),
        (1, 3, "contains", "STOP"),
    ])

    mock_runner = AsyncMock()
    mock_runner.run = AsyncMock(return_value="GO ahead")

    executor = FlowExecutor(db)
    executor.runner = mock_runner

    exec_id = await executor.execute(flow.id, "start")

    # Node 1 (Router) → output "GO ahead" → routes to Node 2 (GoPath)
    assert mock_runner.run.call_count == 2
    # Second call should be node 2
    assert mock_runner.run.call_args_list[1].args[0].id == 2

    from app.models import Execution
    execution = db.get(Execution, exec_id)
    assert execution.status == "completed"


@pytest.mark.asyncio
async def test_no_matching_edge_stops(db):
    """A → (contains "X") → B, output doesn't contain X → flow stops."""
    flow = _make_flow(db, [
        (1, "Solo", None, {}),
        (2, "Next", None, {}),
    ], [
        (1, 2, "contains", "XYZ"),
    ])

    mock_runner = AsyncMock()
    mock_runner.run = AsyncMock(return_value="no match here")

    executor = FlowExecutor(db)
    executor.runner = mock_runner

    exec_id = await executor.execute(flow.id, "start")

    assert mock_runner.run.call_count == 1

    from app.models import Execution
    execution = db.get(Execution, exec_id)
    assert execution.status == "completed"
    assert execution.output == "no match here"


@pytest.mark.asyncio
async def test_timeout(db):
    """Node timeout → execution failed."""
    flow = _make_flow(db, [
        (1, "Slow", None, {"timeout_seconds": 0.1}),
    ], [])

    async def slow_run(node, inp, ctx):
        await asyncio.sleep(2)
        return "done"

    mock_runner = AsyncMock()
    mock_runner.run = slow_run

    executor = FlowExecutor(db)
    executor.runner = mock_runner

    exec_id = await executor.execute(flow.id, "start")

    from app.models import Execution
    execution = db.get(Execution, exec_id)
    assert execution.status == "failed"
    assert "timed out" in execution.output


@pytest.mark.asyncio
async def test_node_error(db):
    """Node raises exception → execution failed."""
    flow = _make_flow(db, [
        (1, "Broken", None, {}),
    ], [])

    mock_runner = AsyncMock()
    mock_runner.run = AsyncMock(side_effect=Exception("Agent crashed"))

    executor = FlowExecutor(db)
    executor.runner = mock_runner

    exec_id = await executor.execute(flow.id, "start")

    from app.models import Execution
    execution = db.get(Execution, exec_id)
    assert execution.status == "failed"
    assert "Agent crashed" in execution.output


@pytest.mark.asyncio
async def test_context_accumulates(db):
    """Sequential flow → context grows with each node."""
    flow = _make_flow(db, [
        (1, "A", None, {}),
        (2, "B", None, {}),
    ], [
        (1, 2, "none", None),
    ])

    captured_contexts = []

    async def capture_run(node, inp, ctx):
        captured_contexts.append(list(ctx))
        return f"out_{node.id}"

    mock_runner = AsyncMock()
    mock_runner.run = capture_run

    executor = FlowExecutor(db)
    executor.runner = mock_runner

    await executor.execute(flow.id, "start")

    # First call: empty context
    assert len(captured_contexts[0]) == 0
    # Second call: context has 1 entry from node 1
    assert len(captured_contexts[1]) == 1
    assert captured_contexts[1][0].sender == "A"
    assert captured_contexts[1][0].output == "out_1"


@pytest.mark.asyncio
async def test_node_results_saved(db):
    """Verify NodeResult records are saved to DB."""
    flow = _make_flow(db, [
        (1, "A", None, {}),
        (2, "B", None, {}),
    ], [
        (1, 2, "none", None),
    ])

    mock_runner = AsyncMock()
    mock_runner.run = AsyncMock(side_effect=lambda node, inp, ctx: f"r{node.id}")

    executor = FlowExecutor(db)
    executor.runner = mock_runner

    exec_id = await executor.execute(flow.id, "start")

    from app.models import NodeResult
    results = db.query(NodeResult).filter(NodeResult.execution_id == exec_id).all()
    assert len(results) == 2
    assert results[0].output == "r1"
    assert results[1].output == "r2"
    assert results[0].status == "completed"
    assert results[0].duration_ms is not None


@pytest.mark.asyncio
async def test_flow_not_found(db):
    executor = FlowExecutor(db)
    with pytest.raises(ValueError, match="Flow 999 not found"):
        await executor.execute(999, "start")
