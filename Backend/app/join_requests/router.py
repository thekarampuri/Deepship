"""Join request endpoints: create, list, and approve/reject."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.database import get_pool
from app.dependencies import UserContext, get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class CreateJoinRequest(BaseModel):
    project_id: str


class UpdateJoinRequest(BaseModel):
    status: str  # "APPROVED" or "REJECTED"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/join-requests", status_code=status.HTTP_201_CREATED)
async def create_join_request(
    body: CreateJoinRequest,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Developer requests to join a project."""
    if user.role != "DEVELOPER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only developers can create join requests",
        )

    pool = get_pool()

    # Verify project exists
    project = await pool.fetchrow(
        "SELECT id, organization_id FROM projects WHERE id = $1", body.project_id
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Check if already a member
    existing_member = await pool.fetchrow(
        "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
        body.project_id,
        user.id,
    )
    if existing_member:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already a member of this project")

    # Check for pending request
    pending = await pool.fetchrow(
        "SELECT id FROM join_requests WHERE user_id = $1 AND project_id = $2 AND status = 'PENDING'",
        user.id,
        body.project_id,
    )
    if pending:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A pending request already exists")

    row = await pool.fetchrow(
        """INSERT INTO join_requests (user_id, project_id, organization_id)
           VALUES ($1, $2, $3)
           RETURNING id, status, requested_at""",
        user.id,
        body.project_id,
        str(project["organization_id"]) if project["organization_id"] else None,
    )
    return {
        "id": str(row["id"]),
        "user_id": user.id,
        "project_id": body.project_id,
        "status": row["status"],
        "requested_at": row["requested_at"].isoformat(),
    }


@router.get("/join-requests")
async def list_join_requests(
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """List join requests.

    - MANAGER sees requests for projects in their organization.
    - DEVELOPER sees their own requests.
    - ADMIN sees all requests.
    """
    pool = get_pool()

    if user.role == "ADMIN":
        rows = await pool.fetch(
            """SELECT jr.id, jr.user_id, jr.project_id, jr.organization_id,
                      jr.status, jr.requested_at, jr.resolved_at, jr.resolved_by,
                      u.full_name AS user_name, u.email AS user_email,
                      p.name AS project_name
               FROM join_requests jr
               JOIN users u ON u.id = jr.user_id
               JOIN projects p ON p.id = jr.project_id
               ORDER BY jr.requested_at DESC"""
        )
    elif user.role == "MANAGER":
        rows = await pool.fetch(
            """SELECT jr.id, jr.user_id, jr.project_id, jr.organization_id,
                      jr.status, jr.requested_at, jr.resolved_at, jr.resolved_by,
                      u.full_name AS user_name, u.email AS user_email,
                      p.name AS project_name
               FROM join_requests jr
               JOIN users u ON u.id = jr.user_id
               JOIN projects p ON p.id = jr.project_id
               WHERE p.organization_id = $1
               ORDER BY jr.requested_at DESC""",
            user.organization_id,
        )
    else:
        # DEVELOPER sees own requests
        rows = await pool.fetch(
            """SELECT jr.id, jr.user_id, jr.project_id, jr.organization_id,
                      jr.status, jr.requested_at, jr.resolved_at, jr.resolved_by,
                      u.full_name AS user_name, u.email AS user_email,
                      p.name AS project_name
               FROM join_requests jr
               JOIN users u ON u.id = jr.user_id
               JOIN projects p ON p.id = jr.project_id
               WHERE jr.user_id = $1
               ORDER BY jr.requested_at DESC""",
            user.id,
        )

    return [
        {
            "id": str(r["id"]),
            "user_id": str(r["user_id"]),
            "user_name": r["user_name"],
            "user_email": r["user_email"],
            "project_id": str(r["project_id"]),
            "project_name": r["project_name"],
            "organization_id": str(r["organization_id"]) if r["organization_id"] else None,
            "status": r["status"],
            "requested_at": r["requested_at"].isoformat(),
            "resolved_at": r["resolved_at"].isoformat() if r["resolved_at"] else None,
            "resolved_by": str(r["resolved_by"]) if r["resolved_by"] else None,
        }
        for r in rows
    ]


@router.patch("/join-requests/{request_id}")
async def update_join_request(
    request_id: str,
    body: UpdateJoinRequest,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Approve or reject a join request (MANAGER only)."""
    if user.role not in ("MANAGER", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers and admins can approve/reject join requests",
        )

    if body.status not in ("APPROVED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be APPROVED or REJECTED",
        )

    pool = get_pool()

    # Fetch the join request
    jr = await pool.fetchrow(
        """SELECT jr.id, jr.user_id, jr.project_id, jr.organization_id, jr.status
           FROM join_requests jr
           JOIN projects p ON p.id = jr.project_id
           WHERE jr.id = $1""",
        request_id,
    )
    if not jr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")

    if jr["status"] != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request already {jr['status'].lower()}",
        )

    # If MANAGER, verify they belong to the same organization as the project
    if user.role == "MANAGER" and str(jr["organization_id"]) != user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage requests for projects in your organization",
        )

    now = datetime.now(timezone.utc)

    # Update join request
    await pool.execute(
        """UPDATE join_requests
           SET status = $1::join_request_status, resolved_at = $2, resolved_by = $3
           WHERE id = $4""",
        body.status,
        now,
        user.id,
        request_id,
    )

    # If approved, add user to project_members
    if body.status == "APPROVED":
        await pool.execute(
            """INSERT INTO project_members (project_id, user_id)
               VALUES ($1, $2)
               ON CONFLICT DO NOTHING""",
            str(jr["project_id"]),
            str(jr["user_id"]),
        )

    return {
        "id": str(jr["id"]),
        "status": body.status,
        "resolved_at": now.isoformat(),
        "resolved_by": user.id,
    }
