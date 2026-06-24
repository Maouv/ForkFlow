import hashlib
import secrets

PBKDF2_ITERATIONS = 100_000


def hash_password(password: str) -> tuple[str, str]:
    """Returns (hash_hex, salt_hex)."""
    salt = secrets.token_bytes(32)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt, PBKDF2_ITERATIONS
    )
    return digest.hex(), salt.hex()


def verify_password(password: str, hash_hex: str, salt_hex: str) -> bool:
    """Constant-time comparison."""
    salt = bytes.fromhex(salt_hex)
    expected = bytes.fromhex(hash_hex)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt, PBKDF2_ITERATIONS
    )
    return secrets.compare_digest(digest, expected)
