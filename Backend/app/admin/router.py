"""Admin CRUD endpoints (users, teams, projects, modules, API keys)."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_pool
from app.dependencies import UserContext, require_role
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
    TeamMemberAdd,
    TeamOut,
    UserCreate,
    UserListResponse,
    UserOut,
)
from app.admin import service

router = APIRouter()

AdminUser = Annotated[UserContext, Depends(require_role("ADMIN"))]
ManagerUser = Annotated[UserContext, Depends(require_role("ADMIN", "MANAGER"))]


# ── Users ─────────────────────────────────────────────────────────────────

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate, user: AdminUser):
    return await service.create_user(get_pool(), body)


@router.get("/users", response_model=UserListResponse)
async def list_users(
    user: AdminUser,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
):
    return await service.list_users(get_pool(), page, per_page)


@router.get("/members")
async def list_members(
    user: AdminUser,
    role: str | None = None,
):
    """List all active users, optionally filtered by role (ADMIN, MANAGER, DEVELOPER)."""
    pool = get_pool()
    if role:
        rows = await pool.fetch(
            """SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at,
                      o.name AS organization_name,
                      COUNT(DISTINCT pm.project_id) AS project_count
               FROM users u
               LEFT JOIN organizations o ON o.id = u.organization_id
               LEFT JOIN project_members pm ON pm.user_id = u.id
               WHERE u.role = $1::user_role AND u.is_active = TRUE
               GROUP BY u.id, o.name
               ORDER BY u.full_name""",
            role,
        )
    else:
        rows = await pool.fetch(
            """SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at,
                      o.name AS organization_name,
                      COUNT(DISTINCT pm.project_id) AS project_count
               FROM users u
               LEFT JOIN organizations o ON o.id = u.organization_id
               LEFT JOIN project_members pm ON pm.user_id = u.id
               WHERE u.is_active = TRUE
               GROUP BY u.id, o.name
               ORDER BY u.full_name""",
        )
    return [
        {
            "id": str(r["id"]),
            "email": r["email"],
            "full_name": r["full_name"],
            "role": r["role"],
            "is_active": r["is_active"],
            "organization_name": r["organization_name"],
            "project_count": r["project_count"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_user(user_id: UUID, user: AdminUser):
    ok = await service.deactivate_user(get_pool(), user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="User not found")


# ── Teams ─────────────────────────────────────────────────────────────────

@router.post("/teams", response_model=TeamOut, status_code=status.HTTP_201_CREATED)
async def create_team(body: TeamCreate, user: AdminUser):
    return await service.create_team(get_pool(), body)


@router.get("/teams", response_model=list[TeamOut])
async def list_teams(user: ManagerUser):
    return await service.list_teams(get_pool())


@router.post("/teams/{team_id}/members", status_code=status.HTTP_204_NO_CONTENT)
async def add_team_member(team_id: UUID, body: TeamMemberAdd, user: AdminUser):
    await service.add_team_member(get_pool(), team_id, body.user_id)


@router.delete("/teams/{team_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(team_id: UUID, member_id: UUID, user: AdminUser):
    await service.remove_team_member(get_pool(), team_id, member_id)


# ── Projects ──────────────────────────────────────────────────────────────

@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(body: ProjectCreate, user: ManagerUser):
    return await service.create_project(get_pool(), body)


@router.get("/projects", response_model=list[ProjectOut])
async def list_projects(user: ManagerUser, team_id: UUID | None = None):
    return await service.list_projects(get_pool(), team_id)


# ── Modules ───────────────────────────────────────────────────────────────

@router.post("/modules", response_model=ModuleOut, status_code=status.HTTP_201_CREATED)
async def create_module(body: ModuleCreate, user: ManagerUser):
    return await service.create_module(get_pool(), body)


@router.get("/modules", response_model=list[ModuleOut])
async def list_modules(project_id: UUID, user: ManagerUser):
    return await service.list_modules(get_pool(), project_id)


@router.post("/modules/{module_id}/assign", status_code=status.HTTP_204_NO_CONTENT)
async def assign_module(module_id: UUID, body: ModuleAssignRequest, user: ManagerUser):
    await service.assign_module(get_pool(), module_id, body.user_id)


# ── API Keys ──────────────────────────────────────────────────────────────

@router.post("/api-keys", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED)
async def create_api_key(body: ApiKeyCreate, user: ManagerUser):
    return await service.create_api_key(get_pool(), body, UUID(user.id))


@router.get("/api-keys", response_model=list[ApiKeyOut])
async def list_api_keys(project_id: UUID, user: ManagerUser):
    return await service.list_api_keys(get_pool(), project_id)


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(key_id: UUID, user: AdminUser):
    ok = await service.revoke_api_key(get_pool(), key_id)
    if not ok:
        raise HTTPException(status_code=404, detail="API key not found")
