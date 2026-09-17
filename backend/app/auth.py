"""Role-based authentication for ASTRA Mission Control.

Three access levels form a strict hierarchy — employee (1) < manager (2) <
supervisor (3) — and every endpoint dependency checks a *minimum* level, so
higher roles automatically inherit lower-role permissions.
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path
from typing import Optional

from fastapi import Depends, Header, HTTPException, status

from .security import settings

ROLE_LEVELS = {"employee": 1, "manager": 2, "supervisor": 3}
LEVEL_NAMES = {1: "employee", 2: "manager", 3: "supervisor"}
TOKEN_TTL_SECONDS = 12 * 60 * 60  # 12 hours

USERS_FILE = Path(__file__).resolve().parent / "data" / "users.json"
PBKDF2_ITERATIONS = 200_000

# Falls back to a fixed development secret outside production, matching the
# tolerance already established for ASTRA_LEDGER_SIGNING_KEY in security.py.
_AUTH_SECRET = (settings.ledger_signing_key or os.getenv("ASTRA_AUTH_SECRET") or "astra-dev-secret-change-me").encode("utf-8")

# Seeded on first run only. Change these before any real deployment.
DEFAULT_USERS = {
    "employee1": {"password": "Employee@123", "role": "employee"},
    "manager1": {"password": "Manager@123", "role": "manager"},
    "supervisor1": {"password": "Supervisor@123", "role": "supervisor"},
}


def _hash_password(password: str, salt: bytes) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS).hex()


def _make_password_record(password: str) -> str:
    salt = secrets.token_bytes(16)
    return f"{salt.hex()}${_hash_password(password, salt)}"


def _verify_password(password: str, record: str) -> bool:
    try:
        salt_hex, hash_hex = record.split("$", 1)
    except ValueError:
        return False
    candidate = _hash_password(password, bytes.fromhex(salt_hex))
    return hmac.compare_digest(candidate, hash_hex)


def _seed_users() -> dict:
    USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    users = {
        username: {"password_hash": _make_password_record(info["password"]), "role": info["role"]}
        for username, info in DEFAULT_USERS.items()
    }
    USERS_FILE.write_text(json.dumps(users, indent=2), encoding="utf-8")
    return users


def _load_users() -> dict:
    if not USERS_FILE.exists():
        return _seed_users()
    try:
        return json.loads(USERS_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return _seed_users()


def authenticate(username: str, password: str) -> Optional[str]:
    """Returns the user's role string if credentials are valid, else None."""
    record = _load_users().get(username)
    if not record or not _verify_password(password, record["password_hash"]):
        return None
    return record["role"]


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_token(username: str, role: str) -> tuple[str, int]:
    """Signs a compact, expiring session token (HMAC-SHA256, not a full JWT)."""
    expires_at = int(time.time()) + TOKEN_TTL_SECONDS
    payload_b64 = _b64encode(json.dumps({"sub": username, "role": role, "exp": expires_at}, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(_AUTH_SECRET, payload_b64.encode("ascii"), hashlib.sha256).digest()
    return f"{payload_b64}.{_b64encode(signature)}", expires_at


class AuthUser:
    def __init__(self, username: str, role: str):
        self.username = username
        self.role = role
        self.level = ROLE_LEVELS.get(role, 0)


def _decode_token(token: str) -> AuthUser:
    try:
        payload_b64, signature_b64 = token.split(".", 1)
        expected = hmac.new(_AUTH_SECRET, payload_b64.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64decode(signature_b64), expected):
            raise ValueError("signature mismatch")
        payload = json.loads(_b64decode(payload_b64))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")
        role = payload.get("role")
        if role not in ROLE_LEVELS:
            raise ValueError("unknown role")
        return AuthUser(username=payload["sub"], role=role)
    except (ValueError, KeyError, TypeError, UnicodeDecodeError, base64.binascii.Error):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session token")


def get_current_user(authorization: str | None = Header(default=None)) -> AuthUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return _decode_token(authorization[len("Bearer "):])


def require_level(min_level: int):
    """Dependency factory: rejects any session below `min_level` (employee=1, manager=2, supervisor=3)."""
    def _dependency(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if user.level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires {LEVEL_NAMES.get(min_level, 'higher')}-level access or above",
            )
        return user
    return _dependency
