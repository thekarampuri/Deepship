"""Tests for sentinel_sdk.models."""

from sentinel_sdk.models import LogEntry, LogLevel


class TestLogLevel:
    def test_values(self):
        assert LogLevel.DEBUG == "DEBUG"
        assert LogLevel.INFO == "INFO"
        assert LogLevel.WARN == "WARN"
        assert LogLevel.ERROR == "ERROR"
        assert LogLevel.FATAL == "FATAL"

    def test_is_string_enum(self):
        assert isinstance(LogLevel.DEBUG, str)
        assert LogLevel.ERROR.value == "ERROR"


class TestLogEntry:
    def test_minimal_entry(self):
        entry = LogEntry(level=LogLevel.INFO, message="hello")
        assert entry.level == LogLevel.INFO
        assert entry.message == "hello"
        assert entry.module == ""
        assert entry.stack_trace is None
        assert entry.error_type is None
        assert entry.extra == {}

    def test_to_dict_minimal(self):
        entry = LogEntry(
            level=LogLevel.INFO,
            message="hello",
            timestamp="2026-04-05T10:00:00.000+00:00",
            service="test-svc",
            environment="test",
            host="localhost",
            pid=1234,
            thread_id="main",
            sdk_version="1.0.0",
        )
        d = entry.to_dict()
        assert d["level"] == "INFO"
        assert d["message"] == "hello"
        assert d["service"] == "test-svc"
        assert d["environment"] == "test"
        assert d["host"] == "localhost"
        assert d["pid"] == 1234
        assert "trace_id" not in d
        assert "module" not in d
        assert "stack_trace" not in d
        assert "error_type" not in d
        assert "extra" not in d

    def test_to_dict_full(self):
        entry = LogEntry(
            level=LogLevel.ERROR,
            message="fail",
            timestamp="2026-04-05T10:00:00.000+00:00",
            service="svc",
            environment="prod",
            host="host1",
            pid=99,
            thread_id="t1",
            sdk_version="1.0.0",
            trace_id="abc123",
            module="auth",
            stack_trace="Traceback...",
            error_type="ValueError",
            extra={"key": "val"},
        )
        d = entry.to_dict()
        assert d["trace_id"] == "abc123"
        assert d["module"] == "auth"
        assert d["stack_trace"] == "Traceback..."
        assert d["error_type"] == "ValueError"
        assert d["extra"] == {"key": "val"}
