"""Project management endpoints."""

from __future__ import annotations

import hashlib
import secrets
from typing import Annotated

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.database import get_pool
from app.dependencies import UserContext, get_current_user, require_approved_role, require_role

router = APIRouter()


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class CreateProject(BaseModel):
    name: str
    description: str | None = None
    # team_id is now optional — the backend finds/creates one automatically
    team_id: str | None = None


class AssignDeveloper(BaseModel):
    user_id: str


class GenerateApiKey(BaseModel):
    label: str | None = None
    assigned_to: str | None = None  # user_id of the developer this key is for


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


async def _get_or_create_team(pool, organization_id: str, user_id: str) -> str:
    """Find an existing team for the org's manager, or create a default one."""
    # Look for a team the current user belongs to
    row = await pool.fetchrow(
        "SELECT team_id FROM team_members WHERE user_id = $1 LIMIT 1",
        user_id,
    )
    if row:
        return str(row["team_id"])

    # Look for any team associated with users in this org
    row = await pool.fetchrow(
        """SELECT tm.team_id
           FROM team_members tm
           JOIN users u ON u.id = tm.user_id
           WHERE u.organization_id = $1
           LIMIT 1""",
        organization_id,
    )
    if row:
        # Add this user to the found team and return it
        team_id = str(row["team_id"])
        await pool.execute(
            "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            team_id, user_id,
        )
        return team_id

    # No team found — create a default team for this org
    org_row = await pool.fetchrow(
        "SELECT name FROM organizations WHERE id = $1", organization_id
    )
    team_name = f"{org_row['name']} Team" if org_row else "Default Team"

    # team names must be unique — append a suffix if needed
    suffix = 0
    base_name = team_name
    while True:
        candidate = base_name if suffix == 0 else f"{base_name} {suffix}"
        exists = await pool.fetchrow("SELECT 1 FROM teams WHERE name = $1", candidate)
        if not exists:
            team_name = candidate
            break
        suffix += 1

    team_row = await pool.fetchrow(
        "INSERT INTO teams (name, description) VALUES ($1, $2) RETURNING id",
        team_name,
        "Auto-created default team",
    )
    team_id = str(team_row["id"])

    # Add creator to the team
    await pool.execute(
        "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        team_id, user_id,
    )
    return team_id


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/projects", status_code=status.HTTP_201_CREATED)
async def create_project(
    body: CreateProject,
    user: Annotated[UserContext, Depends(require_approved_role("ADMIN", "MANAGER"))],
):
    """Create a project (approved MANAGER or ADMIN, within their organization)."""

    pool = get_pool()

    # Resolve team_id
    if body.team_id:
        team = await pool.fetchrow("SELECT id FROM teams WHERE id = $1", body.team_id)
        if not team:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        team_id = body.team_id
    else:
        team_id = await _get_or_create_team(pool, user.organization_id, user.id)

    # ADMIN creates projects directly as APPROVED; MANAGER's projects need admin approval
    project_status = "APPROVED" if user.role == "ADMIN" else "PENDING"

    row = await pool.fetchrow(
        """INSERT INTO projects (team_id, organization_id, name, description, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, description, created_at, status""",
        team_id,
        user.organization_id,
        body.name,
        body.description,
        project_status,
    )
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "description": row["description"],
        "organization_id": user.organization_id,
        "team_id": team_id,
        "created_at": row["created_at"].isoformat(),
        "status": row["status"],
        "developer_count": 0,
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
        # ADMIN sees all projects in their org (including PENDING for approval)
        rows = await pool.fetch(
            """SELECT p.id, p.name, p.description, p.organization_id, p.created_at,
                      p.status, o.name AS organization_name,
                      COUNT(DISTINCT pm.user_id) AS developer_count
               FROM projects p
               LEFT JOIN organizations o ON o.id = p.organization_id
               LEFT JOIN project_members pm ON pm.project_id = p.id
               WHERE p.organization_id = $1
               GROUP BY p.id, o.name
               ORDER BY p.created_at DESC""",
            user.organization_id,
        )
    elif user.role == "MANAGER":
        # MANAGER sees their org's APPROVED projects + their own PENDING ones
        rows = await pool.fetch(
            """SELECT p.id, p.name, p.description, p.organization_id, p.created_at,
                      p.status, o.name AS organization_name,
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
        # DEVELOPER: sees only assigned APPROVED projects
        rows = await pool.fetch(
            """SELECT p.id, p.name, p.description, p.organization_id, p.created_at,
                      p.status, o.name AS organization_name,
                      COUNT(DISTINCT pm2.user_id) AS developer_count
               FROM projects p
               JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
               LEFT JOIN organizations o ON o.id = p.organization_id
               LEFT JOIN project_members pm2 ON pm2.project_id = p.id
               WHERE p.status = 'APPROVED'
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
            "status": r["status"],
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

    # API keys count
    api_key_count = await pool.fetchval(
        "SELECT COUNT(*) FROM api_keys WHERE project_id = $1 AND is_active = TRUE",
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
        "api_key_count": api_key_count,
    }


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    user: Annotated[UserContext, Depends(require_approved_role("ADMIN", "MANAGER"))],
):
    """Delete a project and its members (ADMIN or approved MANAGER of same org)."""
    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    if user.role == "MANAGER" and str(project["organization_id"]) != user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project does not belong to your organization",
        )

    # Remove member assignments first (FK constraint)
    await pool.execute("DELETE FROM project_members WHERE project_id = $1", project_id)
    await pool.execute("DELETE FROM projects WHERE id = $1", project_id)


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
    user: Annotated[UserContext, Depends(require_approved_role("ADMIN", "MANAGER"))],
):
    """Assign a developer to a project (approved MANAGER or ADMIN)."""

    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    if user.role == "MANAGER" and str(project["organization_id"]) != user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project does not belong to your organization",
        )

    dev = await pool.fetchrow(
        "SELECT id, role FROM users WHERE id = $1 AND is_active = TRUE", body.user_id
    )
    if not dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    try:
        await pool.execute(
            "INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)",
            project_id,
            body.user_id,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Developer already assigned to this project",
        )

    return {"project_id": project_id, "user_id": body.user_id, "status": "assigned"}


