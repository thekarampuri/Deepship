"""
Orchid – Database Creator & Schema Executor
=============================================
This script handles the full bootstrap sequence:
  1. Connects to the default 'postgres' database
  2. Creates the 'orchid' database if it doesn't exist
  3. Connects to 'orchid' and runs setup_database.py schema

Usage:
    python Database/create_db.py

Environment variables (all optional – defaults shown):
    ORCHID_DB_HOST      localhost
    ORCHID_DB_PORT      5432
    ORCHID_DB_USER      postgres
    ORCHID_DB_PASSWORD  postgres
    ORCHID_DB_NAME      orchid
"""

from __future__ import annotations

import os
import sys

import psycopg2
from psycopg2 import sql


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DB_HOST     = os.getenv("ORCHID_DB_HOST", "localhost")
DB_PORT     = int(os.getenv("ORCHID_DB_PORT", "5432"))
DB_USER     = os.getenv("ORCHID_DB_USER", "postgres")
DB_PASSWORD = os.getenv("ORCHID_DB_PASSWORD", "postgres")
DB_NAME     = os.getenv("ORCHID_DB_NAME", "orchid")


# ---------------------------------------------------------------------------
# Step 1 – Create the database
# ---------------------------------------------------------------------------

def create_database():
    """Connect to the default 'postgres' db and CREATE DATABASE orchid."""
    print(f"[orchid] Connecting to PostgreSQL at {DB_HOST}:{DB_PORT} as '{DB_USER}' ...")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD,
    )
    conn.autocommit = True
    cur = conn.cursor()

    # Check if database already exists
    cur.execute(
        "SELECT 1 FROM pg_database WHERE datname = %s;",
        (DB_NAME,),
    )
    exists = cur.fetchone()

    if exists:
        print(f"[orchid] Database '{DB_NAME}' already exists – skipping creation.")
    else:
        print(f"[orchid] Creating database '{DB_NAME}' ...")
        cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(DB_NAME)))
        print(f"[orchid] Database '{DB_NAME}' created successfully.")

    cur.close()
    conn.close()


# ---------------------------------------------------------------------------
# Step 2 – Run the schema from setup_database.py
# ---------------------------------------------------------------------------

def run_schema():
    """Import and execute setup_database.setup_database()."""
    # Ensure the Database folder is on the path so we can import the module
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if script_dir not in sys.path:
        sys.path.insert(0, script_dir)

    from setup_database import setup_database
    setup_database()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("  Orchid – Database Bootstrap")
    print("=" * 60)

    # Step 1: create the database
    create_database()

    # Step 2: create tables, indexes, partitions
    run_schema()

    # Step 3: verify by listing tables
    print("\n[orchid] Verifying – listing tables in database ...")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    """)
    tables = [row[0] for row in cur.fetchall()]
    cur.close()
    conn.close()

    print(f"[orchid] {len(tables)} tables found:")
    for t in tables:
        print(f"         - {t}")

    print("\n" + "=" * 60)
    print("  Orchid database is ready!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except psycopg2.OperationalError as exc:
        print(f"\n[orchid] ERROR – Could not connect to PostgreSQL:\n  {exc}", file=sys.stderr)
        print(
            "\nMake sure PostgreSQL is running and credentials are correct.\n"
            "You can set: ORCHID_DB_HOST, ORCHID_DB_PORT, ORCHID_DB_USER, ORCHID_DB_PASSWORD",
            file=sys.stderr,
        )
        sys.exit(1)
    except Exception as exc:
        print(f"\n[orchid] ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
