"""Admin business logic: user, team, project, module, API-key management."""

from __future__ import annotations

import hashlib
import secrets
from uuid import UUID

import asyncpg

from app.admin.schemas import (
    ApiKeyCreate,
    ApiKeyCreated,
    ApiKeyOut,
    ModuleAssignRequest,
    ModuleCreate,
    ModuleOut,
    ProjectCreate,
    ProjectOut,
    TeamCreate,
    TeamOut,
    UserCreate,
    UserListResponse,
    UserOut,
)
from app.auth.service import hash_password


# ── Users ─────────────────────────────────────────────────────────────────

async def create_user(pool: asyncpg.Pool, data: UserCreate) -> UserOut:
    pw_hash = hash_password(data.password)
    row = await pool.fetchrow(
        """
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ($1, $2, $3, $4::user_role)
        RETURNING id, email, full_name, role, is_active, created_at
        """,
        data.email,
        pw_hash,
        data.full_name,
        data.role.value,
    )
    return _user_row(row)


async def list_users(pool: asyncpg.Pool, page: int = 1, per_page: int = 50) -> UserListResponse:
    total = await pool.fetchval("SELECT COUNT(*) FROM users")
    rows = await pool.fetch(
        "SELECT id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
        per_page,
        (page - 1) * per_page,
    )
    return UserListResponse(items=[_user_row(r) for r in rows], total=total)


async def deactivate_user(pool: asyncpg.Pool, user_id: UUID) -> bool:
    result = await pool.execute(
        "UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1",
        user_id,
    )
    return result == "UPDATE 1"


def _user_row(row) -> UserOut:
    return UserOut(
        id=row["id"], email=row["email"], full_name=row["full_name"],
        role=row["role"], is_active=row["is_active"], created_at=row["created_at"],
    )


# ── Teams ─────────────────────────────────────────────────────────────────

async def create_team(pool: asyncpg.Pool, data: TeamCreate) -> TeamOut:
    row = await pool.fetchrow(
        "INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at",
        data.name,
        data.description,
    )
    return TeamOut(id=row["id"], name=row["name"], description=row["description"], created_at=row["created_at"])


async def list_teams(pool: asyncpg.Pool) -> list[TeamOut]:
    rows = await pool.fetch("SELECT id, name, description, created_at FROM teams ORDER BY name")
    return [TeamOut(id=r["id"], name=r["name"], description=r["description"], created_at=r["created_at"]) for r in rows]


async def add_team_member(pool: asyncpg.Pool, team_id: UUID, user_id: UUID) -> None:
    await pool.execute(
        "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        team_id,
        user_id,
    )


async def remove_team_member(pool: asyncpg.Pool, team_id: UUID, user_id: UUID) -> None:
    await pool.execute("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2", team_id, user_id)


# ── Projects ──────────────────────────────────────────────────────────────

async def create_project(pool: asyncpg.Pool, data: ProjectCreate) -> ProjectOut:
    row = await pool.fetchrow(
        "INSERT INTO projects (team_id, name, description) VALUES ($1, $2, $3) RETURNING id, team_id, name, description, created_at",
        data.team_id,
        data.name,
        data.description,
    )
    return ProjectOut(id=row["id"], team_id=row["team_id"], name=row["name"], description=row["description"], created_at=row["created_at"])


async def list_projects(pool: asyncpg.Pool, team_id: UUID | None = None) -> list[ProjectOut]:
    if team_id:
        rows = await pool.fetch(
            "SELECT id, team_id, name, description, created_at FROM projects WHERE team_id = $1 ORDER BY name",
            team_id,
        )
    else:
        rows = await pool.fetch("SELECT id, team_id, name, description, created_at FROM projects ORDER BY name")
    return [ProjectOut(id=r["id"], team_id=r["team_id"], name=r["name"], description=r["description"], created_at=r["created_at"]) for r in rows]


# ── Modules ───────────────────────────────────────────────────────────────

async def create_module(pool: asyncpg.Pool, data: ModuleCreate) -> ModuleOut:
    row = await pool.fetchrow(
        "INSERT INTO modules (project_id, name) VALUES ($1, $2) RETURNING id, project_id, name",
        data.project_id,
        data.name,
    )
    return ModuleOut(id=row["id"], project_id=row["project_id"], name=row["name"])


async def list_modules(pool: asyncpg.Pool, project_id: UUID) -> list[ModuleOut]:
    rows = await pool.fetch(
        "SELECT id, project_id, name FROM modules WHERE project_id = $1 ORDER BY name",
        project_id,
    )
    return [ModuleOut(id=r["id"], project_id=r["project_id"], name=r["name"]) for r in rows]


async def assign_module(pool: asyncpg.Pool, module_id: UUID, user_id: UUID) -> None:
    await pool.execute(
        "INSERT INTO module_assignments (module_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        module_id,
        user_id,
    )


# ── API Keys ──────────────────────────────────────────────────────────────

async def create_api_key(pool: asyncpg.Pool, data: ApiKeyCreate, created_by: UUID) -> ApiKeyCreated:
    raw_key = f"orchid_{secrets.token_hex(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    row = await pool.fetchrow(
        """
        INSERT INTO api_keys (project_id, key_hash, label, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, project_id, label
        """,
        data.project_id,
        key_hash,
        data.label,
        created_by,
    )
    return ApiKeyCreated(id=row["id"], project_id=row["project_id"], label=row["label"], raw_key=raw_key)


async def list_api_keys(pool: asyncpg.Pool, project_id: UUID) -> list[ApiKeyOut]:
    rows = await pool.fetch(
        "SELECT id, project_id, label, is_active, created_at FROM api_keys WHERE project_id = $1 ORDER BY created_at DESC",
        project_id,
    )
    return [ApiKeyOut(id=r["id"], project_id=r["project_id"], label=r["label"], is_active=r["is_active"], created_at=r["created_at"]) for r in rows]


async def revoke_api_key(pool: asyncpg.Pool, key_id: UUID) -> bool:
    result = await pool.execute("UPDATE api_keys SET is_active = FALSE WHERE id = $1", key_id)
    return result == "UPDATE 1"
