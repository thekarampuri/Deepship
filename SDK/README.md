# TraceHub

Lightweight, non-blocking Python SDK for **TraceHub** — a log ingestion and error-tracking platform.

The SDK collects logs from your application, batches them in a background thread, and ships them to the TraceHub API via gzip-compressed HTTP. Logs flow through a RabbitMQ queue on the backend for reliable, asynchronous processing.

```
Your App ──▶ SDK (batch + gzip) ──▶ TraceHub API ──▶ RabbitMQ ──▶ Worker ──▶ PostgreSQL
```

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Logging Methods](#logging-methods)
- [Error Tracking](#error-tracking)
- [Extra Metadata](#extra-metadata)
- [Framework Integrations](#framework-integrations)
  - [FastAPI](#fastapi)
  - [Flask](#flask)
  - [Django](#django)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Installation

```bash
pip install tracehub
```

With framework integrations:

```bash
pip install tracehub[fastapi]   # FastAPI / Starlette
pip install tracehub[flask]     # Flask
pip install tracehub[django]    # Django
```

---

## Quick Start

```python
from tracehub import TraceHubLogger

# Initialize (endpoint defaults to http://103.127.146.14)
logger = TraceHubLogger(
    api_key="th_your_api_key",      # from TraceHub dashboard
    service="my-app",               # your service name
    environment="production",       # production / staging / dev
)

# Log messages at any severity level
logger.info("Application started", module="main")
logger.warn("Disk usage above 80%", module="monitoring")

# Capture errors with full stack traces
try:
    process_payment(order_id=123)
except Exception:
    logger.error("Payment failed", exc_info=True, module="billing",
                 extra={"order_id": 123})

# Attach arbitrary metadata
logger.info("User logged in", module="auth",
            extra={"user_id": "usr_42", "ip": "10.0.0.1"})

# Ensure all logs are sent before shutdown
logger.close()
```

---

## Configuration

| Parameter        | Type    | Default                    | Description                                              |
|------------------|---------|----------------------------|----------------------------------------------------------|
| `api_key`        | `str`   | **required**               | Project API key (starts with `th_`)                      |
| `service`        | `str`   | **required**               | Name of your service / application                       |
| `environment`    | `str`   | **required**               | Deployment environment (`production`, `staging`, `dev`)  |
| `endpoint`       | `str`   | `http://103.127.146.14`    | TraceHub API base URL                                    |
| `batch_size`     | `int`   | `50`                       | Flush when buffer reaches this many entries               |
| `flush_interval` | `float` | `5.0`                      | Max seconds between flushes                               |
| `max_buffer`     | `int`   | `10000`                    | Ring buffer capacity (oldest entries dropped when full)   |
| `max_retries`    | `int`   | `3`                        | Retry count on 5xx / network errors                       |
| `timeout`        | `float` | `10.0`                     | HTTP request timeout in seconds                           |
| `compress`       | `bool`  | `True`                     | Gzip-compress payloads before sending                     |
| `dlq_path`       | `str`   | `~/.tracehub/dlq`          | Dead-letter queue directory for failed batches            |

### Example — full configuration

```python
logger = TraceHubLogger(
    api_key="th_abc123",
    service="order-service",
    environment="production",
    endpoint="http://103.127.146.14",
    batch_size=100,
    flush_interval=3.0,
    max_buffer=50_000,
    max_retries=5,
    timeout=15.0,
    compress=True,
    dlq_path="/var/log/tracehub/dlq",
)
```

---

## Logging Methods

Five severity levels matching the backend's `log_level` enum:

```python
logger.debug("Verbose diagnostic info",   module="db")
logger.info("Normal operational message",  module="auth")
logger.warn("Something looks unusual",     module="cache")
logger.error("Operation failed",           module="api",  exc_info=True)
logger.fatal("Critical system failure",    module="core", exc_info=True)
```

All methods accept these keyword arguments:

| Argument   | Type             | Description                                         |
|------------|------------------|-----------------------------------------------------|
| `module`   | `str`            | Logical module name (e.g. `"auth"`, `"payments"`)   |
| `extra`    | `dict[str, Any]` | Arbitrary key-value metadata                         |
| `exc_info` | `bool`           | Capture current exception stack trace (error/fatal)  |

The `error()` and `fatal()` methods accept additional arguments for error tracking:

| Argument        | Type             | Description                                                       |
|-----------------|------------------|-------------------------------------------------------------------|
| `exc_info`      | `bool`           | Auto-capture stack trace from active `except` block; if no active exception, captures the caller's stack trace |
| `exception`     | `BaseException`  | Pass an exception object directly — extracts `error_type`, `error_message`, and full traceback automatically |
| `error_message` | `str`            | Explicit error description (overrides auto-captured message)       |
| `stack_trace`   | `str`            | Explicit stack trace string (overrides auto-captured trace)        |

---

## Error Tracking

The SDK provides multiple ways to capture error details (`error_type`, `error_message`, `stack_trace`). All three fields are stored in the database and displayed in the TraceHub dashboard.

### Method 1: Pass an exception object (recommended)

```python
try:
    db.execute("SELECT * FROM users WHERE id = ?", user_id)
except DatabaseError as e:
    logger.error("Query failed", exception=e, module="db",
                 extra={"query": "get_user", "user_id": user_id})
```

This automatically captures:
- `error_type` — the exception class name (e.g. `DatabaseError`)
- `error_message` — the exception message (e.g. `relation "users" does not exist`)
- `stack_trace` — the full traceback from the exception's `__traceback__`

### Method 2: Auto-capture from active `except` block

```python
try:
    process_payment(order_id=123)
except Exception:
    logger.error("Payment failed", exc_info=True, module="billing")
```

When `exc_info=True` is used inside an `except` block, the SDK reads `sys.exc_info()` to capture the same three fields.

### Method 3: Capture caller's stack trace (no active exception)

```python
# Not inside an except block — captures the call site's stack trace
if balance < 0:
    logger.error("Negative balance detected", exc_info=True, module="accounts")
```

When `exc_info=True` is used **outside** an `except` block, the SDK captures the caller's stack trace as context so you can see exactly where the error was logged.

### Method 4: Explicit values

```python
logger.error(
    "Upstream service returned error",
    error_message="503 Service Unavailable",
    stack_trace=upstream_response.headers.get("X-Stack-Trace", ""),
    module="gateway",
)
```

### How issues are grouped

The backend's RabbitMQ worker:

1. Normalizes the error message (strips UUIDs, timestamps, hex addresses)
2. Extracts the top 5 stack frames
3. Generates a SHA-256 fingerprint
4. Creates or updates an **Issue** in the dashboard

Repeated occurrences of the same error are grouped into a single issue with an incrementing event count.

---

## Extra Metadata

The `extra` parameter accepts any JSON-serializable dictionary. This data is stored in a JSONB column and is fully searchable in the dashboard.

```python
logger.info("Order placed", module="orders", extra={
    "order_id": "ord_789",
    "total": 49.99,
    "items": 3,
    "customer_tier": "premium",
})
```

---

## Framework Integrations

### FastAPI

```python
from fastapi import FastAPI
from tracehub import TraceHubLogger
from tracehub.integrations.fastapi import TraceHubMiddleware

app = FastAPI()
app.add_middleware(TraceHubMiddleware)

logger = TraceHubLogger(
    api_key="th_your_key",
    service="my-fastapi-app",
    environment="production",
)

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    logger.info("Fetching user", module="api", extra={"user_id": user_id})
    return {"id": user_id}
```

The middleware automatically:
- Reads `X-Trace-ID` from the request header (or generates a UUID)
- Attaches the trace ID to all logs emitted during that request
- Returns `X-Trace-ID` in the response header

### Flask

```python
from flask import Flask
from tracehub import TraceHubLogger
from tracehub.integrations.flask import init_tracehub

app = Flask(__name__)
init_tracehub(app)

logger = TraceHubLogger(
    api_key="th_your_key",
    service="my-flask-app",
    environment="production",
)

@app.route("/health")
def health():
    logger.info("Health check", module="api")
    return {"status": "ok"}
```

### Django

Add the middleware to your `settings.py`:

```python
MIDDLEWARE = [
    "tracehub.integrations.django.TraceHubMiddleware",
    # ... other middleware
]
```

Then use the logger anywhere:

```python
from tracehub import TraceHubLogger

logger = TraceHubLogger(
    api_key="th_your_key",
    service="my-django-app",
    environment="production",
)

def my_view(request):
    logger.info("Processing request", module="views")
    # trace_id is automatically attached
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Your Application                     │
│                                                          │
│   logger.info("msg")                                     │
│       │                                                  │
│       ▼                                                  │
│   ┌──────────┐    ┌────────────┐    ┌────────────────┐  │
│   │ Enricher │───▶│ RingBuffer │───▶│  BatchWorker   │  │
│   │ (1ms)    │    │ (10k cap)  │    │ (daemon thread)│  │
│   └──────────┘    └────────────┘    └───────┬────────┘  │
│                                             │            │
│   Enricher adds:                   Flushes on:           │
│   - timestamp (UTC ISO)            - batch_size reached  │
│   - hostname                       - flush_interval      │
│   - PID / thread_id               - shutdown             │
│   - sdk_version                                          │
│   - trace_id                                             │
└─────────────────────────────────────────────────────────┘
                          │
                          │ POST /api/v1/ingest
                          │ X-API-Key: th_xxx
                          │ Content-Encoding: gzip
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   TraceHub Backend                        │
│                                                          │
│   ┌───────────┐    ┌──────────┐    ┌─────────────────┐  │
│   │ FastAPI   │───▶│ RabbitMQ │───▶│ Worker Process  │  │
│   │ Ingestion │    │  Queue   │    │ (log_ingestion) │  │
│   └───────────┘    └──────────┘    └────────┬────────┘  │
│                                             │            │
│                                    ┌────────▼────────┐  │
│                                    │   PostgreSQL     │  │
│                                    │  (partitioned)   │  │
│                                    └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Components

| Component       | Description                                                     |
|-----------------|-----------------------------------------------------------------|
| **Enricher**    | Adds host, PID, timestamp, trace_id (~1ms, runs on caller thread) |
| **RingBuffer**  | Thread-safe circular buffer. Drops oldest entries when full.     |
| **BatchWorker** | Daemon thread that flushes buffer on size/time thresholds.       |
| **HttpTransport** | Sends gzip-compressed batches. Retries with exponential backoff. |
| **DeadLetterQueue** | Persists failed batches to disk for later replay.           |

### Reliability Features

- **Non-blocking**: Logging calls return immediately (~1ms)
- **Background batching**: Reduces HTTP overhead by grouping logs
- **Gzip compression**: Minimizes bandwidth usage
- **Exponential backoff**: Retries on 5xx / timeout / network errors
- **Dead-letter queue**: Failed batches saved to disk, replayed on next startup
- **Ring buffer**: Fixed memory footprint, no OOM risk
- **Graceful shutdown**: `atexit` hook flushes remaining logs
- **Auto-reconnect**: HTTP client automatically recreated after persistent connection failures (v1.2.0+)
- **Fault-tolerant batcher**: Background thread catches exceptions and auto-restarts if it dies (v1.2.0+)

---

## API Reference

### `TraceHubLogger`

```python
class TraceHubLogger:
    def __init__(self, api_key, service, environment, endpoint="", *, ...)
    def debug(self, message, *, module="", extra=None) -> None
    def info(self, message, *, module="", extra=None) -> None
    def warn(self, message, *, module="", extra=None) -> None
    def error(self, message, *, exc_info=False, exception=None,
              error_message=None, stack_trace=None, module="", extra=None) -> None
    def fatal(self, message, *, exc_info=False, exception=None,
              error_message=None, stack_trace=None, module="", extra=None) -> None
    def flush(self) -> None
    def close(self) -> None
```

### `tracehub.enricher`

```python
def set_trace_id(trace_id: str) -> None    # Set trace ID for current thread
def get_trace_id() -> str                   # Get current thread's trace ID
def clear_trace_id() -> None                # Clear current thread's trace ID
```

### Exceptions

```python
TraceHubError            # Base exception
TraceHubConfigError      # Invalid configuration (missing api_key, etc.)
TraceHubTransportError   # HTTP transport failure
```

---

## Testing

### Run unit tests

```bash
cd SDK
pip install -e ".[dev]"
pytest tests/ -v
```

### Run integration tests (requires live backend + RabbitMQ)

```bash
TRACEHUB_TEST_API_KEY=th_your_key pytest tests/test_integration_rabbitmq.py -v -s
```

### What the integration tests verify

| Test                        | Validates                                               |
|-----------------------------|---------------------------------------------------------|
| `test_single_log_ingestion` | SDK -> API accepts a single log                         |
| `test_batch_ingestion`      | All five severity levels are accepted                    |
| `test_error_with_stack_trace` | Stack traces flow through RabbitMQ to issue creation  |
| `test_high_volume_batch`    | 50 logs batched and flushed correctly                    |
| `test_extra_metadata`       | Arbitrary JSON metadata is transmitted                   |

---

## Troubleshooting

### Logs not appearing in dashboard

1. **Check API key**: Ensure it starts with `th_` and is active in the project settings
2. **Check endpoint**: Default is `http://103.127.146.14` -- verify it's reachable
3. **Check DLQ**: Look in `~/.tracehub/dlq/` for failed batches
4. **Check RabbitMQ**: Verify the worker is running on the backend

### High memory usage

Reduce `max_buffer` (default 10,000 entries). The ring buffer drops oldest entries when full.

### Slow application startup

The SDK replays any dead-letter queue files on startup. If `~/.tracehub/dlq/` has many files, clear them or increase the timeout.

### `TraceHubConfigError: api_key is required`

Pass a non-empty `api_key` parameter. Generate one from the TraceHub dashboard under Project Settings > API Keys.

---

## License

MIT
