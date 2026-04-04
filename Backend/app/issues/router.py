"""Issue endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_pool
from app.dependencies import UserContext, get_current_user, require_role
from app.issues.schemas import (
    IssueAssign,
    IssueListParams,
    IssueListResponse,
    IssueOut,
    IssueStatus,
    IssueUpdate,
)
from app.issues.service import (
    assign_issue,
    get_issue,
    list_issues,
    update_issue_status,
)

router = APIRouter()


@router.get("/issues", response_model=IssueListResponse)
async def list_issues_endpoint(
    project_id: UUID,
    user: Annotated[UserContext, Depends(get_current_user)],
    issue_status: IssueStatus | None = Query(default=None, alias="status"),
    level: str | None = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=30, ge=1, le=100),
):
    if user.role != "ADMIN" and str(project_id) not in user.project_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this project")

    params = IssueListParams(
        project_id=project_id,
        status=issue_status,
        level=level,
        page=page,
        per_page=per_page,
    )
    return await list_issues(get_pool(), params, user)


@router.get("/issues/{issue_id}", response_model=IssueOut)
async def get_issue_endpoint(
    issue_id: UUID,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    result = await get_issue(get_pool(), issue_id, user)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return result


@router.patch("/issues/{issue_id}", response_model=dict)
async def update_issue_endpoint(
    issue_id: UUID,
    body: IssueUpdate,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    ok = await update_issue_status(get_pool(), issue_id, body)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return {"detail": "updated"}


@router.post("/issues/{issue_id}/assign", response_model=dict)
async def assign_issue_endpoint(
    issue_id: UUID,
    body: IssueAssign,
    user: Annotated[UserContext, Depends(require_role("ADMIN", "MANAGER"))],
):
    await assign_issue(get_pool(), issue_id, body, user.id)
    return {"detail": "assigned"}
