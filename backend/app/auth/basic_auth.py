import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.config import settings

security = HTTPBasic()


def verify_auth(credentials: HTTPBasicCredentials = Depends(security)) -> str:
    is_user = secrets.compare_digest(
        credentials.username.encode(), settings.forkflow_username.encode()
    )
    is_pass = secrets.compare_digest(
        credentials.password.encode(), settings.forkflow_password.encode()
    )
    if not (is_user and is_pass):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username
