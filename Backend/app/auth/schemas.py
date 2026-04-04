"""Auth request / response models."""

from __future__ import annotations

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str  # ADMIN, MANAGER, DEVELOPER
    organization_name: str | None = None   # Required for ADMIN (creates new org)
    organization_id: str | None = None     # Required for MANAGER (sends join request)


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    organization_id: str | None = None
    organization_name: str | None = None
    is_active: bool
    approval_status: str | None = None     # PENDING / APPROVED / REJECTED (for MANAGER)
