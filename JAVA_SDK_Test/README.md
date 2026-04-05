# Finance Tracker

A full-stack Finance Tracker application built to test and demonstrate the **TraceHub Java SDK v1.2.0**. Features a Spring Boot REST API backend with an H2 in-memory database and a dark-themed single-page frontend.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Spring Boot | 3.3.0 |
| Language | Java | 17 |
| Database | H2 (in-memory) | Runtime |
| Logging SDK | TraceHub Java SDK | 1.2.0 |
| Frontend | HTML / CSS / Vanilla JS | - |
| Build Tool | Maven | 3.9+ |

## Project Structure

```
JAVA_SDK_Test/
├── pom.xml
├── README.md
└── src/main/
    ├── java/com/financetracker/
    │   ├── FinanceTrackerApplication.java
    │   ├── config/
    │   │   ├── TraceHubConfiguration.java
    │   │   └── GlobalExceptionHandler.java
    │   ├── model/
    │   │   └── Transaction.java
    │   ├── repository/
    │   │   └── TransactionRepository.java
    │   ├── service/
    │   │   └── TransactionService.java
    │   └── controller/
    │       ├── TransactionController.java
    │       └── PlaygroundController.java
    └── resources/
        ├── application.properties
        └── static/
            ├── index.html
            ├── style.css
            └── app.js
```

## Prerequisites

- **Java 17+**
- **Maven 3.9+**
- **TraceHub Java SDK** installed to local Maven repo

## Setup

### 1. Install the TraceHub Java SDK

```bash
cd SDK/Java_SDK
mvn clean install -DskipTests
```

### 2. Configure the API Key

Edit `src/main/resources/application.properties`:

```properties
tracehub.api-key=th_YOUR_API_KEY_HERE
tracehub.service=finance-tracker
tracehub.environment=development
```

### 3. Build and Run

```bash
cd JAVA_SDK_Test
mvn clean package -DskipTests
java -jar target/finance-tracker-1.0.0.jar
```

The app starts at **http://localhost:8080**.

## API Endpoints

### Transaction CRUD

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/transactions` | List all transactions |
| GET | `/api/transactions/{id}` | Get a single transaction |
| POST | `/api/transactions` | Create a transaction |
| PUT | `/api/transactions/{id}` | Update a transaction |
| DELETE | `/api/transactions/{id}` | Delete a transaction |
| GET | `/api/transactions/summary` | Get income/expense/balance summary |

### Playground (Error Testing)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/playground/calc` | Calculator (supports +, -, *, /) |
| POST | `/api/playground/string` | String operations (uppercase, reverse, length, charAt) |
| POST | `/api/playground/array` | Array access on `[10, 20, 30, 40, 50]` |
| POST | `/api/playground/parse` | Parse string as Integer or Double |

## Frontend Sections

- **Dashboard Cards** -- Total income, total expenses, net balance, transaction count
- **Transaction Form** -- Add/edit transactions with type, category, amount, date, description
- **Transaction Table** -- Sortable list with edit/delete actions
- **Playground** -- Interactive panels to trigger real Java exceptions
- **Activity Log** -- Real-time log of operations performed in the UI

## TraceHub SDK Integration

### Configuration

The SDK is configured in `TraceHubConfiguration.java`:

- **Batch size**: 5 entries per batch
- **Flush interval**: 2 seconds
- **Compression**: Disabled (server compatibility)
- **Endpoint**: Configurable via `tracehub.endpoint` property

### What Gets Logged

**Transaction Operations:**

| Action | Level | Details |
|--------|-------|---------|
| Create transaction | INFO | id, type, category, amount, description, date |
| Create with amount > $10,000 | WARN | Large transaction alert |
| Delete transaction | INFO | id, deleted amount/type/category |
| Delete INCOME transaction | ERROR | Audit alert with full stack trace |
| Update transaction | INFO | old/new values comparison |
| Get non-existent ID | ERROR | Full stack trace + transaction_id |
| Summary with negative balance | ERROR | Deficit alert with financials |

**Playground Operations:**

| Action | Level | Exception |
|--------|-------|-----------|
| Divide by zero | ERROR | `ArithmeticException` |
| Empty string operation | ERROR | `NullPointerException` |
| String charAt out of bounds | ERROR | `StringIndexOutOfBoundsException` |
| Array index out of bounds | ERROR | `ArrayIndexOutOfBoundsException` |
| Parse "abc" as integer | ERROR | `NumberFormatException` |
| Any successful operation | INFO | Operation details and result |

**Global:**

| Event | Level | Details |
|-------|-------|---------|
| Application startup | INFO | Java version, OS, app version |
| Unhandled exceptions | ERROR | Full stack trace via GlobalExceptionHandler |

### Log Entry Fields

Every log entry sent to TraceHub includes:

- `level` -- DEBUG, INFO, WARN, ERROR, FATAL
- `message` -- Human-readable description
- `timestamp` -- ISO 8601 UTC
- `service` -- "finance-tracker"
- `environment` -- "development"
- `host` -- Machine hostname
- `pid` -- Process ID
- `thread_id` -- Thread name
- `sdk_version` -- "1.2.0"
- `module` -- Component name (transactions, playground, summary, audit, startup)
- `error_type` -- Exception class name (on errors)
- `error_message` -- Exception message (on errors)
- `stack_trace` -- Full Java stack trace (on errors)
- `extra` -- Contextual metadata (operation_id, amounts, categories, etc.)

## Troubleshooting

### Port 8080 already in use

```bash
taskkill /F /IM java.exe
```

### Maven clean fails (JAR locked)

Kill any running Java process first, then rebuild:

```bash
taskkill /F /IM java.exe
mvn clean package -DskipTests
```

### TraceHub DLQ errors

Clear old failed batches:

```bash
# Windows
del %USERPROFILE%\.tracehub\dlq\*.jsonl

# Linux/Mac
rm ~/.tracehub/dlq/*.jsonl
```

## SDK Fixes Applied

During development, two bugs were found and fixed in the TraceHub Java SDK:

1. **HTTP/2 over cleartext** -- Java's `HttpClient` defaults to HTTP/2, but the TraceHub server (nginx on port 80) doesn't support h2c. Fixed by forcing `HttpClient.Version.HTTP_1_1`.

2. **Null JSON fields** -- Jackson serialized null fields (e.g., `"trace_id": null`) which the backend rejects. Fixed by changing `@JsonInclude(ALWAYS)` to `@JsonInclude(NON_NULL)` on `LogEntry`.
