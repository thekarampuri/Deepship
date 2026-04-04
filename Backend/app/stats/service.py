"""Aggregation queries for the dashboard."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

import asyncpg

from app.stats.schemas import (
    OverviewStats,
    SeverityBreakdown,
    SeverityCount,
    TimelinePoint,
    TimelineResponse,
)


async def get_overview(pool: asyncpg.Pool, project_id: UUID) -> OverviewStats:
    row = await pool.fetchrow(
        """
        SELECT
            COUNT(*)                                             AS total_logs,
            COUNT(*) FILTER (WHERE level IN ('ERROR', 'FATAL')) AS total_errors,
            COUNT(DISTINCT service) FILTER (WHERE service IS NOT NULL) AS active_services
        FROM logs
        WHERE project_id = $1
        """,
        project_id,
    )
    open_issues = await pool.fetchval(
        "SELECT COUNT(*) FROM issues WHERE project_id = $1 AND status = 'OPEN'",
        project_id,
    )
    return OverviewStats(
        total_logs=row["total_logs"],
        total_errors=row["total_errors"],
        open_issues=open_issues,
        active_services=row["active_services"],
    )


async def get_severity_breakdown(
    pool: asyncpg.Pool,
    project_id: UUID,
    from_ts: datetime | None,
    to_ts: datetime | None,
) -> SeverityBreakdown:
    conditions = ["project_id = $1"]
    args: list = [project_id]
    idx = 2
    if from_ts:
        conditions.append(f"timestamp >= ${idx}")
        args.append(from_ts)
        idx += 1
    if to_ts:
        conditions.append(f"timestamp < ${idx}")
        args.append(to_ts)
        idx += 1

    where = " AND ".join(conditions)
    rows = await pool.fetch(
        f"SELECT level, COUNT(*) AS count FROM logs WHERE {where} GROUP BY level ORDER BY count DESC",
        *args,
    )
    return SeverityBreakdown(items=[SeverityCount(level=r["level"], count=r["count"]) for r in rows])


async def get_timeline(
    pool: asyncpg.Pool,
    project_id: UUID,
    from_ts: datetime | None,
    to_ts: datetime | None,
    granularity: str,
) -> TimelineResponse:
    valid = {"hour", "day", "week"}
    if granularity not in valid:
        granularity = "day"

    conditions = ["project_id = $1"]
    args: list = [project_id]
    idx = 2
    if from_ts:
        conditions.append(f"timestamp >= ${idx}")
        args.append(from_ts)
        idx += 1
    if to_ts:
        conditions.append(f"timestamp < ${idx}")
        args.append(to_ts)
        idx += 1

    where = " AND ".join(conditions)
    rows = await pool.fetch(
        f"""
        SELECT date_trunc('{granularity}', timestamp) AS bucket, COUNT(*) AS count
        FROM logs WHERE {where}
        GROUP BY bucket ORDER BY bucket
        """,
        *args,
    )
    points = [TimelinePoint(bucket=r["bucket"], count=r["count"]) for r in rows]
    return TimelineResponse(points=points, granularity=granularity)
