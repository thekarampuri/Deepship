# TraceHub

A lightweight, distributed log ingestion and error-tracking platform with multi-language SDK support. Built for observability and debugging across microservices.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Backend API](#backend-api)
- [Frontend Dashboard](#frontend-dashboard)
- [SDKs](#sdks)
- [Database](#database)
- [User Roles & Permissions](#user-roles--permissions)
- [JAVA_SDK_Test -- Finance Tracker](#java_sdk_test----finance-tracker)
- [Troubleshooting](#troubleshooting)
- [Bug Fixes](#bug-fixes)

---

## Architecture

```
+---------------------------+
|       SDKs (v1.2.0)       |
|  Python | Java | C++      |
+---------------------------+
        | batch + gzip
        v
+---------------------------+
|   FastAPI Ingestion API   |
|  POST /api/v1/ingest      |
|  X-API-Key auth           |
+---------------------------+
        |
        v
+---------------------------+
|       RabbitMQ            |
|   Queue: log_ingestion    |
+---------------------------+
        |
        v
+---------------------------+
|    Worker Process         |
|  Fingerprinting           |
|  Issue deduplication      |
+---------------------------+
        |
        v
+---------------------------+
|      PostgreSQL           |
|  Partitioned by month     |
|  Full-text search         |
|  JSONB metadata indexing  |
+---------------------------+
        |
        v
+---------------------------+
|   React Dashboard         |
|  Admin | Manager | Dev    |
|  Logs, Issues, Stats      |
+---------------------------+
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, Python 3.10+, asyncpg, aio_pika, orjson |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| **Database** | PostgreSQL 12+ (partitioned tables, GIN/TSVECTOR indexes) |
| **Message Queue** | RabbitMQ 3.x (async consumer with auto-reconnect) |
| **Auth** | JWT (HS256), role-based access control |
| **AI** | OpenRouter / Google Gemini (error analysis) |
| **SDKs** | Python, Java (Maven), C++ (CMake) |

---

## Features

### Log Ingestion
- Gzip-compressed batch transmission from SDKs
- Asynchronous processing via RabbitMQ
- Thread-safe ring buffer with fixed memory (10k entries max)
- Exponential backoff retry with dead-letter queue
- Auto-reconnect on transport failure

### Error Tracking
- Automatic error fingerprinting and grouping into issues
- Stack trace parsing and normalization
- Issue lifecycle: OPEN -> IN_PROGRESS -> RESOLVED
- Issue assignment to developers
- Event count aggregation per issue

### Search & Observability
- Full-text search across logs (message, error_type, service, module)
- JSONB metadata search (extra fields)
- Trace ID propagation across requests
- Dashboard stats: severity breakdown, log volume timeline
- Filter by level, service, module, trace_id, date range

### Multi-Tenancy & RBAC
- Organization-level tenant isolation
- Project-level access control with API keys
- Team-based project organization
- Three roles: Admin, Manager, Developer
- Join request approval workflow

### AI-Powered Analysis
- Automatic root cause analysis for errors
- Suggested fix steps and prevention tips
- Powered by OpenRouter with Gemini fallback

---

## Getting Started

### Prerequisites

- PostgreSQL 12+
- RabbitMQ 3.x
- Python 3.10+
- Node.js 18+
- Java 17+ (for Java SDK)
- C++17 compiler + libcurl + zlib (for C++ SDK)

### 1. Database Setup

```bash
cd Database
python setup_database.py
```

This creates all tables, indexes, monthly partitions, and PostgreSQL extensions (uuid-ossp, pg_trgm).

### 2. Backend

```bash
cd Backend
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your PostgreSQL, RabbitMQ, and JWT settings

# Start the API server
python -m app.main

# Start the worker (separate terminal)
python worker_main.py
```

### 3. Frontend

```bash
cd Frontend
npm install
npm run dev
```

### 4. Access

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Production API | http://103.127.146.14 |

---

## Backend API

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register (Admin, Manager, or Developer) |
| POST | `/auth/login` | Login, returns JWT access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Current user profile + approval status |

### Log Ingestion (SDK Endpoint)

```
POST /api/v1/ingest
Headers:
  X-API-Key: th_<your_key>
  Content-Type: application/json
  Content-Encoding: gzip
Body: JSON array of log entries (gzip-compressed)
Response: 202 Accepted {"accepted": N}
```

### Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/logs` | Search logs (filters: level, service, module, trace_id, date range, full-text query) |
| GET | `/api/v1/logs/{log_id}` | Single log detail |

### Issues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/issues` | List issues (filter by project, status, level) |
| GET | `/api/v1/issues/{id}` | Issue detail with linked logs |
| PATCH | `/api/v1/issues/{id}` | Update status (OPEN / IN_PROGRESS / RESOLVED) |
| POST | `/api/v1/issues/{id}/assign` | Assign issue to a developer |

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stats/overview` | Total logs, errors, issues count |
| GET | `/api/v1/stats/severity` | Breakdown by log level |
| GET | `/api/v1/stats/timeline` | Log volume over time (hourly/daily/weekly) |

### Organizations & Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/organizations` | List public organizations |
| GET | `/api/v1/organizations/{id}` | Org detail with member/project counts |
| GET | `/api/v1/projects` | List user's accessible projects |
| POST | `/api/v1/projects` | Create project (Manager+) |
| GET | `/api/v1/projects/{id}` | Project detail |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/ai/solution` | AI error analysis (root cause, fix, prevention) |

---

## Frontend Dashboard

### Role-Based Dashboards

**Admin Dashboard**
- Organization management (teams, members, projects)
- User management and approval
- System-wide settings

**Manager Dashboard**
- Project list with stats
- Log and issue viewing per project
- Issue assignment to developers
- Join request approval/rejection

**Developer Dashboard**
- Assigned project logs with full-text search
- Issue tracking (view assigned issues)
- Playground (interactive error generation for testing)
- Profile management

### UI Features
- Role-based routing and protected routes
- Dark/light theme toggle
- Sidebar navigation with breadcrumbs
- Real-time activity logs
- Responsive design with Tailwind CSS
- Animations via Framer Motion and GSAP

---

## SDKs

All three SDKs share identical architecture, data structures, and configuration defaults.

### Architecture (All SDKs)

```
Application Code
    |
Enricher (adds: host, pid, thread_id, timestamp, trace_id ~1ms)
    |
RingBuffer (thread-safe, 10k capacity, drops oldest on overflow)
    |
BatchWorker (daemon thread, polls every 1s)
    |  triggers on: buffer >= 50 entries OR 5s elapsed
    v
HttpTransport (POST + gzip + retry with backoff)
    |
TraceHub API (/api/v1/ingest)
```

### Feature Comparison

| Feature | Python | C++ | Java |
|---------|--------|-----|------|
| Non-blocking batching | Yes | Yes | Yes |
| Thread-safe ring buffer | Yes | Yes (mutex) | Yes (synchronized) |
| Gzip compression | Yes | Yes (zlib) | Yes (GZIPOutputStream) |
| Dead-letter queue | Yes | Yes | Yes |
| Retry with exponential backoff | Yes | Yes | Yes |
| Auto-reconnect on failure | Yes | Yes | Yes |
| Trace ID propagation | thread-local | thread_local | ThreadLocal |
| Framework integrations | FastAPI, Flask, Django | -- | Spring Boot |
| Version | 1.2.0 | 1.2.0 | 1.2.0 |

### Default Configuration

| Setting | Default |
|---------|---------|
| Endpoint | `http://103.127.146.14` |
| Batch size | 50 |
| Flush interval | 5.0 seconds |
| Max buffer | 10,000 entries |
| Max retries | 3 |
| Timeout | 10.0 seconds |
| Compression | Enabled (gzip) |
| DLQ path | `~/.tracehub/dlq/` |

### Log Levels

`DEBUG` | `INFO` | `WARN` | `ERROR` | `FATAL`

### Log Entry Schema

```json
{
  "level": "ERROR",
  "message": "Payment failed",
  "timestamp": "2026-04-06T00:30:00.000+00:00",
  "service": "billing-service",
  "environment": "production",
  "host": "server-01",
  "pid": 12345,
  "thread_id": "main",
  "sdk_version": "1.2.0",
  "trace_id": "req_abc123",
  "module": "payments",
  "error_type": "ConnectionError",
  "error_message": "gateway timeout",
  "stack_trace": "ConnectionError: gateway timeout\n  at ...",
  "extra": {"user_id": "usr_42", "order_id": "ord_789"}
}
```

Optional fields (trace_id, module, error_type, error_message, stack_trace, extra) are omitted from JSON when not set. The server rejects null values.

### Python SDK

```python
from tracehub import TraceHubLogger

logger = TraceHubLogger(
    api_key="th_your_api_key",
    service="my-service",
    environment="production"
)

logger.info("Server started", module="startup")
logger.error("Payment failed", module="payments",
             error_type="TimeoutError", error_message="gateway timeout")

# With exception capture
try:
    risky_operation()
except Exception as e:
    logger.error("Caught error", module="core", exception=e)

logger.close()
```

**Framework Integrations:**
- FastAPI: `TraceHubMiddleware` (auto-propagates X-Trace-ID)
- Flask: `init_tracehub(app)` (before/after request hooks)
- Django: `TraceHubMiddleware` (add to MIDDLEWARE setting)

### Java SDK

```java
import com.tracehub.sdk.*;

TraceHubConfig config = TraceHubConfig.builder()
    .apiKey("th_your_api_key")
    .service("my-service")
    .environment("production");

TraceHubLogger logger = new TraceHubLogger(config);

logger.info("Server started", "startup");
logger.error("Payment failed", "payments",
             "TimeoutError", "gateway timeout");

// With Java exception
try {
    riskyOperation();
} catch (Exception e) {
    logger.error("Caught error", "core", e);
}

logger.close();
```

**Spring Boot** -- Add to `application.properties`:

```properties
tracehub.api-key=th_your_api_key
tracehub.service=my-service
tracehub.environment=production
```

Auto-configures `TraceHubLogger` bean and `TraceHubFilter` (X-Trace-ID propagation).

**Maven:**
```xml
<dependency>
    <groupId>com.tracehub</groupId>
    <artifactId>tracehub-sdk</artifactId>
    <version>1.2.0</version>
</dependency>
```

### C++ SDK

```cpp
#include <tracehub/tracehub.h>

tracehub::TraceHubConfig config;
config.api_key     = "th_your_api_key";
config.service     = "my-service";
config.environment = "production";

tracehub::TraceHubLogger logger(config);

logger.info("Server started", "startup");
logger.error("Payment failed", "payments",
             "TimeoutError", "gateway timeout",
             "TimeoutError: gateway timeout\n  at ...");

// Trace ID propagation
tracehub::set_trace_id("req_abc123");
logger.info("Processing request", "api");
tracehub::clear_trace_id();

logger.close();
```

**Build (CMake):**
```bash
mkdir build && cd build
cmake .. -G "MinGW Makefiles"   # or "Unix Makefiles" on Linux
cmake --build .
```

**Dependencies:** C++17, libcurl, zlib, nlohmann/json (auto-fetched)

---

## Database

### Schema Overview

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant orgs with slug-based URLs |
| `users` | Users with RBAC roles (Admin, Manager, Developer, Viewer) |
| `projects` | Projects within organizations |
| `api_keys` | Per-project SDK authentication (hashed storage) |
| `logs` | Main log table (partitioned monthly by timestamp) |
| `issues` | Grouped errors with fingerprint-based deduplication |
| `issue_assignments` | Manager to Developer issue tracking |
| `issue_events` | Links individual logs to issues |
| `teams` / `team_members` | Team-based project organization |
| `modules` / `module_assignments` | Sub-units within projects |
| `join_requests` | Org/project membership approval workflow |

### Key Indexes
- **Full-text search** (TSVECTOR) on logs: message, error_message, error_type, service, module
- **GIN index** on `extra` JSONB column for metadata queries
- **Trigram indexes** (pg_trgm) for LIKE/ILIKE pattern matching
- **B-tree composite** indexes on (project_id, timestamp, level)

### Partitioning
The `logs` table is range-partitioned by `timestamp` (monthly). New partitions are created automatically during database setup.

---

## User Roles & Permissions

| Role | Capabilities |
|------|-------------|
| **Admin** | Create/manage organization, create projects, manage all users, view all logs, approve Manager join requests |
| **Manager** | Join organizations (pending approval), manage projects, invite developers, assign issues, approve developer requests |
| **Developer** | Accept project invitations, view project logs, search logs, view assigned issues, update profile |

---

## Repository Structure

```
Deepship/
+-- Backend/
|   +-- app/
|   |   +-- main.py                 # FastAPI entry point
|   |   +-- config.py               # Environment settings
|   |   +-- database.py             # asyncpg connection pool
|   |   +-- dependencies.py         # JWT auth middleware
|   |   +-- auth/                   # Login, signup, JWT
|   |   +-- ingestion/              # POST /api/v1/ingest
|   |   +-- logs/                   # Log search endpoints
|   |   +-- issues/                 # Issue CRUD + assignment
|   |   +-- stats/                  # Dashboard statistics
|   |   +-- organizations/          # Org management
|   |   +-- projects/               # Project CRUD
|   |   +-- join_requests/          # Membership workflow
|   |   +-- ai/                     # AI error analysis
|   |   +-- queue/                  # RabbitMQ publisher
|   |   +-- worker/                 # Log processor + fingerprinting
|   +-- worker_main.py              # Standalone queue consumer
|   +-- .env.example
|
+-- Frontend/
|   +-- src/
|   |   +-- App.tsx                 # Route definitions
|   |   +-- components/
|   |   |   +-- LandingPage/        # Public landing page
|   |   |   +-- LoginPage/          # Authentication
|   |   |   +-- Admin/              # Admin dashboard
|   |   |   +-- Manager/            # Manager dashboard
|   |   |   +-- Developer/          # Developer dashboard
|   |   +-- context/
|   |   |   +-- AuthContext.tsx      # Auth state management
|   |   |   +-- ThemeContext.tsx     # Dark/light theme
|   |   +-- services/
|   |       +-- api.ts              # API client
|   +-- package.json
|   +-- tailwind.config.js
|
+-- SDK/
|   +-- tracehub/                   # Python SDK
|   |   +-- client.py               # TraceHubLogger
|   |   +-- models.py               # LogLevel, LogEntry
|   |   +-- buffer.py               # RingBuffer
|   |   +-- enricher.py             # Metadata enrichment
|   |   +-- batcher.py              # BatchWorker daemon
|   |   +-- transport.py            # HTTP + DLQ
|   |   +-- serializer.py           # JSON + gzip
|   |   +-- integrations/           # FastAPI, Flask, Django
|   +-- Java_SDK/                   # Java SDK (Maven)
|   |   +-- src/main/java/com/tracehub/sdk/
|   |   +-- pom.xml
|   +-- C_SDK/                      # C++ SDK (CMake)
|   |   +-- include/tracehub/       # Header-only library
|   |   +-- CMakeLists.txt
|   +-- pyproject.toml
|
+-- Database/
|   +-- setup_database.py           # DDL, indexes, partitions
|
+-- JAVA_SDK_Test/                  # Finance Tracker demo app
    +-- src/main/java/...
    +-- pom.xml
```

---

## JAVA_SDK_Test -- Finance Tracker

A full-stack demo application that exercises the Java SDK with real error scenarios.

**Tech Stack:** Spring Boot 3.3.0 | Java 17 | H2 Database | TraceHub Java SDK 1.2.0

### Setup

```bash
# 1. Install the Java SDK to local Maven repo
cd SDK/Java_SDK
mvn clean install -DskipTests

# 2. Configure API key
# Edit JAVA_SDK_Test/src/main/resources/application.properties
# tracehub.api-key=th_YOUR_KEY

# 3. Build and run
cd JAVA_SDK_Test
mvn clean package -DskipTests
java -jar target/finance-tracker-1.0.0.jar
```

Open http://localhost:8080

### Features

- **Dashboard** -- Income, expenses, balance, transaction count
- **Transaction CRUD** -- Add, edit, delete with 10 categories
- **Playground** -- Trigger real Java exceptions interactively:

| Playground | Input | Exception |
|-----------|-------|-----------|
| Calculator | Divide by 0 | `ArithmeticException` |
| String Transformer | Empty input | `NullPointerException` |
| String Transformer | charAt(99) on "hello" | `StringIndexOutOfBoundsException` |
| Array Access | Index 99 on 5-element array | `ArrayIndexOutOfBoundsException` |
| Parse Number | "abc" as Integer | `NumberFormatException` |

### What Gets Logged

| Scenario | Level |
|----------|-------|
| Transaction created/deleted | INFO |
| Income deleted (audit) | ERROR |
| Amount > $10,000 | WARN |
| Negative balance | ERROR |
| Not-found lookups | ERROR |
| Playground exceptions | ERROR |

---

## Environment Variables

```bash
# Backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orchid
DB_USER=postgres
DB_PASSWORD=postgres
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
JWT_SECRET_KEY=<change-this>
CORS_ORIGINS=["http://localhost:5173"]
OPENROUTER_API_KEY=<optional>
GEMINI_API_KEY=<optional>
```

---

## Troubleshooting

### Port 8080 in use

```bash
taskkill /F /IM java.exe    # Windows
kill $(lsof -t -i:8080)     # Mac/Linux
```

### TraceHub DLQ errors on startup

Old failed batches replay and fail again. Clear them:

```bash
del %USERPROFILE%\.tracehub\dlq\*.jsonl    # Windows
rm ~/.tracehub/dlq/*.jsonl                  # Mac/Linux
```

### Maven clean fails (JAR locked)

Kill the running Java process first, then rebuild.

---

## Bug Fixes

Issues discovered and fixed during development:

1. **HTTP/2 over cleartext (Java SDK)** -- Java's `HttpClient` defaults to HTTP/2, but the server (nginx on port 80) doesn't support h2c. Fixed by forcing `HttpClient.Version.HTTP_1_1`.

2. **Null JSON fields (Java + C++ SDKs)** -- Serializing null fields (`"trace_id": null`) caused the backend to reject with HTTP 500. Fixed by omitting null/empty optional fields from JSON output.

3. **Windows `#define ERROR` macro (C++ SDK)** -- Windows `<windows.h>` defines `ERROR` as `0`, colliding with `LogLevel::ERROR`. Fixed by `#undef ERROR` after including Windows headers.

---

## License

MIT
