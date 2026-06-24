from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class ProviderType(str, Enum):
    openai_compatible = "openai_compatible"
    anthropic = "anthropic"


class ProviderCreate(BaseModel):
    name: str = Field(..., max_length=50)
    type: ProviderType
    base_url: str
    api_key: str | None = None
    default_model: str = Field(..., max_length=100)


class ProviderUpdate(BaseModel):
    name: str | None = Field(None, max_length=50)
    type: ProviderType | None = None
    base_url: str | None = None
    api_key: str | None = None
    default_model: str | None = Field(None, max_length=100)


class ProviderResponse(BaseModel):
    id: int
    name: str
    type: ProviderType
    base_url: str
    default_model: str
    has_api_key: bool
    created_at: datetime

    model_config = {"from_attributes": True}
