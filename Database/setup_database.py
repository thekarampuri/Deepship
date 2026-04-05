"""
Orchid – PostgreSQL Database Setup
===================================
Creates all tables, indexes, and constraints for the log ingestion platform.

Tables:
  - users, roles, teams, team_members          (RBAC)
  - projects, modules, project_members          (Multi-tenant structure)
  - api_keys                                    (SDK authentication)
  - logs                                        (Partitioned by month)
  - issues, issue_assignments                   (Error grouping & tracking)

Run once:
    python setup_database.py
"""

from __future__ import annotations

import os
import sys

import psycopg2
from psycopg2 import sql


# ---------------------------------------------------------------------------
# Connection helper
# ---------------------------------------------------------------------------

def get_connection():
    """Return a psycopg2 connection using env-vars or sensible defaults."""
    return psycopg2.connect(
        host=os.getenv("ORCHID_DB_HOST", "localhost"),
        port=int(os.getenv("ORCHID_DB_PORT", "5432")),
        dbname=os.getenv("ORCHID_DB_NAME", "orchid"),
        user=os.getenv("ORCHID_DB_USER", "postgres"),
        password=os.getenv("ORCHID_DB_PASSWORD", "omkar9211"),
    )


# ---------------------------------------------------------------------------
# Schema DDL
# ---------------------------------------------------------------------------

SCHEMA_SQL = """
-- ==========================================================================
-- EXTENSIONS
-- ==========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram index for LIKE search

-- ==========================================================================
-- ENUM TYPES
-- ==========================================================================
DO $$ BEGIN
    CREATE TYPE log_level AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE issue_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'DEVELOPER', 'VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE join_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================================================
-- ORGANIZATIONS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL,
    slug        VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    created_by  UUID,                   -- will reference users(id) via ALTER after users table
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- USERS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    role            user_role    NOT NULL DEFAULT 'DEVELOPER',
    organization_id UUID         REFERENCES organizations(id) ON DELETE SET NULL,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    skills          TEXT[]       DEFAULT '{}',
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Trigram index on full_name for name search
CREATE INDEX IF NOT EXISTS idx_users_fullname_trgm
    ON users USING GIN (full_name gin_trgm_ops);

-- GIN index on skills array for skill-based search
CREATE INDEX IF NOT EXISTS idx_users_skills
    ON users USING GIN (skills);

-- Add FK from organizations.created_by -> users after users table exists
DO $$ BEGIN
    ALTER TABLE organizations
        ADD CONSTRAINT fk_organizations_created_by
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================================================
-- TEAMS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS teams (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    team_id     UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

-- ==========================================================================
-- PROJECTS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS projects (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id         UUID         NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    organization_id UUID         REFERENCES organizations(id) ON DELETE SET NULL,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    status          VARCHAR(20)  NOT NULL DEFAULT 'APPROVED',
    UNIQUE (team_id, name)
);

-- Which users can access which projects (beyond team-wide access)
CREATE TABLE IF NOT EXISTS project_members (
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);

-- ==========================================================================
-- MODULES  (sub-units inside a project, e.g. "auth", "payments")
-- ==========================================================================
CREATE TABLE IF NOT EXISTS modules (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    UNIQUE (project_id, name)
);

-- Developers assigned to specific modules
CREATE TABLE IF NOT EXISTS module_assignments (
    module_id   UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    PRIMARY KEY (module_id, user_id)
);

-- ==========================================================================
-- API KEYS  (SDK authenticates with these)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key_hash    VARCHAR(255) NOT NULL UNIQUE,
    key_value   VARCHAR(255),          -- plain key for display (hidden by default)
    label       VARCHAR(100),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
    assigned_to UUID         REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ==========================================================================
-- LOGS  (main table — partitioned by month for scalability)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS logs (
    id              UUID          NOT NULL DEFAULT uuid_generate_v4(),
    project_id      UUID          NOT NULL,
    module          VARCHAR(100),
    level           log_level     NOT NULL,
    message         TEXT          NOT NULL,
    timestamp       TIMESTAMPTZ   NOT NULL,
    service         VARCHAR(150),
    environment     VARCHAR(50),
    host            VARCHAR(255),
    pid             INTEGER,
    thread_id       VARCHAR(100),
    sdk_version     VARCHAR(30),
    trace_id        VARCHAR(64),
    stack_trace     TEXT,
    error_type      VARCHAR(255),
    error_message   TEXT,
    extra           JSONB,
    ingested_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    -- search vector (auto-populated by trigger)
    search_vector   TSVECTOR,
    PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_logs_search_vector
    ON logs USING GIN (search_vector);

-- GIN index on extra JSONB
CREATE INDEX IF NOT EXISTS idx_logs_extra
    ON logs USING GIN (extra jsonb_path_ops);

-- B-tree indexes for common filters
CREATE INDEX IF NOT EXISTS idx_logs_project_id   ON logs (project_id);
CREATE INDEX IF NOT EXISTS idx_logs_level        ON logs (level);
CREATE INDEX IF NOT EXISTS idx_logs_service      ON logs (service);
CREATE INDEX IF NOT EXISTS idx_logs_trace_id     ON logs (trace_id);

-- Trigram index for LIKE / ILIKE searches on message
CREATE INDEX IF NOT EXISTS idx_logs_message_trgm
    ON logs USING GIN (message gin_trgm_ops);

-- ==========================================================================
-- AUTO-POPULATE search_vector ON INSERT
-- ==========================================================================
CREATE OR REPLACE FUNCTION logs_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.message, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.error_message, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.error_type, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.service, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.module, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- The trigger is created per-partition (see create_partition helper), but we
-- also add a catch-all on the parent so future default partitions inherit it.
DROP TRIGGER IF EXISTS trg_logs_search_vector ON logs;
CREATE TRIGGER trg_logs_search_vector
    BEFORE INSERT OR UPDATE ON logs
    FOR EACH ROW EXECUTE FUNCTION logs_search_vector_update();

-- ==========================================================================
-- ISSUES  (grouped errors)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS issues (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id      UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           VARCHAR(300)  NOT NULL,
    fingerprint     VARCHAR(64)   NOT NULL,
    status          issue_status  NOT NULL DEFAULT 'OPEN',
    level           log_level     NOT NULL DEFAULT 'ERROR',
    first_seen      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_seen       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    event_count     BIGINT        NOT NULL DEFAULT 1,
    sample_stack    TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (project_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_issues_status     ON issues (status);
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues (project_id);

-- ==========================================================================
-- ISSUE ASSIGNMENTS  (Manager assigns → Developer resolves)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS issue_assignments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id    UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id)            ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (issue_id, assigned_to)
);

-- ==========================================================================
-- LINK: which log events belong to which issue
-- ==========================================================================
CREATE TABLE IF NOT EXISTS issue_events (
    issue_id    UUID        NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    log_id      UUID        NOT NULL,
    log_ts      TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (issue_id, log_id, log_ts),
    FOREIGN KEY (log_id, log_ts) REFERENCES logs(id, timestamp) ON DELETE CASCADE
);

-- ==========================================================================
-- JOIN REQUESTS  (Manager→Org, Manager→Developer project invites)
-- request_type: 'ORG'             — Manager requests to join an organization
--               'PROJECT_INVITE'  — Manager invites a Developer to a project
-- For PROJECT_INVITE: user_id = the invited developer, invited_by = the manager
-- ==========================================================================
CREATE TABLE IF NOT EXISTS join_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id      UUID                REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID                REFERENCES organizations(id) ON DELETE SET NULL,
    status          join_request_status NOT NULL DEFAULT 'PENDING',
    requested_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    resolved_by     UUID                REFERENCES users(id) ON DELETE SET NULL,
    request_type    VARCHAR(20)         NOT NULL DEFAULT 'ORG',   -- 'ORG' or 'PROJECT_INVITE'
    invited_by      UUID                REFERENCES users(id) ON DELETE SET NULL  -- manager who sent invite
);

CREATE INDEX IF NOT EXISTS idx_join_requests_user_id    ON join_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_project_id ON join_requests (project_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status     ON join_requests (status);
"""


