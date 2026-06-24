from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator

ALLOWED_TOOLS = {"read_file", "write_file", "web_search", "execute_code", "call_agent"}


class MemoryType(str, Enum):
    session = "session"


class ConversationScope(str, Enum):
    full_history = "full_history"
    previous_only = "previous_only"


class AgentCreate(BaseModel):
    name: str = Field(..., max_length=50)
    system_prompt: str
    provider_id: int
    model: str | None = Field(None, max_length=100)
    tools: list[str] = Field(default_factory=list)
    memory_type: MemoryType = MemoryType.session
    conversation_scope: ConversationScope = ConversationScope.full_history
    active: bool = True

    @field_validator("tools")
    @classmethod
    def validate_tools(cls, v: list[str]) -> list[str]:
        invalid = set(v) - ALLOWED_TOOLS
        if invalid:
            raise ValueError(f"Unknown tools: {invalid}")
        return v


class AgentUpdate(BaseModel):
    name: str | None = Field(None, max_length=50)
    system_prompt: str | None = None
    provider_id: int | None = None
    model: str | None = Field(None, max_length=100)
    tools: list[str] | None = None
    memory_type: MemoryType | None = None
    conversation_scope: ConversationScope | None = None
    active: bool | None = None

    @field_validator("tools")
    @classmethod
    def validate_tools(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        invalid = set(v) - ALLOWED_TOOLS
        if invalid:
            raise ValueError(f"Unknown tools: {invalid}")
        return v


class AgentResponse(BaseModel):
    id: int
    name: str
    system_prompt: str
    provider_id: int
    model: str | None
    tools: list[str]
    memory_type: MemoryType
    conversation_scope: ConversationScope
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentTestRequest(BaseModel):
    message: str


class AgentTestResponse(BaseModel):
    response: str
