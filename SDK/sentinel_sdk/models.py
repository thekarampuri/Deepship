"""Log entry data model."""

from __future__ import annotations

import enum
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Optional


class LogLevel(str, enum.Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    FATAL = "FATAL"


@dataclass
class LogEntry:
    """Represents a single enriched log record ready for batching."""

    level: LogLevel
    message: str

    # Enriched automatically by enricher.py
    timestamp: str = ""
    service: str = ""
    environment: str = ""
    host: str = ""
    pid: int = 0
    thread_id: str = ""
    sdk_version: str = ""
    trace_id: str = ""

    # Optional fields
    module: str = ""
    stack_trace: Optional[str] = None
    error_type: Optional[str] = None
    extra: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "level": self.level.value,
            "message": self.message,
            "timestamp": self.timestamp,
            "service": self.service,
            "environment": self.environment,
            "host": self.host,
            "pid": self.pid,
            "thread_id": self.thread_id,
            "sdk_version": self.sdk_version,
        }
        if self.trace_id:
            data["trace_id"] = self.trace_id
        if self.module:
            data["module"] = self.module
        if self.stack_trace:
            data["stack_trace"] = self.stack_trace
        if self.error_type:
            data["error_type"] = self.error_type
        if self.extra:
            data["extra"] = self.extra
        return data
