from app.crypto import encrypt_api_key, decrypt_api_key


def test_encrypt_decrypt_roundtrip():
    plaintext = "***"
    encrypted = encrypt_api_key(plaintext)
    assert encrypted != plaintext
    decrypted = decrypt_api_key(encrypted)
    assert decrypted == plaintext


def test_decrypt_invalid_returns_none():
    result = decrypt_api_key("not-valid-encrypted-data")
    assert result is None


def test_encrypt_empty_returns_empty():
    assert encrypt_api_key("") == ""


def test_decrypt_empty_returns_none():
    assert decrypt_api_key("") is None