# ---------------------------------------------------------------------------
# Partition helper – creates monthly partitions
# ---------------------------------------------------------------------------

def _partition_sql(year: int, month: int) -> str:
    """Return SQL to create a monthly partition for the logs table, with indexes."""
    name = f"logs_y{year}m{month:02d}"
    start = f"{year}-{month:02d}-01"
    if month == 12:
        end = f"{year + 1}-01-01"
    else:
        end = f"{year}-{month + 1:02d}-01"

    return f"""
CREATE TABLE IF NOT EXISTS {name}
    PARTITION OF logs
    FOR VALUES FROM ('{start}') TO ('{end}');

CREATE INDEX IF NOT EXISTS {name}_project_id_idx    ON {name} (project_id);
CREATE INDEX IF NOT EXISTS {name}_level_idx         ON {name} (level);
CREATE INDEX IF NOT EXISTS {name}_service_idx       ON {name} (service);
CREATE INDEX IF NOT EXISTS {name}_trace_id_idx      ON {name} (trace_id);
CREATE INDEX IF NOT EXISTS {name}_search_vector_idx ON {name} USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS {name}_message_idx       ON {name} USING GIN (message gin_trgm_ops);
CREATE INDEX IF NOT EXISTS {name}_extra_idx         ON {name} USING GIN (extra jsonb_path_ops);
"""


def create_partitions(cur, year: int):
    """Create 12 monthly partitions for the given year."""
    for month in range(1, 13):
        cur.execute(_partition_sql(year, month))


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

MIGRATIONS_SQL = """
-- ==========================================================================
-- MIGRATIONS (safe to re-run on existing databases)
-- ==========================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE join_requests ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_fullname_trgm ON users USING GIN (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_skills ON users USING GIN (skills);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'APPROVED' NOT NULL;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_value VARCHAR(255);
ALTER TABLE logs ADD COLUMN IF NOT EXISTS error_message TEXT;
"""


def setup_database():
    """Connect, run DDL, migrations, and create partitions for the current & next year."""
    from datetime import datetime

    conn = get_connection()
    conn.autocommit = True
    cur = conn.cursor()

    print("[orchid] Running schema DDL …")
    cur.execute(SCHEMA_SQL)

    print("[orchid] Running migrations …")
    cur.execute(MIGRATIONS_SQL)

    current_year = datetime.now().year
    for year in (current_year, current_year + 1):
        print(f"[orchid] Creating log partitions for {year} …")
        create_partitions(cur, year)

    cur.close()
    conn.close()
    print("[orchid] Database setup complete.")


if __name__ == "__main__":
    try:
        setup_database()
    except psycopg2.OperationalError as exc:
        print(f"[orchid] Could not connect to PostgreSQL: {exc}", file=sys.stderr)
        sys.exit(1)
