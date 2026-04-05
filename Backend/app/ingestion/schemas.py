"""Ingestion request / response models."""

from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel


class LogLevelIn(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    FATAL = "FATAL"


class LogEntryIn(BaseModel):
    level: LogLevelIn
    message: str
    timestamp: str
    service: str = ""
    environment: str = ""
    host: str = ""
    pid: int = 0
    thread_id: str = ""
    sdk_version: str = ""
    trace_id: str = ""
    module: str = ""
    stack_trace: Optional[str] = None
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    extra: dict[str, Any] = {}


class IngestResponse(BaseModel):
    accepted: int
