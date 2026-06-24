import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import UserCredential
from app.auth.password import verify_password

security = HTTPBasic()


def verify_auth(
    credentials: HTTPBasicCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> str:
    # Check DB credentials first (first-run setup)
    cred = db.query(UserCredential).first()
    if cred:
        if secrets.compare_digest(
            credentials.username.encode(), cred.username.encode()
        ) and verify_password(
            credentials.password, cred.password_hash, cred.password_salt
        ):
            return credentials.username
    else:
        # Fallback to env var credentials (before setup)
        is_user = secrets.compare_digest(
            credentials.username.encode(), settings.forkflow_username.encode()
        )
        is_pass = secrets.compare_digest(
            credentials.password.encode(), settings.forkflow_password.encode()
        )
        if is_user and is_pass:
            return credentials.username

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        headers={"WWW-Authenticate": "Basic"},
    )
