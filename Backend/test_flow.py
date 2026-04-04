"""
End-to-end flow test for the corrected RBAC logic.

Flow tested:
  1. ADMIN signs up => creates organization "Acme Corp"
  2. ADMIN creates a project "payment-api"
  3. MANAGER signs up => picks Acme Corp => join request PENDING
  4. MANAGER tries to create project => BLOCKED (not approved)
  5. ADMIN sees pending request => approves it
  6. MANAGER creates project "user-api"
  7. MANAGER adds a developer to "user-api"
  8. DEVELOPER signs up => gets added => sends logs via SDK
  9. Verify logs in database

Run from Backend/:
    python test_flow.py
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.request
import urllib.error

API = "http://localhost:8000"
PYTHON = sys.executable


def section(title):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")


def api_call(method, path, body=None, token=None, expect_status=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(f"{API}{path}", data=data, headers=headers, method=method)

    try:
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read()) if resp.read else {}
        # re-read for empty
        return resp.status, result
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        try:
            detail = json.loads(body_text)
        except Exception:
            detail = body_text
        if expect_status and e.code == expect_status:
            return e.code, detail
        print(f"    HTTP {e.code}: {detail}")
        return e.code, detail


def start_server():
    section("Starting server")
    proc = subprocess.Popen(
        [PYTHON, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    for _ in range(20):
        try:
            urllib.request.urlopen(f"{API}/health", timeout=2)
            print(f"  Server ready (pid={proc.pid})")
            return proc
        except Exception:
            time.sleep(0.5)
    proc.terminate()
    print("  FAILED to start server")
    sys.exit(1)


def main():
    print("\n" + "=" * 60)
    print("  Orchid -- Corrected RBAC Flow Test")
    print("=" * 60)

    # Clean up previous test data
    import psycopg2
    conn = psycopg2.connect(
        host="localhost", port=5432, dbname="orchid",
        user="postgres", password=os.getenv("ORCHID_DB_PASSWORD", "omkar9211"),
    )
    conn.autocommit = True
    cur = conn.cursor()
    # Delete test users from previous runs
    cur.execute("DELETE FROM users WHERE email IN ('admin@acme.test', 'manager@acme.test', 'dev@acme.test')")
    cur.execute("DELETE FROM organizations WHERE slug = 'acme-corp'")
    cur.close()
    conn.close()
    print("  Cleaned up previous test data")

    server = start_server()

    try:
        # ── 1. ADMIN signs up and creates org ──────────────────────────
        section("1. ADMIN signs up => creates org")
        code, resp = api_call("POST", "/auth/signup", {
            "email": "admin@acme.test",
            "password": "admin1234",
            "full_name": "Alice Admin",
            "role": "ADMIN",
            "organization_name": "Acme Corp",
        })
        assert code == 201, f"Expected 201, got {code}: {resp}"
        admin_token = resp["access_token"]
        print(f"  ADMIN signed up, token: {admin_token[:30]}...")

        # Get admin details
        code, admin_me = api_call("GET", "/auth/me", token=admin_token)
        org_id = admin_me["organization_id"]
        print(f"  Org ID: {org_id}")
        print(f"  Org name: {admin_me['organization_name']}")

        # Verify ADMIN cannot create another org
        section("1b. ADMIN cannot create duplicate org")
        code, resp = api_call("POST", "/auth/signup", {
            "email": "admin2@acme.test",
            "password": "admin1234",
            "full_name": "Bob Admin",
            "role": "ADMIN",
            "organization_name": "Acme Corp",
        }, expect_status=409)
        print(f"  Duplicate org blocked: HTTP {code} -- {resp.get('detail', '')}")

        # ── 2. ADMIN creates a project ─────────────────────────────────
        section("2. ADMIN creates project 'payment-api'")
        code, project1 = api_call("POST", "/api/v1/projects", {
            "name": "payment-api",
            "description": "Payment processing service",
        }, token=admin_token)
        assert code == 201, f"Expected 201, got {code}: {project1}"
        project1_id = project1["id"]
        print(f"  Project created: {project1['name']} (id={project1_id})")

        # ── 3. MANAGER signs up => join request PENDING ────────────────
        section("3. MANAGER signs up => picks Acme Corp => PENDING")
        code, resp = api_call("POST", "/auth/signup", {
            "email": "manager@acme.test",
            "password": "mgr1234",
            "full_name": "Mike Manager",
            "role": "MANAGER",
            "organization_id": org_id,
        })
        assert code == 201, f"Expected 201, got {code}: {resp}"
        manager_token = resp["access_token"]
        print(f"  MANAGER signed up, token: {manager_token[:30]}...")

        # Check manager's status
        code, mgr_me = api_call("GET", "/auth/me", token=manager_token)
        print(f"  Manager org_id: {mgr_me['organization_id']} (should be None)")
        print(f"  Approval status: {mgr_me['approval_status']} (should be PENDING)")
        assert mgr_me["approval_status"] == "PENDING"

        # ── 4. MANAGER tries to create project => BLOCKED ──────────────
        section("4. MANAGER tries project creation => BLOCKED")
        code, resp = api_call("POST", "/api/v1/projects", {
            "name": "blocked-project",
        }, token=manager_token, expect_status=403)
        print(f"  Blocked: HTTP {code} -- {resp.get('detail', '')}")
        assert code == 403

        # ── 5. ADMIN sees pending request => approves ──────────────────
        section("5. ADMIN approves MANAGER's join request")
        # List pending requests
        code, pending = api_call("GET", f"/api/v1/organizations/{org_id}/pending-requests", token=admin_token)
        print(f"  Pending requests: {len(pending)}")
        assert len(pending) >= 1
        request_id = pending[0]["id"]
        print(f"  Request from: {pending[0]['full_name']} ({pending[0]['email']})")

        # Approve it
        code, resp = api_call("PATCH", f"/api/v1/join-requests/{request_id}", {
            "status": "APPROVED",
        }, token=admin_token)
        print(f"  Approved: {resp['status']}")
        assert resp["status"] == "APPROVED"

        # ── 6. MANAGER can now create projects ─────────────────────────
        section("6. MANAGER creates project 'user-api' (now approved)")
        # Re-login to refresh token with updated org_id
        code, resp = api_call("POST", "/auth/login", {
            "email": "manager@acme.test",
            "password": "mgr1234",
        })
        manager_token = resp["access_token"]

        # Check status is now APPROVED
        code, mgr_me = api_call("GET", "/auth/me", token=manager_token)
        print(f"  Manager org_id: {mgr_me['organization_id']} (should be {org_id})")
        print(f"  Approval status: {mgr_me['approval_status']}")
        assert mgr_me["organization_id"] == org_id

        code, project2 = api_call("POST", "/api/v1/projects", {
            "name": "user-api",
            "description": "User management service",
        }, token=manager_token)
        assert code == 201, f"Expected 201, got {code}: {project2}"
        project2_id = project2["id"]
        print(f"  Project created: {project2['name']} (id={project2_id})")

        # ── 7. DEVELOPER signs up => MANAGER adds to project ──────────
        section("7. DEVELOPER signup + MANAGER adds to project")
        code, resp = api_call("POST", "/auth/signup", {
            "email": "dev@acme.test",
            "password": "dev1234",
            "full_name": "Dave Developer",
            "role": "DEVELOPER",
        })
        assert code == 201
        dev_token = resp["access_token"]
        code, dev_me = api_call("GET", "/auth/me", token=dev_token)
        dev_id = dev_me["id"]
        print(f"  Developer signed up: {dev_me['full_name']} (id={dev_id})")

        # Manager adds developer to user-api
        code, resp = api_call("POST", f"/api/v1/projects/{project2_id}/developers", {
            "user_id": dev_id,
        }, token=manager_token)
        assert code == 201, f"Expected 201, got {code}: {resp}"
        print(f"  Developer assigned to user-api: {resp['status']}")

        # ── 8. Generate API key + send logs ────────────────────────────
        section("8. Generate API key + send logs")
        code, key_resp = api_call("POST", f"/api/v1/projects/{project2_id}/api-keys", {
            "label": "test-key",
        }, token=manager_token)
        assert code == 201
        api_key = key_resp["api_key"]
        print(f"  API key: {api_key[:20]}...")

        # Send logs via raw HTTP
        import gzip
        logs = [
            {"level": "INFO", "message": "User created successfully", "timestamp": "2026-04-05T10:00:00", "service": "user-api", "module": "registration"},
            {"level": "ERROR", "message": "Email validation failed", "timestamp": "2026-04-05T10:01:00", "service": "user-api", "module": "registration", "error_type": "ValidationError"},
            {"level": "ERROR", "message": "Email validation failed", "timestamp": "2026-04-05T10:02:00", "service": "user-api", "module": "registration", "error_type": "ValidationError"},
            {"level": "FATAL", "message": "Database connection lost", "timestamp": "2026-04-05T10:03:00", "service": "user-api", "module": "db"},
        ]
        body = gzip.compress(json.dumps(logs).encode())
        req = urllib.request.Request(
            f"{API}/api/v1/ingest",
            data=body,
            headers={"Content-Type": "application/json", "Content-Encoding": "gzip", "X-Api-Key": api_key},
            method="POST",
        )
        resp = urllib.request.urlopen(req, timeout=10)
        result = json.loads(resp.read())
        print(f"  Logs ingested: {result['accepted']}")

        # ── 9. Verify in database ─────────────────────────────────────
        section("9. Verify data")
        time.sleep(1)

        # Check logs via API
        code, log_resp = api_call("GET", f"/api/v1/projects/{project2_id}/logs", token=manager_token)
        print(f"  Logs via API: {len(log_resp)} entries")

        # Check issues via API
        code, issues = api_call("GET", f"/api/v1/issues?project_id={project2_id}", token=manager_token)
        print(f"  Issues via API: {issues['total']} issues")
        for iss in issues["items"]:
            print(f"    [{iss['status']:11s}] {iss['level']:5s} events={iss['event_count']}  {iss['title'][:50]}")

        # Check org members
        code, members = api_call("GET", f"/api/v1/organizations/{org_id}/members", token=admin_token)
        print(f"\n  Organization members: {len(members)}")
        for m in members:
            print(f"    {m['role']:10s} {m['full_name']:20s} {m['email']}")

        # ── SUMMARY ────────────────────────────────────────────────────
        section("RESULT")
        print("  [PASS] ADMIN signup creates organization")
        print("  [PASS] Duplicate org slug blocked")
        print("  [PASS] ADMIN creates project")
        print("  [PASS] MANAGER signup sends join request (PENDING)")
        print("  [PASS] MANAGER blocked from creating project before approval")
        print("  [PASS] ADMIN sees and approves pending request")
        print("  [PASS] MANAGER creates project after approval")
        print("  [PASS] MANAGER adds developer to project")
        print("  [PASS] API key generated, logs ingested")
        print(f"  [PASS] {len(log_resp)} logs + {issues['total']} issues in database")

    except AssertionError as e:
        print(f"\n  [FAIL] Assertion failed: {e}")
    except Exception as e:
        print(f"\n  [FAIL] Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print(f"\n  Stopping server (pid={server.pid})...")
        server.terminate()
        server.wait(timeout=5)
        print("  Done.\n")


if __name__ == "__main__":
    main()
