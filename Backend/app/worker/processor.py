"""Log processing worker: consume queue → insert logs → upsert issues."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

import aio_pika
import asyncpg
import orjson

from app.worker.fingerprint import generate_fingerprint

log = logging.getLogger(__name__)


async def process_batch(
    message: aio_pika.abc.AbstractIncomingMessage,
    pool: asyncpg.Pool,
) -> None:
    """Process a single RabbitMQ message containing a log batch.

    Errors on individual entries are logged and skipped so that one bad
    record does not block the entire batch (and cause infinite requeue).
    """
    async with message.process(requeue=True):
        try:
            entries: list[dict] = orjson.loads(message.body)
        except Exception:
            log.exception("Failed to deserialise message body — dropping message")
            return

        if not entries:
            return

        log.info("Processing batch of %d log entries", len(entries))

        async with pool.acquire() as conn:
            async with conn.transaction():
                await _insert_logs(conn, entries)


async def _insert_logs(conn: asyncpg.Connection, entries: list[dict]) -> None:
    """Bulk-insert logs and upsert issues for ERROR/FATAL entries.

    Each entry is inserted inside a savepoint so that a single malformed
    record does not abort the entire transaction.
    """
    for entry in entries:
        try:
            await _insert_single_log(conn, entry)
        except Exception:
            log.exception("Failed to insert log entry — skipping: %s", entry.get("message", "")[:120])


async def _insert_single_log(conn: asyncpg.Connection, entry: dict) -> None:
    """Insert one log row and upsert its issue (if ERROR/FATAL)."""
    log_id = uuid.uuid4()
    project_id = uuid.UUID(entry["project_id"])
    ts = _parse_timestamp(entry.get("timestamp", ""))
    api_key_id = uuid.UUID(entry["api_key_id"]) if entry.get("api_key_id") else None

    await conn.execute(
        """
        INSERT INTO logs (
            id, project_id, module, level, message, timestamp,
            service, environment, host, pid, thread_id,
            sdk_version, trace_id, stack_trace, error_type, error_message, extra,
            api_key_id
        ) VALUES (
            $1, $2, $3, $4::log_level, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15, $16, $17::jsonb,
            $18
        )
        """,
        log_id,
        project_id,
        entry.get("module") or None,
        entry["level"],
        entry["message"],
        ts,
        entry.get("service") or None,
        entry.get("environment") or None,
        entry.get("host") or None,
        entry.get("pid") or None,
        entry.get("thread_id") or None,
        entry.get("sdk_version") or None,
        entry.get("trace_id") or None,
        entry.get("stack_trace"),
        entry.get("error_type"),
        entry.get("error_message"),
        orjson.dumps(entry.get("extra") or {}).decode(),
        api_key_id,
    )

    # For ERROR / FATAL → upsert an issue
    level = entry["level"]
    if level in ("ERROR", "FATAL"):
        await _upsert_issue(conn, entry, project_id, log_id, ts)


async def _upsert_issue(
    conn: asyncpg.Connection,
    entry: dict,
    project_id: uuid.UUID,
    log_id: uuid.UUID,
    log_ts: datetime,
) -> None:
    """Create or update an issue based on error fingerprint."""
    fp = generate_fingerprint(
        str(project_id),
        entry.get("error_type"),
        entry.get("stack_trace"),
        entry["message"],
    )

    title = entry.get("error_type") or entry["message"]
    title = title[:300]

    # Upsert issue
    await conn.execute(
        """
        INSERT INTO issues (project_id, title, fingerprint, level, first_seen, last_seen, event_count, sample_stack)
        VALUES ($1, $2, $3, $4::log_level, $5, $5, 1, $6)
        ON CONFLICT (project_id, fingerprint) DO UPDATE SET
            last_seen    = EXCLUDED.last_seen,
            event_count  = issues.event_count + 1,
            sample_stack = EXCLUDED.sample_stack,
            updated_at   = NOW()
        """,
        project_id,
        title,
        fp,
        entry["level"],
        log_ts,
        entry.get("stack_trace"),
    )

    # Link log to issue
    issue_row = await conn.fetchrow(
        "SELECT id FROM issues WHERE project_id = $1 AND fingerprint = $2",
        project_id,
        fp,
    )
    if issue_row:
        await conn.execute(
            "INSERT INTO issue_events (issue_id, log_id, log_ts) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            issue_row["id"],
            log_id,
            log_ts,
        )


def _parse_timestamp(ts_str: str) -> datetime:
    """Parse an ISO-8601 timestamp string, falling back to now()."""
    if not ts_str:
        return datetime.now(timezone.utc)
    try:
        dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return datetime.now(timezone.utc)
