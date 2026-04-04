"""Stats endpoints for the dashboard."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.database import get_pool
from app.dependencies import UserContext, get_current_user
from app.stats.schemas import OverviewStats, SeverityBreakdown, TimelineResponse
from app.stats.service import get_overview, get_severity_breakdown, get_timeline

router = APIRouter()


def _check_project_access(user: UserContext, project_id: UUID):
    if user.role != "ADMIN" and str(project_id) not in user.project_ids:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No access to this project")


@router.get("/stats/overview", response_model=OverviewStats)
async def overview(
    project_id: UUID,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    _check_project_access(user, project_id)
    return await get_overview(get_pool(), project_id)


@router.get("/stats/severity", response_model=SeverityBreakdown)
async def severity(
    project_id: UUID,
    user: Annotated[UserContext, Depends(get_current_user)],
    from_ts: datetime | None = Query(default=None, alias="from"),
    to_ts: datetime | None = Query(default=None, alias="to"),
):
    _check_project_access(user, project_id)
    return await get_severity_breakdown(get_pool(), project_id, from_ts, to_ts)


@router.get("/stats/timeline", response_model=TimelineResponse)
async def timeline(
    project_id: UUID,
    user: Annotated[UserContext, Depends(get_current_user)],
    from_ts: datetime | None = Query(default=None, alias="from"),
    to_ts: datetime | None = Query(default=None, alias="to"),
    granularity: str = Query(default="day"),
):
    _check_project_access(user, project_id)
    return await get_timeline(get_pool(), project_id, from_ts, to_ts, granularity)
