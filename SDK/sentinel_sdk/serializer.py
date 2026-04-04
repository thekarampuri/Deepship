"""Serialize a batch of LogEntry objects to compressed JSON bytes."""

from __future__ import annotations

import gzip
import json
from typing import List

from sentinel_sdk.models import LogEntry


def serialize(batch: List[LogEntry], compress: bool = True) -> bytes:
    """Return the batch as JSON bytes, optionally gzip-compressed."""
    payload = json.dumps([entry.to_dict() for entry in batch]).encode("utf-8")
    if compress:
        payload = gzip.compress(payload)
    return payload
