import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crypto import decrypt_api_key
from app.database import get_db
from app.models import AgentProfile, Node
from app.providers import get_adapter
from app.schemas.agent import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    AgentTestRequest,
    AgentTestResponse,
)

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=list[AgentResponse])
def list_agents(db: Session = Depends(get_db)):
    return db.query(AgentProfile).all()


@router.post("", response_model=AgentResponse, status_code=201)
def create_agent(body: AgentCreate, db: Session = Depends(get_db)):
    if db.query(AgentProfile).filter(AgentProfile.name == body.name).first():
        raise HTTPException(409, "Agent name already exists")
    a = AgentProfile(
        name=body.name,
        system_prompt=body.system_prompt,
        provider_id=body.provider_id,
        model=body.model,
        tools=body.tools,
        memory_type=body.memory_type.value,
        conversation_scope=body.conversation_scope.value,
        active=body.active,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    a = db.get(AgentProfile, agent_id)
    if not a:
        raise HTTPException(404, "Agent not found")
    return a


@router.put("/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: int, body: AgentUpdate, db: Session = Depends(get_db)):
    a = db.get(AgentProfile, agent_id)
    if not a:
        raise HTTPException(404, "Agent not found")
    for field in ("name", "system_prompt", "provider_id", "model", "tools", "active"):
        val = getattr(body, field)
        if val is not None:
            setattr(a, field, val)
    if body.memory_type is not None:
        a.memory_type = body.memory_type.value
    if body.conversation_scope is not None:
        a.conversation_scope = body.conversation_scope.value
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{agent_id}", status_code=204)
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    a = db.get(AgentProfile, agent_id)
    if not a:
        raise HTTPException(404, "Agent not found")
    if db.query(Node).filter(Node.agent_profile_id == agent_id).first():
        raise HTTPException(409, "Agent is referenced by nodes")
    db.delete(a)
    db.commit()


@router.patch("/{agent_id}/toggle", response_model=AgentResponse)
def toggle_agent(agent_id: int, db: Session = Depends(get_db)):
    a = db.get(AgentProfile, agent_id)
    if not a:
        raise HTTPException(404, "Agent not found")
    a.active = not a.active
    db.commit()
    db.refresh(a)
    return a


@router.post("/{agent_id}/test", response_model=AgentTestResponse)
async def test_agent(
    agent_id: int, body: AgentTestRequest, db: Session = Depends(get_db)
):
    a = db.get(AgentProfile, agent_id)
    if not a:
        raise HTTPException(404, "Agent not found")
    if not a.active:
        raise HTTPException(400, "Agent is inactive")

    provider = a.provider
    api_key = decrypt_api_key(provider.api_key_encrypted) if provider.api_key_encrypted else ""
    model = a.model or provider.default_model

    try:
        adapter = get_adapter(provider.type)
        response = await adapter.call(
            base_url=provider.base_url,
            api_key=api_key,
            messages=[
                {"role": "system", "content": a.system_prompt},
                {"role": "user", "content": body.message},
            ],
            model=model,
            timeout=60,
        )
    except httpx.HTTPError as e:
        raise HTTPException(502, f"Provider call failed: {e}")
    except ValueError as e:
        raise HTTPException(400, str(e))
    return AgentTestResponse(response=response)
