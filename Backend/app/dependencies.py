"""Shared FastAPI dependencies: auth, RBAC, API-key validation."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from typing import Annotated

import asyncpg
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.database import get_pool

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ---------------------------------------------------------------------------
# User context (populated from JWT + DB)
# ---------------------------------------------------------------------------

@dataclass
class UserContext:
    id: str
    email: str
    role: str  # ADMIN | MANAGER | DEVELOPER | VIEWER
    team_ids: list[str] = field(default_factory=list)
    project_ids: list[str] = field(default_factory=list)
    module_ids: list[str] = field(default_factory=list)


async def _load_user_scope(pool: asyncpg.Pool, user_id: str) -> UserContext:
    """Fetch user record and access scope from the database."""
    row = await pool.fetchrow(
        "SELECT id, email, role FROM users WHERE id = $1 AND is_active = TRUE",
        user_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    ctx = UserContext(id=str(row["id"]), email=row["email"], role=row["role"])

    # Team memberships
    team_rows = await pool.fetch(
        "SELECT team_id FROM team_members WHERE user_id = $1", user_id
    )
    ctx.team_ids = [str(r["team_id"]) for r in team_rows]

    # Project access (via team OR direct membership)
    proj_rows = await pool.fetch(
        """
        SELECT DISTINCT p.id FROM projects p
        LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
        WHERE p.team_id = ANY($2::uuid[]) OR pm.user_id IS NOT NULL
        """,
        user_id,
        ctx.team_ids or [],
    )
    ctx.project_ids = [str(r["id"]) for r in proj_rows]

    # Module assignments (for DEVELOPER scoping)
    if ctx.role == "DEVELOPER":
        mod_rows = await pool.fetch(
            "SELECT module_id FROM module_assignments WHERE user_id = $1", user_id
        )
        ctx.module_ids = [str(r["module_id"]) for r in mod_rows]

    return ctx


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> UserContext:
    """Decode JWT and load user context."""
    from app.auth.service import decode_token  # deferred to avoid circular import

    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    pool = get_pool()
    return await _load_user_scope(pool, user_id)


def require_role(*roles: str):
    """Return a dependency that enforces role membership."""

    async def _check(user: Annotated[UserContext, Depends(get_current_user)]) -> UserContext:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _check


# ---------------------------------------------------------------------------
# API-key validation (for SDK ingestion)
# ---------------------------------------------------------------------------

async def validate_api_key(
    x_api_key: Annotated[str, Header()],
) -> str:
    """Hash the incoming key, look it up, return the associated project_id."""
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT project_id FROM api_keys WHERE key_hash = $1 AND is_active = TRUE",
        key_hash,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or inactive API key")
    return str(row["project_id"])
