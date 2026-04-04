"""Stats response models."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_logs: int
    total_errors: int
    open_issues: int
    active_services: int


class SeverityCount(BaseModel):
    level: str
    count: int


class SeverityBreakdown(BaseModel):
    items: list[SeverityCount]


class TimelinePoint(BaseModel):
    bucket: datetime
    count: int


class TimelineResponse(BaseModel):
    points: list[TimelinePoint]
    granularity: str
