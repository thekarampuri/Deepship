"""Auth endpoints: login, signup, token refresh, and current user."""

from __future__ import annotations

import re
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from app.auth.service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.database import get_pool
from app.dependencies import UserContext, get_current_user

router = APIRouter()


def _slugify(name: str) -> str:
    """Turn an organization name into a URL-safe slug."""
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


# ── SIGNUP ─────────────────────────────────────────────────────────────────

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    pool = get_pool()

    # Validate role
    if body.role not in ("ADMIN", "MANAGER", "DEVELOPER"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be ADMIN, MANAGER, or DEVELOPER",
        )

    # Check if email already exists
    existing = await pool.fetchrow("SELECT id FROM users WHERE email = $1", body.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    password_hash = hash_password(body.password)

    # ── ADMIN signup ───────────────────────────────────────────────────
    if body.role == "ADMIN":
        if not body.organization_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="organization_name is required for ADMIN signup",
            )

        # An ADMIN can only own ONE organization (check by email domain is loose,
        # so we simply enforce: no existing org created_by this email)
        # Since user doesn't exist yet, we just create.
        slug = _slugify(body.organization_name)

        # Check if slug already taken
        slug_exists = await pool.fetchrow("SELECT 1 FROM organizations WHERE slug = $1", slug)
        if slug_exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An organization with a similar name already exists",
            )

        # Create organization (created_by set after user creation)
        org_row = await pool.fetchrow(
            """INSERT INTO organizations (name, slug, description)
               VALUES ($1, $2, $3)
               RETURNING id""",
            body.organization_name,
            slug,
            None,
        )
        organization_id = str(org_row["id"])

        # Create the ADMIN user linked to this org
        user_row = await pool.fetchrow(
            """INSERT INTO users (email, password_hash, full_name, role, organization_id)
               VALUES ($1, $2, $3, $4::user_role, $5)
               RETURNING id""",
            body.email,
            password_hash,
            body.full_name,
            body.role,
            organization_id,
        )
        user_id = str(user_row["id"])

        # Set created_by on the organization
        await pool.execute(
            "UPDATE organizations SET created_by = $1 WHERE id = $2",
            user_id,
            organization_id,
        )

        return TokenResponse(
            access_token=create_access_token(user_id, body.role),
            refresh_token=create_refresh_token(user_id),
        )

    # ── MANAGER signup ─────────────────────────────────────────────────
    elif body.role == "MANAGER":
        if not body.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="organization_id is required for MANAGER signup (pick an organization to join)",
            )

        # Verify org exists
        org_row = await pool.fetchrow(
            "SELECT id FROM organizations WHERE id = $1", body.organization_id
        )
        if not org_row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

        # Create user WITHOUT organization_id yet (pending approval)
        user_row = await pool.fetchrow(
            """INSERT INTO users (email, password_hash, full_name, role, organization_id)
               VALUES ($1, $2, $3, $4::user_role, NULL)
               RETURNING id""",
            body.email,
            password_hash,
            body.full_name,
            body.role,
        )
        user_id = str(user_row["id"])

        # Create a join request to the organization (project_id is NULL for ORG requests)
        await pool.execute(
            """INSERT INTO join_requests (user_id, project_id, organization_id, request_type, status)
               VALUES ($1, NULL, $2, 'ORG', 'PENDING')""",
            user_id,
            body.organization_id,
        )

        return TokenResponse(
            access_token=create_access_token(user_id, body.role),
            refresh_token=create_refresh_token(user_id),
        )

    # ── DEVELOPER signup ───────────────────────────────────────────────
    else:
        user_row = await pool.fetchrow(
            """INSERT INTO users (email, password_hash, full_name, role)
               VALUES ($1, $2, $3, $4::user_role)
               RETURNING id""",
            body.email,
            password_hash,
            body.full_name,
            body.role,
        )
        user_id = str(user_row["id"])

        return TokenResponse(
            access_token=create_access_token(user_id, body.role),
            refresh_token=create_refresh_token(user_id),
        )


# ── GET CURRENT USER ───────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def me(user: Annotated[UserContext, Depends(get_current_user)]):
    pool = get_pool()
    row = await pool.fetchrow(
        """SELECT u.id, u.email, u.full_name, u.role, u.organization_id, u.is_active,
                  o.name AS organization_name
           FROM users u
           LEFT JOIN organizations o ON o.id = u.organization_id
           WHERE u.id = $1""",
        user.id,
    )

    # For MANAGER: check approval status
    approval_status = None
    if row["role"] == "MANAGER":
        if row["organization_id"]:
            approval_status = "APPROVED"
        else:
            # Check if there's a pending/rejected join request
            jr = await pool.fetchrow(
                """SELECT status FROM join_requests
                   WHERE user_id = $1
                   ORDER BY requested_at DESC LIMIT 1""",
                user.id,
            )
            if jr:
                approval_status = jr["status"]  # PENDING or REJECTED
            else:
                approval_status = "NO_REQUEST"

    return UserResponse(
        id=str(row["id"]),
        email=row["email"],
        full_name=row["full_name"],
        role=row["role"],
        organization_id=str(row["organization_id"]) if row["organization_id"] else None,
        organization_name=row["organization_name"],
        is_active=row["is_active"],
        approval_status=approval_status,
    )


# ── LOGIN ──────────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    pool = get_pool()
    row = await pool.fetchrow(
        "SELECT id, password_hash, role, is_active, organization_id FROM users WHERE email = $1",
        body.email,
    )
    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not row["is_active"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account deactivated")

    # For MANAGER: block login until admin approves
    if row["role"] == "MANAGER" and not row["organization_id"]:
        jr = await pool.fetchrow(
            """SELECT status FROM join_requests
               WHERE user_id = $1
               ORDER BY requested_at DESC LIMIT 1""",
            str(row["id"]),
        )
        if jr and jr["status"] == "REJECTED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your request to join the organization was rejected. Contact the admin.",
            )
        if jr and jr["status"] == "PENDING":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your request to join the organization is pending approval. Please wait for the admin to approve.",
            )
        if not jr:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No join request found. Please sign up again and select an organization.",
            )

    user_id = str(row["id"])
    return TokenResponse(
        access_token=create_access_token(user_id, row["role"]),
        refresh_token=create_refresh_token(user_id),
    )


# ── REFRESH ────────────────────────────────────────────────────────────────

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
