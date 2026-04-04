"""Organization endpoints: list, detail, projects, and developers."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_pool
from app.dependencies import UserContext, get_current_user

router = APIRouter()


@router.get("/organizations")
async def list_organizations():
    """List all organizations (public for developers to browse)."""
    pool = get_pool()
    rows = await pool.fetch(
        """SELECT o.id, o.name, o.slug, o.description, o.created_at,
                  COUNT(DISTINCT u.id) AS member_count,
                  COUNT(DISTINCT p.id) AS project_count
           FROM organizations o
           LEFT JOIN users u ON u.organization_id = o.id AND u.is_active = TRUE
           LEFT JOIN projects p ON p.organization_id = o.id
           GROUP BY o.id
           ORDER BY o.created_at DESC"""
    )
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "slug": r["slug"],
            "description": r["description"],
            "created_at": r["created_at"].isoformat(),
            "member_count": r["member_count"],
            "project_count": r["project_count"],
        }
        for r in rows
    ]


@router.get("/organizations/{org_id}")
async def get_organization(org_id: str):
    """Get organization details with project count."""
    pool = get_pool()
    row = await pool.fetchrow(
        """SELECT o.id, o.name, o.slug, o.description, o.created_by, o.created_at,
                  COUNT(DISTINCT p.id) AS project_count,
                  COUNT(DISTINCT u.id) AS member_count
           FROM organizations o
           LEFT JOIN projects p ON p.organization_id = o.id
           LEFT JOIN users u ON u.organization_id = o.id AND u.is_active = TRUE
           WHERE o.id = $1
           GROUP BY o.id""",
        org_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    return {
        "id": str(row["id"]),
        "name": row["name"],
        "slug": row["slug"],
        "description": row["description"],
        "created_by": str(row["created_by"]) if row["created_by"] else None,
        "created_at": row["created_at"].isoformat(),
        "project_count": row["project_count"],
        "member_count": row["member_count"],
    }


@router.get("/organizations/{org_id}/projects")
async def list_organization_projects(org_id: str):
    """List projects in an organization."""
    pool = get_pool()

    # Verify org exists
    org = await pool.fetchrow("SELECT id FROM organizations WHERE id = $1", org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    rows = await pool.fetch(
        """SELECT p.id, p.name, p.description, p.created_at,
                  COUNT(DISTINCT pm.user_id) AS developer_count
           FROM projects p
           LEFT JOIN project_members pm ON pm.project_id = p.id
           WHERE p.organization_id = $1
           GROUP BY p.id
           ORDER BY p.created_at DESC""",
        org_id,
    )
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "description": r["description"],
            "created_at": r["created_at"].isoformat(),
            "developer_count": r["developer_count"],
        }
        for r in rows
    ]


@router.get("/organizations/{org_id}/developers")
async def list_organization_developers(org_id: str):
    """List developers associated with an organization's projects."""
    pool = get_pool()

    org = await pool.fetchrow("SELECT id FROM organizations WHERE id = $1", org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    rows = await pool.fetch(
        """SELECT DISTINCT u.id, u.email, u.full_name, u.role, u.created_at
           FROM users u
           JOIN project_members pm ON pm.user_id = u.id
           JOIN projects p ON p.id = pm.project_id
           WHERE p.organization_id = $1 AND u.is_active = TRUE
           ORDER BY u.full_name""",
        org_id,
    )
    return [
        {
            "id": str(r["id"]),
            "email": r["email"],
            "full_name": r["full_name"],
            "role": r["role"],
            "created_at": r["created_at"].isoformat(),
        }
        for r in rows
    ]
