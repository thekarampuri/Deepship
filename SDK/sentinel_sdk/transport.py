"""HTTP transport with exponential backoff retry and dead-letter queue."""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

import httpx

from sentinel_sdk.models import LogEntry
from sentinel_sdk.serializer import serialize


class DeadLetterQueue:
    """Persists failed batches to local disk so they can be replayed later."""

    def __init__(self, path: str = "~/.sentinel/dlq") -> None:
        self._dir = Path(os.path.expanduser(path))
        self._dir.mkdir(parents=True, exist_ok=True)

    def save(self, batch: List[LogEntry]) -> None:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
        filepath = self._dir / f"failed_{ts}.jsonl"
        with open(filepath, "a", encoding="utf-8") as f:
            for entry in batch:
                f.write(json.dumps(entry.to_dict()) + "\n")

    def pending_files(self) -> list[Path]:
        return sorted(self._dir.glob("failed_*.jsonl"))

    def remove(self, filepath: Path) -> None:
        filepath.unlink(missing_ok=True)


class HttpTransport:
    """Sends compressed log batches to the ingestion API.

    - Retries with exponential backoff on 5xx / timeout / network errors.
    - Never raises exceptions to the caller — failures are sent to DLQ.
    """

    def __init__(
        self,
        endpoint: str,
        api_key: str,
        *,
        timeout: float = 10.0,
        max_retries: int = 3,
        compress: bool = True,
        dlq_path: str = "~/.sentinel/dlq",
    ) -> None:
        self._url = f"{endpoint.rstrip('/')}/api/v1/ingest"
        self._api_key = api_key
        self._timeout = timeout
        self._max_retries = max_retries
        self._compress = compress
        self._dlq = DeadLetterQueue(dlq_path)
        self._client = httpx.Client(timeout=self._timeout)

    # -- public API ---------------------------------------------------------

    def send(self, batch: List[LogEntry]) -> bool:
        """Send a batch; return True on success, False if sent to DLQ."""
        body = serialize(batch, compress=self._compress)
        headers = {
            "X-API-Key": self._api_key,
            "Content-Type": "application/json",
        }
        if self._compress:
            headers["Content-Encoding"] = "gzip"

        for attempt in range(1, self._max_retries + 1):
            try:
                resp = self._client.post(self._url, content=body, headers=headers)
                if resp.status_code in (200, 202):
                    return True
                if resp.status_code < 500:
                    # Client error (4xx) — retrying won't help.
                    print(
                        f"[sentinel-sdk] ingestion rejected ({resp.status_code}): "
                        f"{resp.text[:200]}",
                        file=sys.stderr,
                    )
                    self._dlq.save(batch)
                    return False
            except (httpx.TransportError, httpx.TimeoutException):
                pass

            if attempt < self._max_retries:
                time.sleep(2**attempt)

        # All retries exhausted — persist to dead-letter queue.
        print(
            f"[sentinel-sdk] all {self._max_retries} retries failed, "
            "saving batch to dead-letter queue",
            file=sys.stderr,
        )
        self._dlq.save(batch)
        return False

    def replay_dlq(self) -> None:
        """Attempt to re-send any batches saved in the dead-letter queue."""
        for filepath in self._dlq.pending_files():
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                payload = json.dumps(
                    [json.loads(line) for line in lines]
                ).encode("utf-8")
                if self._compress:
                    import gzip

                    payload = gzip.compress(payload)

                headers = {
                    "X-API-Key": self._api_key,
                    "Content-Type": "application/json",
                }
                if self._compress:
                    headers["Content-Encoding"] = "gzip"

                resp = self._client.post(self._url, content=payload, headers=headers)
                if resp.status_code in (200, 202):
                    self._dlq.remove(filepath)
            except Exception:
                # Best-effort replay — skip on any error and try next file.
                continue

    def close(self) -> None:
        self._client.close()
