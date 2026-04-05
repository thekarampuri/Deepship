"""Log query / response models."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class LogLevelOut(str, Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    FATAL = "FATAL"


class LogSearchParams(BaseModel):
    project_id: UUID
    q: Optional[str] = None
    level: Optional[LogLevelOut] = None
    service: Optional[str] = None
    module: Optional[str] = None
    environment: Optional[str] = None
    trace_id: Optional[str] = None
    from_ts: Optional[datetime] = None
    to_ts: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=50, ge=1, le=200)


class LogOut(BaseModel):
    id: UUID
    project_id: UUID
    module: Optional[str]
    level: str
    message: str
    timestamp: datetime
    service: Optional[str]
    environment: Optional[str]
    host: Optional[str]
    pid: Optional[int]
    thread_id: Optional[str]
    sdk_version: Optional[str]
    trace_id: Optional[str]
    stack_trace: Optional[str]
    error_type: Optional[str]
    error_message: Optional[str]
    extra: dict[str, Any]
    ingested_at: datetime


class LogListResponse(BaseModel):
    items: list[LogOut]
    total: int
    page: int
    per_page: int
