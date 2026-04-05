"""Ingestion helpers: decompress, parse, prepare for queue."""

from __future__ import annotations

import gzip
import orjson

from app.ingestion.schemas import LogEntryIn


def decompress_body(body: bytes, content_encoding: str | None) -> bytes:
    """Decompress gzip body if Content-Encoding header is set."""
    if content_encoding and "gzip" in content_encoding.lower():
        return gzip.decompress(body)
    return body


def parse_batch(raw: bytes) -> list[dict]:
    """Parse JSON bytes into a list of log-entry dicts."""
    data = orjson.loads(raw)
    if not isinstance(data, list):
        raise ValueError("Payload must be a JSON array")
    return data


def prepare_for_queue(entries: list[LogEntryIn], project_id: str, api_key_id: str | None = None) -> bytes:
    """Serialise validated entries + project_id + api_key_id for the RabbitMQ message."""
    payload = [
        {**entry.model_dump(mode="json"), "project_id": project_id, "api_key_id": api_key_id}
        for entry in entries
    ]
    return orjson.dumps(payload)
