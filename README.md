# TraceHub

Log ingestion and error-tracking platform with multi-language SDK support.

## Repository Structure

```
Orchid/
├── Backend/          # TraceHub backend API server
├── Frontend/         # TraceHub dashboard frontend
├── Database/         # Database schemas and migrations
├── SDK/
│   ├── tracehub/     # Python SDK (primary)
│   ├── C_SDK/        # C++ SDK v1.2.0
│   └── Java_SDK/     # Java SDK v1.2.0
└── JAVA_SDK_Test/    # Finance Tracker (Java SDK test app)
```

## SDKs

All three SDKs share the same architecture and feature set:

| Feature | Python | C++ | Java |
|---------|--------|-----|------|
| Non-blocking batching | Yes | Yes | Yes |
| Thread-safe ring buffer | Yes | Yes (mutex) | Yes (synchronized) |
| Gzip compression | Yes | Yes (zlib) | Yes (GZIPOutputStream) |
| Dead-letter queue | Yes | Yes | Yes |
| Retry with exponential backoff | Yes | Yes | Yes |
| Auto-reconnect on failure | Yes | Yes | Yes |
| Trace ID propagation | Yes (thread-local) | Yes (thread-local) | Yes (ThreadLocal) |
| Framework integrations | FastAPI, Flask, Django | - | Spring Boot |
| Version | 1.2.0 | 1.2.0 | 1.2.0 |

### SDK Default Configuration

| Setting | Default |
|---------|---------|
| Endpoint | `http://103.127.146.14` |
| Batch size | 50 |
| Flush interval | 5.0 seconds |
| Max buffer | 10,000 entries |
| Max retries | 3 |
| Timeout | 10.0 seconds |
| Compression | Enabled |

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

### Ingest Endpoint

```
POST http://103.127.146.14/api/v1/ingest
Headers:
  X-API-Key: th_<your_key>
  Content-Type: application/json
  Content-Encoding: gzip  (if compressed)
Body: JSON array of log entries
Response: 202 Accepted
```

## Quick Start

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
logger.close()
```

### C++ SDK

```cpp
#include "tracehub/client.h"

tracehub::TraceHubConfig config;
config.api_key = "th_your_api_key";
config.service = "my-service";
config.environment = "production";

tracehub::TraceHubLogger logger(config);

logger.info("Server started", "startup");
logger.error("Payment failed", "payments", "TimeoutError", "gateway timeout");
logger.close();
```

### Java SDK

```java
import com.tracehub.sdk.*;

TraceHubConfig config = TraceHubConfig.builder()
    .apiKey("th_your_api_key")
    .service("my-service")
    .environment("production");

TraceHubLogger logger = new TraceHubLogger(config);

logger.info("Server started", "startup");
logger.error("Payment failed", "payments", exception);
logger.close();
```

**Spring Boot** -- Add to `application.properties`:

```properties
tracehub.api-key=th_your_api_key
tracehub.service=my-service
tracehub.environment=production
```

The SDK auto-configures via `TraceHubAutoConfiguration` and adds a servlet filter for trace ID propagation (`X-Trace-ID` header).

## JAVA_SDK_Test -- Finance Tracker

A full-stack demo application that exercises the Java SDK with real error scenarios.

### Tech Stack

Spring Boot 3.3.0 | Java 17 | H2 Database | TraceHub Java SDK 1.2.0

### Setup

```bash
# 1. Install the Java SDK to local Maven repo
cd SDK/Java_SDK
mvn clean install -DskipTests

# 2. Configure API key in JAVA_SDK_Test/src/main/resources/application.properties
#    tracehub.api-key=th_YOUR_KEY

# 3. Build and run
cd JAVA_SDK_Test
mvn clean package -DskipTests
java -jar target/finance-tracker-1.0.0.jar
```

Open **http://localhost:8080**.

### Features

- **Dashboard** -- Income, expenses, balance, transaction count
- **Transaction CRUD** -- Add, edit, delete with 10 categories
- **Playground** -- Interactive panels to trigger real Java exceptions:

| Playground | Try this | Exception logged |
|-----------|---------|-----------------|
| Calculator | Divide by 0 | `ArithmeticException` |
| String Transformer | Empty input | `NullPointerException` |
| String Transformer | charAt index 99 on "hello" | `StringIndexOutOfBoundsException` |
| Array Access | Index 99 on 5-element array | `ArrayIndexOutOfBoundsException` |
| Parse Number | "abc" as Integer | `NumberFormatException` |

- **Activity Log** -- Real-time display of operations in the UI

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | List all |
| POST | `/api/transactions` | Create |
| PUT | `/api/transactions/{id}` | Update |
| DELETE | `/api/transactions/{id}` | Delete |
| GET | `/api/transactions/summary` | Summary |
| POST | `/api/playground/calc` | Calculator |
| POST | `/api/playground/string` | String ops |
| POST | `/api/playground/array` | Array access |
| POST | `/api/playground/parse` | Number parsing |

### What Gets Logged

Every operation logs to TraceHub with full metadata. Errors include `error_type`, `error_message`, and complete `stack_trace`.

| Scenario | Level |
|----------|-------|
| Transaction created | INFO |
| Transaction deleted | INFO |
| Income deleted (audit) | ERROR |
| Amount > $10,000 | WARN |
| Negative balance | ERROR |
| Not-found lookups | ERROR |
| Playground errors | ERROR |
| App startup | INFO |

## Troubleshooting

### Port 8080 in use

```bash
taskkill /F /IM java.exe    # Windows
kill $(lsof -t -i:8080)     # Mac/Linux
```

### Maven clean fails (JAR locked)

Kill the Java process first, then rebuild.

### TraceHub DLQ errors on startup

Old failed batches replay and fail again. Clear them:

```bash
del %USERPROFILE%\.tracehub\dlq\*.jsonl    # Windows
rm ~/.tracehub/dlq/*.jsonl                  # Mac/Linux
```

## Java SDK Bug Fixes

Two issues were found and fixed in the Java SDK during testing:

1. **HTTP/2 over cleartext** -- Java's `HttpClient` defaults to HTTP/2, but the server (nginx on port 80) doesn't support h2c. Fixed by forcing `HttpClient.Version.HTTP_1_1` in `HttpTransport.createClient()`.

2. **Null JSON fields** -- Jackson serialized null fields (`"trace_id": null`) which the backend rejects with 500. Fixed by changing `@JsonInclude(ALWAYS)` to `@JsonInclude(NON_NULL)` on `LogEntry`.