@router.delete("/projects/{project_id}/developers/{user_id}")
async def remove_developer(
    project_id: str,
    user_id: str,
    user: Annotated[UserContext, Depends(require_approved_role("ADMIN", "MANAGER"))],
):
    """Remove a developer from a project (approved MANAGER or ADMIN)."""

    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    if user.role == "MANAGER" and str(project["organization_id"]) != user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project does not belong to your organization",
        )

    result = await pool.execute(
        "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
        project_id,
        user_id,
    )
    if result == "DELETE 0":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Developer not found in this project",
        )

    return {"project_id": project_id, "user_id": user_id, "status": "removed"}


@router.get("/projects/{project_id}/api-keys")
async def list_project_api_keys(
    project_id: str,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """List API keys for a project.

    - ADMIN / MANAGER: sees all keys for the project
    - DEVELOPER: sees only keys assigned to them
    """
    pool = get_pool()
    await _get_project_or_404(pool, project_id)

    if user.role == "DEVELOPER":
        # Developer sees only keys assigned to them
        rows = await pool.fetch(
            """SELECT ak.id, ak.label, ak.is_active, ak.created_by, ak.assigned_to,
                      ak.created_at, u.full_name AS assigned_to_name, u.email AS assigned_to_email
               FROM api_keys ak
               LEFT JOIN users u ON u.id = ak.assigned_to
               WHERE ak.project_id = $1 AND ak.assigned_to = $2
               ORDER BY ak.created_at DESC""",
            project_id, user.id,
        )
    else:
        rows = await pool.fetch(
            """SELECT ak.id, ak.label, ak.is_active, ak.created_by, ak.assigned_to,
                      ak.created_at, u.full_name AS assigned_to_name, u.email AS assigned_to_email
               FROM api_keys ak
               LEFT JOIN users u ON u.id = ak.assigned_to
               WHERE ak.project_id = $1
               ORDER BY ak.created_at DESC""",
            project_id,
        )

    return [
        {
            "id": str(r["id"]),
            "label": r["label"],
            "key_masked": "••••••••••••••••••••••••••••••••",
            "is_active": r["is_active"],
            "created_by": str(r["created_by"]) if r["created_by"] else None,
            "assigned_to": str(r["assigned_to"]) if r["assigned_to"] else None,
            "assigned_to_name": r["assigned_to_name"],
            "assigned_to_email": r["assigned_to_email"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


@router.post("/projects/{project_id}/api-keys", status_code=status.HTTP_201_CREATED)
async def generate_api_key(
    project_id: str,
    body: GenerateApiKey,
    user: Annotated[UserContext, Depends(require_approved_role("ADMIN", "MANAGER"))],
):
    """Generate an API key for a project (approved MANAGER or ADMIN).

    Returns the plain key once. Only the hash is stored.
    """

    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    if user.role == "MANAGER" and str(project["organization_id"]) != user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project does not belong to your organization",
        )

    # Validate assigned_to developer is a project member
    if body.assigned_to:
        member = await pool.fetchrow(
            """SELECT pm.user_id FROM project_members pm
               JOIN users u ON u.id = pm.user_id
               WHERE pm.project_id = $1 AND pm.user_id = $2 AND u.is_active = TRUE""",
            project_id, body.assigned_to,
        )
        if not member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Developer is not a member of this project",
            )

    plain_key = "th_" + secrets.token_hex(32)
    key_hash = hashlib.sha256(plain_key.encode()).hexdigest()

    row = await pool.fetchrow(
        """INSERT INTO api_keys (project_id, key_hash, label, created_by, assigned_to)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, created_at""",
        project_id,
        key_hash,
        body.label,
        user.id,
        body.assigned_to,
    )

    return {
        "id": str(row["id"]),
        "project_id": project_id,
        "api_key": plain_key,
        "label": body.label,
        "assigned_to": body.assigned_to,
        "created_at": row["created_at"].isoformat(),
        "message": "Store this API key securely. It will not be shown again.",
    }


@router.get("/projects/{project_id}/logs")
async def get_project_logs(
    project_id: str,
    user: Annotated[UserContext, Depends(get_current_user)],
    level: str | None = None,
    search: str | None = None,
    limit: int = 100,
    offset: int = 0,
):
    """Get logs for a project with optional level filter and search."""
    pool = get_pool()
    await _get_project_or_404(pool, project_id)

    conditions = ["project_id = $1"]
    params: list = [project_id]
    idx = 2

    if level and level != "ALL":
        conditions.append(f"level = ${idx}::log_level")
        params.append(level)
        idx += 1

    if search:
        conditions.append(f"(message ILIKE ${idx} OR service ILIKE ${idx} OR error_type ILIKE ${idx})")
        params.append(f"%{search}%")
        idx += 1

    where_clause = " AND ".join(conditions)
    params.extend([limit, offset])

    rows = await pool.fetch(
        f"""SELECT id, module, level, message, timestamp, service, environment,
                  host, error_type, stack_trace, trace_id, extra, ingested_at
           FROM logs
           WHERE {where_clause}
           ORDER BY timestamp DESC
           LIMIT ${idx} OFFSET ${idx + 1}""",
        *params,
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
            "host": r["host"],
            "error_type": r["error_type"],
            "stack_trace": r["stack_trace"],
            "trace_id": r["trace_id"],
            "extra": dict(r["extra"]) if r["extra"] else None,
            "ingested_at": r["ingested_at"].isoformat(),
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Project approval (ADMIN only)
# ---------------------------------------------------------------------------

class UpdateProjectStatus(BaseModel):
    status: str  # "APPROVED" or "REJECTED"


@router.patch("/projects/{project_id}/status")
async def update_project_status(
    project_id: str,
    body: UpdateProjectStatus,
    user: Annotated[UserContext, Depends(require_role("ADMIN"))],
):
    """Approve or reject a pending project (ADMIN only)."""
    if body.status not in ("APPROVED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be APPROVED or REJECTED",
        )

    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    if str(project["organization_id"]) != user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project does not belong to your organization",
        )

    await pool.execute(
        "UPDATE projects SET status = $1 WHERE id = $2",
        body.status,
        project_id,
    )

    return {
        "id": str(project["id"]),
        "name": project["name"],
        "status": body.status,
    }


# ---------------------------------------------------------------------------
# Developer search (for managers to find and invite developers)
# ---------------------------------------------------------------------------

@router.get("/developers/search")
async def search_developers(
    user: Annotated[UserContext, Depends(require_approved_role("ADMIN", "MANAGER"))],
    q: str = Query(default="", description="Search by name or skill"),
):
    """Search developers by name or skills. Returns developers not already in
    the manager's organization who are available for invitation."""
    pool = get_pool()
    query = q.strip()

    if not query:
        rows = await pool.fetch(
            """SELECT u.id, u.email, u.full_name, u.skills, u.created_at
               FROM users u
               WHERE u.role = 'DEVELOPER' AND u.is_active = TRUE
               ORDER BY u.full_name
               LIMIT 50""",
        )
    else:
        rows = await pool.fetch(
            """SELECT u.id, u.email, u.full_name, u.skills, u.created_at
               FROM users u
               WHERE u.role = 'DEVELOPER'
                 AND u.is_active = TRUE
                 AND (
                   u.full_name ILIKE $1
                   OR u.email ILIKE $1
                   OR EXISTS (
                     SELECT 1 FROM unnest(u.skills) AS s
                     WHERE s ILIKE $1
                   )
                 )
               ORDER BY u.full_name
               LIMIT 50""",
            f"%{query}%",
        )

    return [
        {
            "id": str(r["id"]),
            "email": r["email"],
            "full_name": r["full_name"],
            "skills": list(r["skills"]) if r["skills"] else [],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]


# ---------------------------------------------------------------------------
# Project invitation (Manager invites Developer)
# ---------------------------------------------------------------------------

class InviteDeveloper(BaseModel):
    user_id: str


@router.post("/projects/{project_id}/invite", status_code=status.HTTP_201_CREATED)
async def invite_developer_to_project(
    project_id: str,
    body: InviteDeveloper,
    user: Annotated[UserContext, Depends(require_approved_role("ADMIN", "MANAGER"))],
):
    """Send a project invitation to a developer. Creates a PROJECT_INVITE join request."""
    pool = get_pool()
    project = await _get_project_or_404(pool, project_id)

    if user.role == "MANAGER" and str(project["organization_id"]) != user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Project does not belong to your organization",
        )

    # Check the developer exists and is a DEVELOPER
    dev = await pool.fetchrow(
        "SELECT id, role FROM users WHERE id = $1 AND is_active = TRUE",
        body.user_id,
    )
    if not dev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Developer not found")
    if dev["role"] != "DEVELOPER":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not a developer",
        )

    # Check if already a project member
    existing_member = await pool.fetchrow(
        "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
        project_id, body.user_id,
    )
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Developer is already a member of this project",
        )

    # Check for existing pending invitation
    existing_invite = await pool.fetchrow(
        """SELECT id FROM join_requests
           WHERE user_id = $1 AND project_id = $2
             AND request_type = 'PROJECT_INVITE' AND status = 'PENDING'""",
        body.user_id, project_id,
    )
    if existing_invite:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An invitation is already pending for this developer",
        )

    row = await pool.fetchrow(
        """INSERT INTO join_requests
               (user_id, project_id, organization_id, request_type, status, invited_by)
           VALUES ($1, $2, $3, 'PROJECT_INVITE', 'PENDING', $4)
           RETURNING id, requested_at""",
        body.user_id,
        project_id,
        str(project["organization_id"]) if project["organization_id"] else None,
        user.id,
    )

    return {
        "id": str(row["id"]),
        "user_id": body.user_id,
        "project_id": project_id,
        "status": "PENDING",
        "requested_at": row["requested_at"].isoformat(),
    }
