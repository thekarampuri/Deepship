"""Log search and retrieval with RBAC scoping."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from uuid import UUID

import asyncpg

from app.dependencies import UserContext
from app.logs.schemas import LogListResponse, LogOut, LogSearchParams


async def search_logs(
    pool: asyncpg.Pool,
    params: LogSearchParams,
    user: UserContext,
) -> LogListResponse:
    """Build a dynamic query with filters, full-text search, and RBAC."""
    conditions: list[str] = ["project_id = $1"]
    args: list = [params.project_id]
    idx = 2  # next parameter index

    # RBAC scoping
    _add_rbac_conditions(conditions, args, user, idx_ref := [idx])
    idx = idx_ref[0]

    # Filters
    if params.level:
        conditions.append(f"level = ${idx}::log_level")
        args.append(params.level.value)
        idx += 1
    if params.service:
        conditions.append(f"service = ${idx}")
        args.append(params.service)
        idx += 1
    if params.module:
        conditions.append(f"module = ${idx}")
        args.append(params.module)
        idx += 1
    if params.environment:
        conditions.append(f"environment = ${idx}")
        args.append(params.environment)
        idx += 1
    if params.trace_id:
        conditions.append(f"trace_id = ${idx}")
        args.append(params.trace_id)
        idx += 1
    if params.from_ts:
        conditions.append(f"timestamp >= ${idx}")
        args.append(params.from_ts)
        idx += 1
    if params.to_ts:
        conditions.append(f"timestamp < ${idx}")
        args.append(params.to_ts)
        idx += 1

    # Full-text / ILIKE search
    if params.q:
        if len(params.q) < 3:
            conditions.append(f"message ILIKE ${idx}")
            args.append(f"%{params.q}%")
        else:
            conditions.append(f"search_vector @@ plainto_tsquery('english', ${idx})")
            args.append(params.q)
        idx += 1

    where = " AND ".join(conditions)
    offset = (params.page - 1) * params.per_page

    # Count query
    count_sql = f"SELECT COUNT(*) FROM logs WHERE {where}"
    total = await pool.fetchval(count_sql, *args)

    # Data query
    data_sql = f"""
        SELECT id, project_id, module, level, message, timestamp,
               service, environment, host, pid, thread_id,
               sdk_version, trace_id, stack_trace, error_type,
               extra, ingested_at
        FROM logs
        WHERE {where}
        ORDER BY timestamp DESC
        LIMIT {params.per_page} OFFSET {offset}
    """
    rows = await pool.fetch(data_sql, *args)

    items = [_row_to_log(r) for r in rows]
    return LogListResponse(items=items, total=total, page=params.page, per_page=params.per_page)


async def get_log_by_id(
    pool: asyncpg.Pool,
    log_id: UUID,
    log_ts: datetime,
    user: UserContext,
) -> LogOut | None:
    """Fetch a single log entry (timestamp required for partition pruning)."""
    row = await pool.fetchrow(
        """
        SELECT id, project_id, module, level, message, timestamp,
               service, environment, host, pid, thread_id,
               sdk_version, trace_id, stack_trace, error_type,
               extra, ingested_at
        FROM logs
        WHERE id = $1 AND timestamp = $2
        """,
        log_id,
        log_ts,
    )
    if not row:
        return None

    # RBAC: check user has access to this project
    project_id = str(row["project_id"])
    if user.role == "ADMIN":
        pass
    elif project_id not in user.project_ids:
        return None
    elif user.role == "DEVELOPER" and row["module"]:
        # Check module access
        mod_row = await pool.fetchrow(
            "SELECT id FROM modules WHERE project_id = $1 AND name = $2",
            row["project_id"],
            row["module"],
        )
        if mod_row and str(mod_row["id"]) not in user.module_ids:
            return None

    return _row_to_log(row)


def _add_rbac_conditions(conditions, args, user, idx_ref):
    """Append RBAC WHERE clauses based on user role."""
    idx = idx_ref[0]
    if user.role == "ADMIN":
        return
    if user.role == "DEVELOPER" and user.module_ids:
        conditions.append(
            f"(module IS NULL OR module IN (SELECT name FROM modules WHERE id = ANY(${idx}::uuid[])))"
        )
        args.append(user.module_ids)
        idx += 1
    idx_ref[0] = idx


def _row_to_log(row: asyncpg.Record) -> LogOut:
    extra = row["extra"]
    if isinstance(extra, str):
        extra = json.loads(extra)
    return LogOut(
        id=row["id"],
        project_id=row["project_id"],
        module=row["module"],
        level=row["level"],
        message=row["message"],
        timestamp=row["timestamp"],
        service=row["service"],
        environment=row["environment"],
        host=row["host"],
        pid=row["pid"],
        thread_id=row["thread_id"],
        sdk_version=row["sdk_version"],
        trace_id=row["trace_id"],
        stack_trace=row["stack_trace"],
        error_type=row["error_type"],
        extra=extra or {},
        ingested_at=row["ingested_at"],
    )
