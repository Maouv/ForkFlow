from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import verify_auth
from app.auth.password import hash_password, verify_password
from app.database import get_db
from app.models import UserCredential
from app.schemas.auth import AuthStatus, SetupRequest, ChangePasswordRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/status", response_model=AuthStatus)
def auth_status(db: Session = Depends(get_db)):
    """Check if initial setup is required. No auth needed."""
    cred = db.query(UserCredential).first()
    return {"setup_required": cred is None}


@router.post("/setup", response_model=AuthStatus, status_code=201)
def setup(body: SetupRequest, db: Session = Depends(get_db)):
    """First-run setup. Only works if no credentials exist."""
    existing = db.query(UserCredential).first()
    if existing:
        raise HTTPException(400, "Setup already completed")
    hash_hex, salt_hex = hash_password(body.password)
    cred = UserCredential(
        username=body.username,
        password_hash=hash_hex,
        password_salt=salt_hex,
    )
    db.add(cred)
    db.commit()
    return {"setup_required": False}


@router.post("/change-password", status_code=200)
def change_password(
    body: ChangePasswordRequest,
    username: str = Depends(verify_auth),
    db: Session = Depends(get_db),
):
    """Change password. Requires current credentials."""
    cred = db.query(UserCredential).first()
    if not cred:
        raise HTTPException(400, "Setup not completed yet")
    if not verify_password(body.current_password, cred.password_hash, cred.password_salt):
        raise HTTPException(401, "Current password incorrect")
    hash_hex, salt_hex = hash_password(body.new_password)
    cred.password_hash = hash_hex
    cred.password_salt = salt_hex
    db.commit()
    return {"status": "ok"}
