from datetime import datetime
from typing import Any

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Execution(Base):
    __tablename__ = "executions"

    id: Mapped[int] = mapped_column(primary_key=True)
    flow_id: Mapped[int] = mapped_column(ForeignKey("flows.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    input: Mapped[str | None] = mapped_column(Text, nullable=True)
    output: Mapped[str | None] = mapped_column(Text, nullable=True)

    flow: Mapped["Flow"] = relationship(back_populates="executions")
    node_results: Mapped[list["NodeResult"]] = relationship(
        back_populates="execution", cascade="all, delete-orphan"
    )


class NodeResult(Base):
    __tablename__ = "node_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    execution_id: Mapped[int] = mapped_column(
        ForeignKey("executions.id"), nullable=False
    )
    node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    input: Mapped[Any] = mapped_column(JSON, nullable=True)
    output: Mapped[Any] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    execution: Mapped["Execution"] = relationship(back_populates="node_results")
    node: Mapped["Node"] = relationship(back_populates="results")
