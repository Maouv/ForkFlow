from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class NodeType(str, Enum):
    conversation = "conversation"
    processor = "processor"


class ConditionType(str, Enum):
    none = "none"
    contains = "contains"
    not_contains = "not_contains"
    json_path = "json_path"


class PositionSchema(BaseModel):
    x: float = 0.0
    y: float = 0.0


class NodeSchema(BaseModel):
    id: int | None = None
    node_type: NodeType
    agent_profile_id: int | None = None
    label: str = Field(..., max_length=100)
    config: dict = Field(default_factory=dict)
    position: PositionSchema = Field(default_factory=PositionSchema)

    @field_validator("config")
    @classmethod
    def validate_config(cls, v: dict) -> dict:
        timeout = v.get("timeout_seconds", 60)
        if not (1 <= timeout <= 300):
            raise ValueError("timeout_seconds must be 1-300")
        return v


class EdgeSchema(BaseModel):
    source_node_id: int
    target_node_id: int
    condition_type: ConditionType = ConditionType.none
    condition_value: str | None = None
    label: str = ""

    @field_validator("condition_value")
    @classmethod
    def validate_condition(cls, v: str | None, info) -> str | None:
        ct = info.data.get("condition_type")
        if ct == ConditionType.none:
            return v
        if not v:
            raise ValueError(f"condition_value required when condition_type={ct}")
        if ct == ConditionType.json_path:
            _validate_json_path(v)
        return v


def _validate_json_path(expr: str) -> None:
    """Validate `field operator value` format. Operators: ==, !=, >, <, >=, <=, contains."""
    operators = ["==", "!=", ">=", "<=", ">", "<", "contains"]
    for op in operators:
        if op in expr:
            return
    raise ValueError(
        f"json_path must contain one of: {operators}"
    )


class FlowCreate(BaseModel):
    name: str = Field(..., max_length=100)
    description: str | None = None


class FlowUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    description: str | None = None
    nodes: list[NodeSchema] = Field(default_factory=list)
    edges: list[EdgeSchema] = Field(default_factory=list)


class FlowResponse(BaseModel):
    id: int
    name: str
    description: str | None
    nodes: list[NodeSchema] = []
    edges: list[EdgeSchema] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FlowListItem(BaseModel):
    id: int
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NodeTestRequest(BaseModel):
    input: str


class NodeTestResponse(BaseModel):
    output: str
    duration_ms: int
    token_count: int | None = None
