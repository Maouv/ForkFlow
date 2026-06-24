from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Flow, Node, Edge
from app.schemas.flow import (
    FlowCreate,
    FlowUpdate,
    FlowResponse,
    FlowListItem,
    NodeSchema,
    EdgeSchema,
)

router = APIRouter(prefix="/api/flows", tags=["flows"])


def _flow_to_response(flow: Flow) -> FlowResponse:
    return FlowResponse(
        id=flow.id,
        name=flow.name,
        description=flow.description,
        nodes=[
            NodeSchema(
                id=n.id,
                node_type=n.node_type,
                agent_profile_id=n.agent_profile_id,
                label=n.label,
                config=n.config,
                position={"x": n.position_x, "y": n.position_y},
            )
            for n in flow.nodes
        ],
        edges=[
            EdgeSchema(
                source_node_id=e.source_node_id,
                target_node_id=e.target_node_id,
                condition_type=e.condition_type,
                condition_value=e.condition_value,
                label=e.label,
            )
            for e in flow.edges
        ],
        created_at=flow.created_at,
        updated_at=flow.updated_at,
    )


@router.get("", response_model=list[FlowListItem])
def list_flows(db: Session = Depends(get_db)):
    return db.query(Flow).all()


@router.post("", response_model=FlowResponse, status_code=201)
def create_flow(body: FlowCreate, db: Session = Depends(get_db)):
    flow = Flow(name=body.name, description=body.description)
    db.add(flow)
    db.commit()
    db.refresh(flow)
    return _flow_to_response(flow)


@router.get("/{flow_id}", response_model=FlowResponse)
def get_flow(flow_id: int, db: Session = Depends(get_db)):
    flow = db.get(Flow, flow_id)
    if not flow:
        raise HTTPException(404, "Flow not found")
    return _flow_to_response(flow)


@router.put("/{flow_id}", response_model=FlowResponse)
def update_flow(flow_id: int, body: FlowUpdate, db: Session = Depends(get_db)):
    flow = db.get(Flow, flow_id)
    if not flow:
        raise HTTPException(404, "Flow not found")

    if body.name is not None:
        flow.name = body.name
    if body.description is not None:
        flow.description = body.description

    # ponytail: replace all nodes+edges in single transaction
    if body.nodes is not None or body.edges is not None:
        # Delete old
        db.query(Node).filter(Node.flow_id == flow_id).delete()
        db.query(Edge).filter(Edge.flow_id == flow_id).delete()

        # Insert new nodes, track temp id → real id
        id_map: dict[int, int] = {}
        for ns in body.nodes or []:
            node = Node(
                flow_id=flow_id,
                node_type=ns.node_type.value,
                agent_profile_id=ns.agent_profile_id,
                label=ns.label,
                config=ns.config,
                position_x=ns.position.x,
                position_y=ns.position.y,
            )
            db.add(node)
            db.flush()
            if ns.id is not None:
                id_map[ns.id] = node.id

        # Insert new edges (resolve temp ids)
        for es in body.edges or []:
            source_id = id_map.get(es.source_node_id, es.source_node_id)
            target_id = id_map.get(es.target_node_id, es.target_node_id)
            edge = Edge(
                flow_id=flow_id,
                source_node_id=source_id,
                target_node_id=target_id,
                condition_type=es.condition_type.value,
                condition_value=es.condition_value,
                label=es.label,
            )
            db.add(edge)

    db.commit()
    db.refresh(flow)
    return _flow_to_response(flow)


@router.delete("/{flow_id}", status_code=204)
def delete_flow(flow_id: int, db: Session = Depends(get_db)):
    flow = db.get(Flow, flow_id)
    if not flow:
        raise HTTPException(404, "Flow not found")
    db.delete(flow)
    db.commit()
