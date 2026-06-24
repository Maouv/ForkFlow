from datetime import datetime
from typing import Any

from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    provider_id: Mapped[int] = mapped_column(ForeignKey("providers.id"), nullable=False)
    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    tools: Mapped[list[Any]] = mapped_column(JSON, default=list)
    memory_type: Mapped[str] = mapped_column(String(20), default="session")
    conversation_scope: Mapped[str] = mapped_column(String(20), default="full_history")
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    provider: Mapped["Provider"] = relationship(back_populates="agents")
    nodes: Mapped[list["Node"]] = relationship(back_populates="agent_profile")
