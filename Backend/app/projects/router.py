"""Project management endpoints."""

from __future__ import annotations

import hashlib
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.database import get_pool
from app.dependencies import UserContext, get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CreateProject(BaseModel):
    name: str
    description: str | None = None
    team_id: str  # still required by the projects table FK


class AssignDeveloper(BaseModel):
    user_id: str


class GenerateApiKey(BaseModel):
    label: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_project_or_404(pool, project_id: str):
    row = await pool.fetchrow(
        "SELECT id, team_id, organization_id, name, description, created_at FROM projects WHERE id = $1",
        project_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return row


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/projects", status_code=status.HTTP_201_CREATED)
async def create_project(
    body: CreateProject,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Create a project (MANAGER only, within their organization)."""
    if user.role not in ("MANAGER", "ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers and admins can create projects")

    pool = get_pool()

    # Verify team exists
    team = await pool.fetchrow("SELECT id FROM teams WHERE id = $1", body.team_id)
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")

    row = await pool.fetchrow(
        """INSERT INTO projects (team_id, organization_id, name, description)
           VALUES ($1, $2, $3, $4)
           RETURNING id, name, description, created_at""",
        body.team_id,
        user.organization_id,
        body.name,
        body.description,
    )
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "description": row["description"],
        "organization_id": user.organization_id,
        "team_id": body.team_id,
        "created_at": row["created_at"].isoformat(),
    }


@router.get("/projects")
async def list_projects(
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """List projects (role-based).

    - ADMIN: sees all projects
    - MANAGER: sees projects in their organization
    - DEVELOPER: sees assigned projects
    """
    pool = get_pool()

    if user.role == "ADMIN":
        rows = await pool.fetch(
            """SELECT p.id, p.name, p.description, p.organization_id, p.created_at,
                      o.name AS organization_name,
                      COUNT(DISTINCT pm.user_id) AS developer_count
               FROM projects p
               LEFT JOIN organizations o ON o.id = p.organization_id
               LEFT JOIN project_members pm ON pm.project_id = p.id
               GROUP BY p.id, o.name
               ORDER BY p.created_at DESC"""
        )
    elif user.role == "MANAGER":
        rows = await pool.fetch(
            """SELECT p.id, p.name, p.description, p.organization_id, p.created_at,
                      o.name AS organization_name,
                      COUNT(DISTINCT pm.user_id) AS developer_count
               FROM projects p
               LEFT JOIN organizations o ON o.id = p.organization_id
               LEFT JOIN project_members pm ON pm.project_id = p.id
               WHERE p.organization_id = $1
               GROUP BY p.id, o.name
               ORDER BY p.created_at DESC""",
            user.organization_id,
        )
    else:
        # DEVELOPER: sees only assigned projects
        rows = await pool.fetch(
            """SELECT p.id, p.name, p.description, p.organization_id, p.created_at,
                      o.name AS organization_name,
                      COUNT(DISTINCT pm2.user_id) AS developer_count
               FROM projects p
               JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
               LEFT JOIN organizations o ON o.id = p.organization_id
               LEFT JOIN project_members pm2 ON pm2.project_id = p.id
               GROUP BY p.id, o.name
               ORDER BY p.created_at DESC""",
            user.id,
        )

    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "description": r["description"],
            "organization_id": str(r["organization_id"]) if r["organization_id"] else None,
            "organization_name": r["organization_name"],
            "developer_count": r["developer_count"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Get project details with developers and logs summary."""
    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    # Developers assigned
    devs = await pool.fetch(
        """SELECT u.id, u.email, u.full_name
           FROM project_members pm
           JOIN users u ON u.id = pm.user_id
           WHERE pm.project_id = $1 AND u.is_active = TRUE""",
        project_id,
    )

    # Logs summary
    log_summary = await pool.fetchrow(
        """SELECT COUNT(*) AS total_logs,
                  COUNT(*) FILTER (WHERE level = 'ERROR') AS error_count,
                  COUNT(*) FILTER (WHERE level = 'FATAL') AS fatal_count,
                  MAX(timestamp) AS latest_log_at
           FROM logs
           WHERE project_id = $1""",
        project_id,
    )

    return {
        "id": str(project["id"]),
        "name": project["name"],
        "description": project["description"],
        "organization_id": str(project["organization_id"]) if project["organization_id"] else None,
        "team_id": str(project["team_id"]),
        "created_at": project["created_at"].isoformat(),
        "developers": [
            {"id": str(d["id"]), "email": d["email"], "full_name": d["full_name"]}
            for d in devs
        ],
        "logs_summary": {
            "total_logs": log_summary["total_logs"],
            "error_count": log_summary["error_count"],
            "fatal_count": log_summary["fatal_count"],
            "latest_log_at": log_summary["latest_log_at"].isoformat() if log_summary["latest_log_at"] else None,
        },
    }


@router.get("/projects/{project_id}/developers")
async def list_project_developers(
    project_id: str,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """List developers assigned to a project."""
    pool = get_pool()
    await _get_project_or_404(pool, project_id)

    rows = await pool.fetch(
        """SELECT u.id, u.email, u.full_name, u.role, u.created_at
           FROM project_members pm
           JOIN users u ON u.id = pm.user_id
           WHERE pm.project_id = $1 AND u.is_active = TRUE
           ORDER BY u.full_name""",
        project_id,
    )
    return [
        {
            "id": str(r["id"]),
            "email": r["email"],
            "full_name": r["full_name"],
            "role": r["role"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


@router.post("/projects/{project_id}/developers", status_code=status.HTTP_201_CREATED)
async def assign_developer(
    project_id: str,
    body: AssignDeveloper,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Assign a developer to a project (MANAGER only)."""
    if user.role not in ("MANAGER", "ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers and admins can assign developers")

    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    # MANAGER must own the project's org
    if user.role == "MANAGER" and str(project["organization_id"]) != user.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project does not belong to your organization")

    # Verify user exists and is a developer
    dev = await pool.fetchrow(
        "SELECT id, role FROM users WHERE id = $1 AND is_active = TRUE", body.user_id
    )
    if not dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Insert membership
    try:
        await pool.execute(
            "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
            project_id,
            body.user_id,
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Developer already assigned to this project")

    return {"project_id": project_id, "user_id": body.user_id, "status": "assigned"}


@router.delete("/projects/{project_id}/developers/{user_id}")
async def remove_developer(
    project_id: str,
    user_id: str,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Remove a developer from a project (MANAGER only)."""
    if user.role not in ("MANAGER", "ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers and admins can remove developers")

    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    if user.role == "MANAGER" and str(project["organization_id"]) != user.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project does not belong to your organization")

    result = await pool.execute(
        "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
        project_id,
        user_id,
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found in this project")

    return {"project_id": project_id, "user_id": user_id, "status": "removed"}


@router.post("/projects/{project_id}/api-keys", status_code=status.HTTP_201_CREATED)
async def generate_api_key(
    project_id: str,
    body: GenerateApiKey,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Generate an API key for a project (MANAGER only).

    Returns the plain key once. Only the hash is stored.
    """
    if user.role not in ("MANAGER", "ADMIN"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only managers and admins can generate API keys")

    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    if user.role == "MANAGER" and str(project["organization_id"]) != user.organization_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Project does not belong to your organization")

    # Generate a random API key
    plain_key = secrets.token_hex(32)  # 64-char hex string
    key_hash = hashlib.sha256(plain_key.encode()).hexdigest()

    row = await pool.fetchrow(
        """INSERT INTO api_keys (project_id, key_hash, label, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING id, created_at""",
        project_id,
        key_hash,
        body.label,
        user.id,
    )

    return {
        "id": str(row["id"]),
        "project_id": project_id,
        "api_key": plain_key,  # shown once, never stored
        "label": body.label,
        "created_at": row["created_at"].isoformat(),
        "message": "Store this API key securely. It will not be shown again.",
    }


@router.get("/projects/{project_id}/logs")
async def get_project_logs(
    project_id: str,
    user: Annotated[UserContext, Depends(get_current_user)],
    level: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """Get logs for a project."""
    pool = get_pool()
    await _get_project_or_404(pool, project_id)

    if level:
        rows = await pool.fetch(
            """SELECT id, module, level, message, timestamp, service, environment,
                      error_type, stack_trace, ingested_at
               FROM logs
               WHERE project_id = $1 AND level = $2::log_level
               ORDER BY timestamp DESC
               LIMIT $3 OFFSET $4""",
            project_id,
            level,
            limit,
            offset,
        )
    else:
        rows = await pool.fetch(
            """SELECT id, module, level, message, timestamp, service, environment,
                      error_type, stack_trace, ingested_at
               FROM logs
               WHERE project_id = $1
               ORDER BY timestamp DESC
               LIMIT $2 OFFSET $3""",
            project_id,
            limit,
            offset,
        )

    return [
        {
            "id": str(r["id"]),
            "module": r["module"],
            "level": r["level"],
            "message": r["message"],
            "timestamp": r["timestamp"].isoformat(),
            "service": r["service"],
            "environment": r["environment"],
            "error_type": r["error_type"],
            "stack_trace": r["stack_trace"],
            "ingested_at": r["ingested_at"].isoformat(),
        }
        for r in rows
    ]
