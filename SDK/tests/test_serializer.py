"""Tests for sentinel_sdk.serializer."""

import gzip
import json

from sentinel_sdk.models import LogEntry, LogLevel
from sentinel_sdk.serializer import serialize


def _entry(msg: str = "test") -> LogEntry:
    return LogEntry(
        level=LogLevel.INFO,
        message=msg,
        timestamp="2026-04-05T10:00:00.000+00:00",
        service="svc",
        environment="test",
        host="localhost",
        pid=1,
        thread_id="main",
        sdk_version="1.0.0",
    )


class TestSerialize:
    def test_uncompressed(self):
        batch = [_entry("a"), _entry("b")]
        data = serialize(batch, compress=False)
        parsed = json.loads(data)
        assert len(parsed) == 2
        assert parsed[0]["message"] == "a"
        assert parsed[1]["message"] == "b"

    def test_compressed(self):
        batch = [_entry("compressed")]
        data = serialize(batch, compress=True)
        decompressed = gzip.decompress(data)
        parsed = json.loads(decompressed)
        assert len(parsed) == 1
        assert parsed[0]["message"] == "compressed"

    def test_empty_batch(self):
        data = serialize([], compress=False)
        assert json.loads(data) == []

    def test_compressed_is_smaller(self):
        batch = [_entry(f"message-{i}") for i in range(100)]
        raw = serialize(batch, compress=False)
        compressed = serialize(batch, compress=True)
        assert len(compressed) < len(raw)
