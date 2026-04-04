"""Auth endpoints: login and token refresh."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.auth.schemas import LoginRequest, RefreshRequest, TokenResponse
from app.auth.service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.database import get_pool

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, password_hash, role, is_active FROM users WHERE email = $1",
        body.email,
    )
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not row["is_active"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account deactivated")

    user_id = str(row["id"])
    return TokenResponse(
        access_token=create_access_token(user_id, row["role"]),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not a refresh token")

    user_id = payload["sub"]
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT role, is_active FROM users WHERE id = $1", user_id
    )
    if not row or not row["is_active"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    return TokenResponse(
        access_token=create_access_token(user_id, row["role"]),
        refresh_token=create_refresh_token(user_id),
    )
