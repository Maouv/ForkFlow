from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel


class ExecutionStatus(str, Enum):
    pending = "pending"
    running = "running"
    completed = "completed"
    failed = "failed"


class ExecuteRequest(BaseModel):
    input: str


class NodeResultResponse(BaseModel):
    id: int
    node_id: int
    status: str
    input: Any | None
    output: Any | None
    error_message: str | None
    started_at: datetime
    completed_at: datetime | None
    duration_ms: int | None

    model_config = {"from_attributes": True}


class ExecutionResponse(BaseModel):
    id: int
    flow_id: int
    status: ExecutionStatus
    started_at: datetime
    completed_at: datetime | None
    input: str | None
    output: str | None
    node_results: list[NodeResultResponse] = []

    model_config = {"from_attributes": True}


class ExecutionListItem(BaseModel):
    id: int
    flow_id: int
    status: ExecutionStatus
    started_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
