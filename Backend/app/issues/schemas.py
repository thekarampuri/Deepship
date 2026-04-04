"""Issue models."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class IssueStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"


class UserSummary(BaseModel):
    id: UUID
    email: str
    full_name: str


class IssueOut(BaseModel):
    id: UUID
    project_id: UUID
    title: str
    fingerprint: str
    status: str
    level: str
    first_seen: datetime
    last_seen: datetime
    event_count: int
    sample_stack: Optional[str]
    assignees: list[UserSummary] = []
    created_at: datetime
    updated_at: datetime


class IssueListParams(BaseModel):
    project_id: UUID
    status: Optional[IssueStatus] = None
    level: Optional[str] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=30, ge=1, le=100)


class IssueListResponse(BaseModel):
    items: list[IssueOut]
    total: int
    page: int
    per_page: int


class IssueUpdate(BaseModel):
    status: IssueStatus


class IssueAssign(BaseModel):
    user_id: UUID
