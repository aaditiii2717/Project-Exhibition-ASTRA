"""Runtime security controls for ASTRA service deployments."""

import hashlib
import hmac
import os
from dataclasses import dataclass
from typing import Iterable

from fastapi import Header, HTTPException, status


@dataclass(frozen=True)
class SecuritySettings:
    environment: str
    api_key: str | None
    cors_origins: list[str]
    ledger_signing_key: str | None

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @classmethod
    def from_environment(cls) -> "SecuritySettings":
        origins = [origin.strip() for origin in os.getenv("ASTRA_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()]
        settings = cls(
            environment=os.getenv("ASTRA_ENV", "development"),
            api_key=os.getenv("ASTRA_API_KEY"),
            cors_origins=origins,
            ledger_signing_key=os.getenv("ASTRA_LEDGER_SIGNING_KEY"),
        )
        if settings.is_production and (not settings.api_key or not settings.ledger_signing_key):
            raise RuntimeError("ASTRA_API_KEY and ASTRA_LEDGER_SIGNING_KEY must be configured in production.")
        return settings


settings = SecuritySettings.from_environment()


def require_api_key(x_astra_api_key: str | None = Header(default=None)) -> None:
    """Require a constant-time API key comparison outside local development."""
    if not settings.is_production:
        return
    if not x_astra_api_key or not hmac.compare_digest(x_astra_api_key, settings.api_key or ""):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing ASTRA API key")


def require_stream_id(x_astra_stream_id: str | None = Header(default=None)) -> str:
    """Bind sequential integrity checks to an explicit receiver/stream identity."""
    if not x_astra_stream_id or len(x_astra_stream_id) > 128 or not x_astra_stream_id.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="X-ASTRA-Stream-ID must contain only letters, numbers, hyphens, or underscores")
    return x_astra_stream_id
