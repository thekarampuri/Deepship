"""Admin CRUD models."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


# --- Users ---

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    DEVELOPER = "DEVELOPER"
    VIEWER = "VIEWER"


class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: UserRole = UserRole.DEVELOPER


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


class UserListResponse(BaseModel):
    items: list[UserOut]
    total: int


# --- Teams ---

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None


class TeamOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime


class TeamMemberAdd(BaseModel):
    user_id: UUID


# --- Projects ---

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    team_id: UUID


class ProjectOut(BaseModel):
    id: UUID
    team_id: UUID
    name: str
    description: Optional[str]
    created_at: datetime


# --- Modules ---

class ModuleCreate(BaseModel):
    name: str
    project_id: UUID


class ModuleOut(BaseModel):
    id: UUID
    project_id: UUID
    name: str


class ModuleAssignRequest(BaseModel):
    user_id: UUID


# --- API Keys ---

class ApiKeyCreate(BaseModel):
    project_id: UUID
    label: Optional[str] = None


class ApiKeyOut(BaseModel):
    id: UUID
    project_id: UUID
    label: Optional[str]
    is_active: bool
    created_at: datetime


class ApiKeyCreated(BaseModel):
    """Returned only once on creation — contains the raw key."""
    id: UUID
    project_id: UUID
    label: Optional[str]
    raw_key: str
