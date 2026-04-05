"""Join request endpoints: list and approve/reject.

Flows:
  ORG join:
    - MANAGER signs up and selects an organization => join request (type=ORG) is auto-created
    - ADMIN sees pending ORG requests on their dashboard
    - ADMIN approves => MANAGER gets organization_id set, can now create projects

  PROJECT_INVITE:
    - MANAGER searches developers and sends invitation (type=PROJECT_INVITE)
    - DEVELOPER sees the invitation on their dashboard
    - DEVELOPER accepts => added to project_members
    - DEVELOPER rejects => invitation is marked REJECTED
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.database import get_pool
from app.dependencies import UserContext, get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class UpdateJoinRequest(BaseModel):
    status: str  # "APPROVED" or "REJECTED"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/join-requests")
async def list_join_requests(
    user: Annotated[UserContext, Depends(get_current_user)],
    request_type: str | None = Query(default=None, description="Filter by ORG or PROJECT"),
    req_status: str | None = Query(default=None, alias="status", description="Filter by PENDING, APPROVED, REJECTED"),
):
    """List join requests.

    - ADMIN: sees ORG join requests for their organization
    - MANAGER: sees PROJECT join requests for their org's projects
    - DEVELOPER: sees their own requests
    """
    pool = get_pool()

    conditions = []
    params: list = []
    idx = 1

    if user.role == "ADMIN":
        # ADMIN sees requests to join THEIR organization
        if not user.organization_id:
            return []
        conditions.append(f"jr.organization_id = ${idx}")
        params.append(user.organization_id)
        idx += 1
    elif user.role == "MANAGER":
        # MANAGER sees project join requests for projects in their org
        if not user.organization_id:
            return []
        conditions.append(f"jr.organization_id = ${idx}")
        params.append(user.organization_id)
        idx += 1
        # Managers only see PROJECT-type requests (not ORG requests — that's admin's job)
        conditions.append("jr.request_type = 'PROJECT'")
    else:
        # DEVELOPER sees their own requests
        conditions.append(f"jr.user_id = ${idx}")
        params.append(user.id)
        idx += 1

    if request_type:
        conditions.append(f"jr.request_type = ${idx}")
        params.append(request_type)
        idx += 1

    if req_status:
        conditions.append(f"jr.status = ${idx}::join_request_status")
        params.append(req_status)
        idx += 1

    where = " AND ".join(conditions) if conditions else "TRUE"

    rows = await pool.fetch(
        f"""SELECT jr.id, jr.user_id, jr.project_id, jr.organization_id,
                   jr.request_type, jr.status, jr.requested_at, jr.resolved_at,
                   jr.resolved_by, jr.invited_by,
                   u.full_name AS user_name, u.email AS user_email, u.role AS user_role,
                   p.name AS project_name,
                   o.name AS organization_name,
                   inv.full_name AS invited_by_name
            FROM join_requests jr
            JOIN users u ON u.id = jr.user_id
            LEFT JOIN projects p ON p.id = jr.project_id
            LEFT JOIN organizations o ON o.id = jr.organization_id
            LEFT JOIN users inv ON inv.id = jr.invited_by
            WHERE {where}
            ORDER BY jr.requested_at DESC""",
        *params,
    )

    return [
        {
            "id": str(r["id"]),
            "user_id": str(r["user_id"]),
            "user_name": r["user_name"],
            "user_email": r["user_email"],
            "user_role": r["user_role"],
            "project_id": str(r["project_id"]) if r["project_id"] else None,
            "project_name": r["project_name"],
            "organization_id": str(r["organization_id"]) if r["organization_id"] else None,
            "organization_name": r["organization_name"],
            "request_type": r["request_type"],
            "status": r["status"],
            "requested_at": r["requested_at"].isoformat(),
            "resolved_at": r["resolved_at"].isoformat() if r["resolved_at"] else None,
            "resolved_by": str(r["resolved_by"]) if r["resolved_by"] else None,
            "invited_by": str(r["invited_by"]) if r["invited_by"] else None,
            "invited_by_name": r["invited_by_name"],
        }
        for r in rows
    ]


@router.patch("/join-requests/{request_id}")
async def update_join_request(
    request_id: str,
    body: UpdateJoinRequest,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Approve or reject a join request.

    - ORG requests: only the ADMIN of that organization can approve/reject
    - PROJECT requests: MANAGER or ADMIN of that organization can approve/reject
    """
    if body.status not in ("APPROVED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be APPROVED or REJECTED",
        )

    pool = get_pool()

    # Fetch the join request
    jr = await pool.fetchrow(
        """SELECT jr.id, jr.user_id, jr.project_id, jr.organization_id,
                  jr.request_type, jr.status
           FROM join_requests jr
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

    # ── Permission checks ──────────────────────────────────────────────
    if jr["request_type"] == "ORG":
        # Only ADMIN of that organization can approve ORG join requests
        if user.role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the organization admin can approve/reject organization join requests",
            )
        if user.organization_id != str(jr["organization_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This request is for a different organization",
            )
    elif jr["request_type"] == "PROJECT_INVITE":
        # PROJECT_INVITE: only the invited developer can accept/reject
        if user.id != str(jr["user_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the invited developer can accept or decline this invitation",
            )
    else:
        # PROJECT join requests — MANAGER or ADMIN of same org
        if user.role not in ("MANAGER", "ADMIN"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only managers and admins can approve/reject project join requests",
            )
        if user.organization_id != str(jr["organization_id"]):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage requests for projects in your organization",
            )

    now = datetime.now(timezone.utc)

    # Update join request status
    await pool.execute(
        """UPDATE join_requests
           SET status = $1::join_request_status, resolved_at = $2, resolved_by = $3
           WHERE id = $4""",
        body.status,
        now,
        user.id,
        request_id,
    )

    # ── On approval: perform the actual action ─────────────────────────
    if body.status == "APPROVED":
        if jr["request_type"] == "ORG":
            # Set the MANAGER's organization_id (they can now create projects)
            await pool.execute(
                "UPDATE users SET organization_id = $1, updated_at = NOW() WHERE id = $2",
                str(jr["organization_id"]),
                str(jr["user_id"]),
            )
        elif jr["request_type"] in ("PROJECT", "PROJECT_INVITE"):
            # Add developer to project_members
            await pool.execute(
                """INSERT INTO project_members (project_id, user_id)
                   VALUES ($1, $2)
                   ON CONFLICT DO NOTHING""",
                str(jr["project_id"]),
                str(jr["user_id"]),
            )

    return {
        "id": str(jr["id"]),
        "request_type": jr["request_type"],
        "status": body.status,
        "resolved_at": now.isoformat(),
        "resolved_by": user.id,
    }
