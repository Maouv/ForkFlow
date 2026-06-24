import asyncio
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.engine.memory import ContextEntry
from app.engine.node_runner import NodeRunner
from app.engine.router import evaluate_edges, EdgeForEval
from app.engine.ws_manager import ws_manager
from app.models import Flow, Execution, NodeResult


class FlowExecutor:
    def __init__(self, db: Session):
        self.db = db
        self.runner = NodeRunner(db)

    async def execute(self, flow_id: int, user_input: str) -> int:
        flow = self.db.get(Flow, flow_id)
        if not flow:
            raise ValueError(f"Flow {flow_id} not found")

        # Create execution record
        execution = Execution(
            flow_id=flow_id,
            status="running",
            started_at=datetime.now(timezone.utc),
            input=user_input,
        )
        self.db.add(execution)
        self.db.commit()
        self.db.refresh(execution)

        # Load flow data fresh (avoid expire_on_commit stale refs)
        flow = self.db.get(Flow, flow_id)
        nodes = {n.id: n for n in flow.nodes}
        edges = list(flow.edges)

        entry_node = self._find_entry_node(nodes, edges)

        current_node = entry_node
        current_input = user_input
        context: list = []
        output = ""

        try:
            while current_node:
                await ws_manager.broadcast(
                    execution.id, current_node.id, current_node.label,
                    "info", f"Starting node: {current_node.label}",
                )

                timeout = current_node.config.get("timeout_seconds", 60)
                t0 = datetime.now(timezone.utc)
                try:
                    output = await asyncio.wait_for(
                        self.runner.run(current_node, current_input, context),
                        timeout=timeout,
                    )
                except asyncio.TimeoutError:
                    raise Exception(
                        f"Node '{current_node.label}' timed out after {timeout}s"
                    )
                t1 = datetime.now(timezone.utc)

                # Save node result
                result = NodeResult(
                    execution_id=execution.id,
                    node_id=current_node.id,
                    status="completed",
                    input=current_input,
                    output=output,
                    started_at=t0,
                    completed_at=t1,
                    duration_ms=int((t1 - t0).total_seconds() * 1000),
                )
                self.db.add(result)

                # Update context
                sender = (
                    current_node.agent_profile.name
                    if current_node.agent_profile
                    else current_node.label
                )
                context.append(ContextEntry(sender=sender, output=output))

                await ws_manager.broadcast(
                    execution.id, current_node.id, current_node.label,
                    "info", f"Node completed: {output[:200]}",
                )

                # Find next node
                outgoing = [
                    EdgeForEval(
                        target_node_id=e.target_node_id,
                        condition_type=e.condition_type,
                        condition_value=e.condition_value,
                    )
                    for e in edges
                    if e.source_node_id == current_node.id
                ]
                next_node_id = evaluate_edges(outgoing, output)

                if next_node_id and next_node_id in nodes:
                    current_node = nodes[next_node_id]
                    current_input = output
                else:
                    current_node = None

            execution.status = "completed"
            execution.completed_at = datetime.now(timezone.utc)
            execution.output = output

        except Exception as e:
            execution.status = "failed"
            execution.completed_at = datetime.now(timezone.utc)
            execution.output = str(e)
            await ws_manager.broadcast(
                execution.id, 0, "", "error", str(e),
            )

        self.db.commit()
        return execution.id

    def _find_entry_node(self, nodes: dict, edges) -> object:
        target_ids = {e.target_node_id for e in edges}
        entry_ids = set(nodes.keys()) - target_ids
        if not entry_ids:
            raise Exception("No entry node found (all nodes have incoming edges)")
        return nodes[entry_ids.pop()]
