from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crypto import encrypt_api_key
from app.database import get_db
from app.models import Provider, AgentProfile
from app.schemas.provider import (
    ProviderCreate,
    ProviderUpdate,
    ProviderResponse,
)

router = APIRouter(prefix="/api/providers", tags=["providers"])


def _to_response(p: Provider) -> ProviderResponse:
    return ProviderResponse(
        id=p.id,
        name=p.name,
        type=p.type,
        base_url=p.base_url,
        default_model=p.default_model,
        has_api_key=bool(p.api_key_encrypted),
        created_at=p.created_at,
    )


@router.get("", response_model=list[ProviderResponse])
def list_providers(db: Session = Depends(get_db)):
    return [_to_response(p) for p in db.query(Provider).all()]


@router.post("", response_model=ProviderResponse, status_code=201)
def create_provider(body: ProviderCreate, db: Session = Depends(get_db)):
    if db.query(Provider).filter(Provider.name == body.name).first():
        raise HTTPException(409, "Provider name already exists")
    p = Provider(
        name=body.name,
        type=body.type.value,
        base_url=body.base_url,
        api_key_encrypted=encrypt_api_key(body.api_key) if body.api_key else None,
        default_model=body.default_model,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return _to_response(p)


@router.get("/{provider_id}", response_model=ProviderResponse)
def get_provider(provider_id: int, db: Session = Depends(get_db)):
    p = db.get(Provider, provider_id)
    if not p:
        raise HTTPException(404, "Provider not found")
    return _to_response(p)


@router.put("/{provider_id}", response_model=ProviderResponse)
def update_provider(
    provider_id: int, body: ProviderUpdate, db: Session = Depends(get_db)
):
    p = db.get(Provider, provider_id)
    if not p:
        raise HTTPException(404, "Provider not found")
    for field in ("name", "type", "base_url", "default_model"):
        val = getattr(body, field)
        if val is not None:
            setattr(p, field, val.value if hasattr(val, "value") else val)
    if body.api_key is not None:
        p.api_key_encrypted = encrypt_api_key(body.api_key) if body.api_key else None
    db.commit()
    db.refresh(p)
    return _to_response(p)


@router.delete("/{provider_id}", status_code=204)
def delete_provider(provider_id: int, db: Session = Depends(get_db)):
    p = db.get(Provider, provider_id)
    if not p:
        raise HTTPException(404, "Provider not found")
    if db.query(AgentProfile).filter(AgentProfile.provider_id == provider_id).first():
        raise HTTPException(409, "Provider is referenced by agents")
    db.delete(p)
    db.commit()
