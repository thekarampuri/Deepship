"""Issue listing, detail, status update, and assignment."""

from __future__ import annotations

from uuid import UUID

import asyncpg

from app.dependencies import UserContext
from app.issues.schemas import (
    IssueAssign,
    IssueListParams,
    IssueListResponse,
    IssueOut,
    IssueUpdate,
    UserSummary,
)


async def list_issues(
    pool: asyncpg.Pool,
    params: IssueListParams,
    user: UserContext,
) -> IssueListResponse:
    conditions = ["project_id = $1"]
    args: list = [params.project_id]
    idx = 2

    if params.status:
        conditions.append(f"status = ${idx}::issue_status")
        args.append(params.status.value)
        idx += 1
    if params.level:
        conditions.append(f"level = ${idx}::log_level")
        args.append(params.level)
        idx += 1

    where = " AND ".join(conditions)
    offset = (params.page - 1) * params.per_page

    total = await pool.fetchval(f"SELECT COUNT(*) FROM issues WHERE {where}", *args)
    rows = await pool.fetch(
        f"""
        SELECT id, project_id, title, fingerprint, status, level,
               first_seen, last_seen, event_count, sample_stack,
               created_at, updated_at
        FROM issues WHERE {where}
        ORDER BY last_seen DESC
        LIMIT {params.per_page} OFFSET {offset}
        """,
        *args,
    )

    items = []
    for r in rows:
        assignees = await _get_assignees(pool, r["id"])
        items.append(_row_to_issue(r, assignees))

    return IssueListResponse(items=items, total=total, page=params.page, per_page=params.per_page)


async def get_issue(
    pool: asyncpg.Pool,
    issue_id: UUID,
    user: UserContext,
) -> IssueOut | None:
    row = await pool.fetchrow(
        """
        SELECT id, project_id, title, fingerprint, status, level,
               first_seen, last_seen, event_count, sample_stack,
               created_at, updated_at
        FROM issues WHERE id = $1
        """,
        issue_id,
    )
    if not row:
        return None
    if user.role != "ADMIN" and str(row["project_id"]) not in user.project_ids:
        return None
    assignees = await _get_assignees(pool, issue_id)
    return _row_to_issue(row, assignees)


async def update_issue_status(
    pool: asyncpg.Pool,
    issue_id: UUID,
    update: IssueUpdate,
) -> bool:
    result = await pool.execute(
        "UPDATE issues SET status = $1::issue_status, updated_at = NOW() WHERE id = $2",
        update.status.value,
        issue_id,
    )
    return result == "UPDATE 1"


async def assign_issue(
    pool: asyncpg.Pool,
    issue_id: UUID,
    assign: IssueAssign,
    assigned_by: str,
) -> bool:
    await pool.execute(
        """
        INSERT INTO issue_assignments (issue_id, assigned_to, assigned_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (issue_id, assigned_to) DO NOTHING
        """,
        issue_id,
        assign.user_id,
        UUID(assigned_by),
    )
    return True


async def _get_assignees(pool: asyncpg.Pool, issue_id: UUID) -> list[UserSummary]:
    rows = await pool.fetch(
        """
        SELECT u.id, u.email, u.full_name
        FROM issue_assignments ia
        JOIN users u ON u.id = ia.assigned_to
        WHERE ia.issue_id = $1
        """,
        issue_id,
    )
    return [UserSummary(id=r["id"], email=r["email"], full_name=r["full_name"]) for r in rows]


def _row_to_issue(row: asyncpg.Record, assignees: list[UserSummary]) -> IssueOut:
    return IssueOut(
        id=row["id"],
        project_id=row["project_id"],
        title=row["title"],
        fingerprint=row["fingerprint"],
        status=row["status"],
        level=row["level"],
        first_seen=row["first_seen"],
        last_seen=row["last_seen"],
        event_count=row["event_count"],
        sample_stack=row["sample_stack"],
        assignees=assignees,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )
