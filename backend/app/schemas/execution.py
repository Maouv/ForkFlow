from datetime import datetime

from pydantic import BaseModel, Field


class ExecuteRequest(BaseModel):
    input: str = Field(..., description="User input to start the flow")


class NodeResultResponse(BaseModel):
    id: int
    execution_id: int
    node_id: int
    status: str
    input: str | None
    output: str | None
    error_message: str | None
    started_at: datetime
    completed_at: datetime | None
    duration_ms: int | None

    model_config = {"from_attributes": True}


class ExecutionResponse(BaseModel):
    id: int
    flow_id: int
    status: str
    started_at: datetime
    completed_at: datetime | None
    input: str | None
    output: str | None

    model_config = {"from_attributes": True}


class ExecutionDetailResponse(BaseModel):
    execution: ExecutionResponse
    node_results: list[NodeResultResponse]


class ExecutionIdResponse(BaseModel):
    execution_id: int
