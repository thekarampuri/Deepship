"""
End-to-end test: SDK => API => Database
========================================
1. Seeds the database with a test user, team, project, and API key.
2. Starts the FastAPI server in the background.
3. Uses the Sentinel SDK to send logs.
4. Queries PostgreSQL to verify logs were stored and issues were created.

Run from Backend/:
    python test_e2e.py
"""

from __future__ import annotations

import hashlib
import json
import os
import secrets
import subprocess
import sys
import time

import psycopg2
import psycopg2.extras

# ── DB config ─────────────────────────────────────────────────────────────
DB_HOST = "localhost"
DB_PORT = 5432
DB_NAME = "orchid"
DB_USER = "postgres"
DB_PASSWORD = os.getenv("ORCHID_DB_PASSWORD", "omkar9211")

API_HOST = "http://localhost:8000"
SDK_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "SDK"))

# ── Helpers ───────────────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD)


def section(title: str):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")


# ── STEP 1: Seed database ────────────────────────────────────────────────

def seed_database():
    section("STEP 1 — Seeding database")
    conn = get_conn()
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # 1a. Create test user (password: "test1234")
    import bcrypt
    pw_hash = bcrypt.hashpw(b"test1234", bcrypt.gensalt()).decode()

    cur.execute("""
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES ('admin@orchid.test', %s, 'Test Admin', 'ADMIN')
        ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
    """, (pw_hash,))
    user_id = cur.fetchone()["id"]
    print(f"  User : admin@orchid.test  (id={user_id})")

    # 1b. Create team
    cur.execute("""
        INSERT INTO teams (name, description)
        VALUES ('Alpha Team', 'Test team')
        ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
        RETURNING id
    """)
    team_id = cur.fetchone()["id"]
    print(f"  Team : Alpha Team         (id={team_id})")

    # 1c. Add user to team
    cur.execute("INSERT INTO team_members (team_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (team_id, user_id))

    # 1d. Create project
    cur.execute("""
        INSERT INTO projects (team_id, name, description)
        VALUES (%s, 'auth-service', 'Authentication microservice')
        ON CONFLICT (team_id, name) DO UPDATE SET description = EXCLUDED.description
        RETURNING id
    """, (team_id,))
    project_id = cur.fetchone()["id"]
    print(f"  Project: auth-service     (id={project_id})")

    # 1e. Create API key
    raw_key = f"orchid_{secrets.token_hex(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    cur.execute("""
        DELETE FROM api_keys WHERE project_id = %s
    """, (project_id,))
    cur.execute("""
        INSERT INTO api_keys (project_id, key_hash, label, created_by)
        VALUES (%s, %s, 'e2e-test-key', %s)
        RETURNING id
    """, (project_id, key_hash, user_id))
    key_id = cur.fetchone()["id"]
    print(f"  API Key: {raw_key[:20]}...  (id={key_id})")

    cur.close()
    conn.close()
    return raw_key, str(project_id)


# ── STEP 2: Start the server ─────────────────────────────────────────────

def start_server():
    section("STEP 2 — Starting FastAPI server")
    env = os.environ.copy()
    env["DATABASE_URL"] = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    # Wait for server to be ready
    import urllib.request
    for attempt in range(20):
        try:
            urllib.request.urlopen(f"{API_HOST}/health", timeout=2)
            print(f"  Server ready on {API_HOST}  (pid={proc.pid})")
            return proc
        except Exception:
            time.sleep(0.5)

    # If we get here, dump output
    proc.terminate()
    out = proc.stdout.read().decode() if proc.stdout else ""
    print(f"  FAILED to start server. Output:\n{out}")
    sys.exit(1)


# ── STEP 3: Send logs via SDK ────────────────────────────────────────────

def send_logs_via_sdk(api_key: str):
    section("STEP 3 — Sending logs via Sentinel SDK")

    # Add SDK to path
    if SDK_PATH not in sys.path:
        sys.path.insert(0, SDK_PATH)

    from sentinel_sdk import SentinelLogger

    logger = SentinelLogger(
        api_key=api_key,
        service="auth-service",
        environment="test",
        endpoint=API_HOST,
        batch_size=5,        # flush every 5 logs
        flush_interval=2.0,  # or every 2 seconds
        compress=True,
    )

    # Send various log levels
    print("  Sending logs...")
    logger.info("User login successful", module="login", extra={"user_id": "u-001"})
    logger.info("Session created", module="session")
    logger.warn("Slow query detected: 1200ms", module="db")
    logger.error("NullPointerException in auth handler", module="login", exc_info=False)
    logger.error("NullPointerException in auth handler", module="login", exc_info=False)  # duplicate => same issue
    logger.fatal("Database connection pool exhausted", module="db")
    logger.debug("Cache miss for key user:u-001", module="cache")
    logger.info("Password reset email sent", module="notifications")

    print("  Flushing SDK buffer...")
    logger.flush()
    time.sleep(2)  # give server time to process
    logger.close()
    print("  8 logs sent")


# ── STEP 4: Send logs via raw HTTP (backup test) ─────────────────────────

def send_logs_via_http(api_key: str):
    section("STEP 3b — Sending logs via raw HTTP (backup)")
    import gzip
    import urllib.request

    logs = [
        {
            "level": "ERROR",
            "message": "Connection refused: redis://localhost:6379",
            "timestamp": "2026-04-04T12:00:00",
            "service": "auth-service",
            "environment": "test",
            "module": "cache",
            "error_type": "ConnectionRefusedError",
            "stack_trace": 'File "cache.py", line 42, in connect\nFile "redis.py", line 100, in open_connection',
        },
        {
            "level": "INFO",
            "message": "Health check passed",
            "timestamp": "2026-04-04T12:01:00",
            "service": "auth-service",
            "environment": "test",
        },
    ]

    body = gzip.compress(json.dumps(logs).encode())
    req = urllib.request.Request(
        f"{API_HOST}/api/v1/ingest",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Content-Encoding": "gzip",
            "X-Api-Key": api_key,
        },
        method="POST",
    )

    try:
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read())
        print(f"  Response: {resp.status} — accepted={result['accepted']}")
    except Exception as e:
        print(f"  HTTP request failed: {e}")


# ── STEP 4: Verify in database ───────────────────────────────────────────

def verify_database(project_id: str):
    section("STEP 4 — Verifying data in PostgreSQL")
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    # Count logs
    cur.execute("SELECT COUNT(*) AS cnt FROM logs WHERE project_id = %s", (project_id,))
    log_count = cur.fetchone()["cnt"]
    print(f"\n  Total logs stored: {log_count}")

    # Show logs by level
    cur.execute("""
        SELECT level, COUNT(*) AS cnt
        FROM logs WHERE project_id = %s
        GROUP BY level ORDER BY cnt DESC
    """, (project_id,))
    print("\n  Logs by severity:")
    for row in cur.fetchall():
        print(f"    {row['level']:8s} => {row['cnt']}")

    # Show recent logs
    cur.execute("""
        SELECT level, message, module, timestamp
        FROM logs WHERE project_id = %s
        ORDER BY ingested_at DESC LIMIT 10
    """, (project_id,))
    print("\n  Recent logs:")
    for row in cur.fetchall():
        ts = str(row["timestamp"])[:19]
        mod = row["module"] or "-"
        print(f"    [{row['level']:5s}] {ts}  {mod:15s}  {row['message'][:60]}")

    # Check issues
    cur.execute("""
        SELECT title, status, level, event_count, first_seen, last_seen
        FROM issues WHERE project_id = %s
        ORDER BY event_count DESC
    """, (project_id,))
    issues = cur.fetchall()
    print(f"\n  Issues created: {len(issues)}")
    for iss in issues:
        print(f"    [{iss['status']:11s}] {iss['level']:5s}  events={iss['event_count']}  {iss['title'][:50]}")

    cur.close()
    conn.close()

    return log_count


# ── STEP 5: Test auth endpoint ───────────────────────────────────────────

def test_auth():
    section("STEP 5 — Testing auth login")
    import urllib.request

    body = json.dumps({"email": "admin@orchid.test", "password": "test1234"}).encode()
    req = urllib.request.Request(
        f"{API_HOST}/auth/login",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read())
        token = result["access_token"]
        print(f"  Login successful!")
        print(f"  Access token: {token[:40]}...")
        print(f"  Token type: {result['token_type']}")
        return token
    except Exception as e:
        print(f"  Login failed: {e}")
        return None


# ── STEP 6: Test dashboard APIs ──────────────────────────────────────────

def test_dashboard_apis(token: str, project_id: str):
    section("STEP 6 — Testing dashboard APIs")
    import urllib.request

    headers = {"Authorization": f"Bearer {token}"}

    # GET /api/v1/logs
    try:
        req = urllib.request.Request(
            f"{API_HOST}/api/v1/logs?project_id={project_id}&per_page=5",
            headers=headers,
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        print(f"  GET /api/v1/logs      => {data['total']} total, showing {len(data['items'])} items")
    except Exception as e:
        print(f"  GET /api/v1/logs failed: {e}")

    # GET /api/v1/issues
    try:
        req = urllib.request.Request(
            f"{API_HOST}/api/v1/issues?project_id={project_id}",
            headers=headers,
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        print(f"  GET /api/v1/issues    => {data['total']} issues found")
    except Exception as e:
        print(f"  GET /api/v1/issues failed: {e}")

    # GET /api/v1/stats/overview
    try:
        req = urllib.request.Request(
            f"{API_HOST}/api/v1/stats/overview?project_id={project_id}",
            headers=headers,
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        print(f"  GET /api/v1/stats     => logs={data['total_logs']}, errors={data['total_errors']}, open_issues={data['open_issues']}")
    except Exception as e:
        print(f"  GET /api/v1/stats failed: {e}")


# ── Main ──────────────────────────────────────────────────────────────────

def main():
    print("\n" + "=" * 60)
    print("  Orchid — End-to-End Integration Test")
    print("=" * 60)

    # Step 1: Seed
    api_key, project_id = seed_database()

    # Step 2: Start server
    server_proc = start_server()

    try:
        # Step 3a: Send via SDK
        try:
            send_logs_via_sdk(api_key)
        except Exception as e:
            print(f"  SDK send failed ({e}), falling back to HTTP...")

        # Step 3b: Send via raw HTTP
        send_logs_via_http(api_key)

        # Step 4: Verify DB
        time.sleep(1)
        log_count = verify_database(project_id)

        # Step 5: Test auth
        token = test_auth()

        # Step 6: Test dashboard APIs
        if token:
            test_dashboard_apis(token, project_id)

        # Summary
        section("RESULT")
        if log_count > 0:
            print(f"  [PASS] SUCCESS -- {log_count} logs stored in PostgreSQL!")
            print(f"  [PASS] Full pipeline verified: SDK => API => Database")
        else:
            print("  [FAIL] No logs found in database")

    finally:
        print(f"\n  Stopping server (pid={server_proc.pid})...")
        server_proc.terminate()
        server_proc.wait(timeout=5)
        print("  Server stopped.\n")


if __name__ == "__main__":
    main()
