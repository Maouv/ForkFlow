from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import get_db
from app.engine.executor import FlowExecutor
from app.engine.ws_manager import ws_manager
from app.models import Execution, NodeResult
from app.schemas.execution import (
    ExecuteRequest,
    ExecutionResponse,
    ExecutionDetailResponse,
    ExecutionIdResponse,
    NodeResultResponse,
)

router = APIRouter(prefix="/api", tags=["executions"])


@router.post("/flows/{flow_id}/execute", response_model=ExecutionIdResponse)
async def execute_flow(flow_id: int, body: ExecuteRequest, db: Session = Depends(get_db)):
    try:
        executor = FlowExecutor(db)
        execution_id = await executor.execute(flow_id, body.input)
        return {"execution_id": execution_id}
    except ValueError as e:
        raise HTTPException(404, str(e))


@router.get("/executions", response_model=list[ExecutionResponse])
def list_executions(
    flow_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Execution)
    if flow_id:
        query = query.filter(Execution.flow_id == flow_id)
    return query.order_by(Execution.started_at.desc()).offset(skip).limit(limit).all()


@router.get("/executions/{execution_id}", response_model=ExecutionDetailResponse)
def get_execution(execution_id: int, db: Session = Depends(get_db)):
    execution = db.get(Execution, execution_id)
    if not execution:
        raise HTTPException(404, "Execution not found")
    results = (
        db.query(NodeResult)
        .filter(NodeResult.execution_id == execution_id)
        .order_by(NodeResult.id)
        .all()
    )
    return {"execution": execution, "node_results": results}
