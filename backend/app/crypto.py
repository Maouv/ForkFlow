import os
from pathlib import Path

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


def _resolve_key() -> str:
    """Resolve encryption key: env var > persisted file > auto-generate + persist."""
    # 1. Env var — highest priority, user-provided
    if settings.forkflow_encryption_key:
        return settings.forkflow_encryption_key

    # 2. Persisted key file — auto-generated on first run
    key_file = Path(settings.forkflow_db_path).parent / ".encryption_key"
    if key_file.exists():
        return key_file.read_text().strip()

    # 3. First run: generate + persist
    key = Fernet.generate_key().decode()
    key_file.parent.mkdir(parents=True, exist_ok=True)
    key_file.write_text(key)
    # Restrict permissions
    try:
        os.chmod(key_file, 0o600)
    except OSError:
        pass
    return key


def _get_fernet() -> Fernet:
    return Fernet(_resolve_key().encode())


_fernet = _get_fernet()


def encrypt_api_key(plaintext: str) -> str:
    if not plaintext:
        return ""
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt_api_key(ciphertext: str) -> str | None:
    if not ciphertext:
        return None
    try:
        return _fernet.decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        return None
