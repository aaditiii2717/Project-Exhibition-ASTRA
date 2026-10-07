"""Supabase Auth-backed user store for ASTRA Mission Control login.

Accounts live in Supabase's built-in Authentication (dashboard ->
Authentication -> Users), so no custom table is needed and Supabase handles
password hashing. ASTRA logs in by username, so each username maps to a
synthetic email (`<username>@users.astra.local`); the ASTRA role is kept in
app_metadata, which only the service-role key can change.

Talks to the Supabase REST API directly with the service-role key, so no
extra client library is needed. The key stays server-side; the browser only
ever talks to ASTRA's own /api/auth endpoints.
"""

import json
import os
import urllib.error
import urllib.request
from typing import Optional

EMAIL_DOMAIN = "users.astra.local"
REQUEST_TIMEOUT_SECONDS = 10


class UserAlreadyExists(Exception):
    pass


class SupabaseError(Exception):
    pass


def _config() -> tuple[str, str] | None:
    url = (os.getenv("SUPABASE_URL") or "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or ""
    return (url, key) if url and key else None


def is_configured() -> bool:
    return _config() is not None


def _email_for(username: str) -> str:
    return f"{username.lower()}@{EMAIL_DOMAIN}"


def _request(path: str, body: dict) -> tuple[int, dict]:
    url, key = _config()
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    req = urllib.request.Request(f"{url}/auth/v1/{path}", data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT_SECONDS) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read() or b"{}")
        except json.JSONDecodeError:
            return exc.code, {}
    except urllib.error.URLError as exc:
        raise SupabaseError(f"Could not reach Supabase: {exc.reason}") from exc


def create_user(username: str, password: str, role: str) -> None:
    status, data = _request("admin/users", {
        "email": _email_for(username),
        "password": password,
        "email_confirm": True,
        "app_metadata": {"role": role},
        "user_metadata": {"username": username},
    })
    if status in (200, 201):
        return
    if data.get("error_code") == "email_exists":
        raise UserAlreadyExists()
    raise SupabaseError(f"Supabase user creation failed ({status}): {data}")


def sign_in(username: str, password: str) -> Optional[str]:
    """Returns the user's ASTRA role, or None for a wrong username/password."""
    status, data = _request("token?grant_type=password", {"email": _email_for(username), "password": password})
    if status == 200:
        return (data.get("user", {}).get("app_metadata") or {}).get("role", "employee")
    if data.get("error_code") == "invalid_credentials":
        return None
    raise SupabaseError(f"Supabase sign-in failed ({status}): {data}")
