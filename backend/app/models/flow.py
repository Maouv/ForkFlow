from datetime import datetime
from typing import Any

from sqlalchemy import String, Text, Float, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Flow(Base):
    __tablename__ = "flows"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    nodes: Mapped[list["Node"]] = relationship(
        back_populates="flow", cascade="all, delete-orphan"
    )
    edges: Mapped[list["Edge"]] = relationship(
        back_populates="flow", cascade="all, delete-orphan"
    )
    executions: Mapped[list["Execution"]] = relationship(back_populates="flow")


class Node(Base):
    __tablename__ = "nodes"

    id: Mapped[int] = mapped_column(primary_key=True)
    flow_id: Mapped[int] = mapped_column(ForeignKey("flows.id"), nullable=False)
    node_type: Mapped[str] = mapped_column(String(20), nullable=False)
    agent_profile_id: Mapped[int | None] = mapped_column(
        ForeignKey("agent_profiles.id"), nullable=True
    )
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    config: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    position_x: Mapped[float] = mapped_column(Float, default=0.0)
    position_y: Mapped[float] = mapped_column(Float, default=0.0)

    flow: Mapped["Flow"] = relationship(back_populates="nodes")
    agent_profile: Mapped["AgentProfile | None"] = relationship(back_populates="nodes")
    results: Mapped[list["NodeResult"]] = relationship(back_populates="node")


class Edge(Base):
    __tablename__ = "edges"

    id: Mapped[int] = mapped_column(primary_key=True)
    flow_id: Mapped[int] = mapped_column(ForeignKey("flows.id"), nullable=False)
    source_node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id"), nullable=False)
    target_node_id: Mapped[int] = mapped_column(ForeignKey("nodes.id"), nullable=False)
    condition_type: Mapped[str] = mapped_column(String(20), default="none")
    condition_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    label: Mapped[str] = mapped_column(String(100), default="")

    flow: Mapped["Flow"] = relationship(back_populates="edges")
