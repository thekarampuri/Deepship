"""Log query endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_pool
from app.dependencies import UserContext, get_current_user
from app.logs.schemas import LogListResponse, LogOut, LogSearchParams
from app.logs.service import get_log_by_id, search_logs

router = APIRouter()


@router.get("/logs", response_model=LogListResponse)
async def list_logs(
    project_id: UUID,
    user: Annotated[UserContext, Depends(get_current_user)],
    q: str | None = None,
    level: str | None = None,
    service: str | None = None,
    module: str | None = None,
    environment: str | None = None,
    trace_id: str | None = None,
    from_ts: datetime | None = None,
    to_ts: datetime | None = None,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
):
    # Verify project access
    if user.role != "ADMIN" and str(project_id) not in user.project_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this project")

    params = LogSearchParams(
        project_id=project_id,
        q=q,
        level=level,
        service=service,
        module=module,
        environment=environment,
        trace_id=trace_id,
        from_ts=from_ts,
        to_ts=to_ts,
        page=page,
        per_page=per_page,
    )
    return await search_logs(get_pool(), params, user)


@router.get("/logs/{log_id}", response_model=LogOut)
async def get_log(
    log_id: UUID,
    timestamp: datetime,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    result = await get_log_by_id(get_pool(), log_id, timestamp, user)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    return result
