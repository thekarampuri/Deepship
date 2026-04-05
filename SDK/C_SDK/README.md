# TraceHub C++ SDK v1.2.0

Lightweight, non-blocking C++ logging SDK for TraceHub. Mirrors the Python SDK architecture with identical data structures, API endpoint, and behavior.

## Features

- **Non-blocking**: Logs enriched on caller thread (~1ms), batched and sent in background
- **Thread-safe**: Ring buffer with mutex-protected operations
- **Fault-tolerant**: Auto-restart on batch worker failure (up to 5 attempts)
- **Auto-reconnect**: Recreates HTTP client after 2 consecutive transport failures
- **Gzip compression**: Enabled by default for reduced bandwidth
- **Dead-letter queue**: Failed batches persisted to disk, replayed on restart
- **Trace ID propagation**: Thread-local trace IDs for request correlation

## Dependencies

- **C++17** compiler
- **libcurl** (HTTP client)
- **zlib** (gzip compression)
- **nlohmann/json** (auto-fetched by CMake if not found)

## Quick Start

```cpp
#include <tracehub/tracehub.h>

int main() {
    tracehub::TraceHubConfig config;
    config.api_key     = "th_your_api_key";
    config.service     = "my-service";
    config.environment = "production";

    tracehub::TraceHubLogger logger(config);

    logger.info("Server started");
    logger.error("Payment failed", "payments",
                 "ConnectionError", "gateway timeout");

    logger.close();
    return 0;
}
```

## Build

```bash
mkdir build && cd build
cmake ..
cmake --build .
```

## Configuration

| Parameter        | Type     | Default                    | Description                        |
|-----------------|----------|----------------------------|------------------------------------|
| `api_key`       | string   | **required**               | API key (must start with `th_`)    |
| `service`       | string   | **required**               | Service/application name           |
| `environment`   | string   | **required**               | `production`, `staging`, or `dev`  |
| `endpoint`      | string   | `http://103.127.146.14`    | TraceHub API base URL              |
| `batch_size`    | size_t   | `50`                       | Flush when buffer reaches this     |
| `flush_interval`| double   | `5.0`                      | Max seconds between flushes        |
| `max_buffer`    | size_t   | `10000`                    | Ring buffer capacity               |
| `max_retries`   | int      | `3`                        | Retries on 5xx/network error       |
| `timeout`       | double   | `10.0`                     | HTTP request timeout (seconds)     |
| `compress`      | bool     | `true`                     | Enable gzip compression            |
| `dlq_path`      | string   | `~/.tracehub/dlq`          | Dead-letter queue directory        |

## API

```cpp
logger.debug(message, module, extra);
logger.info(message, module, extra);
logger.warn(message, module, extra);
logger.error(message, module, error_type, error_message, stack_trace, extra);
logger.fatal(message, module, error_type, error_message, stack_trace, extra);

// Trace ID propagation
tracehub::set_trace_id("request-id");
tracehub::clear_trace_id();

// Control
logger.flush();
logger.close();
```

## Architecture

```
Your App
  |
Enricher (adds host, pid, thread_id, timestamp, trace_id)
  |
RingBuffer (thread-safe deque, 10k capacity)
  |
BatchWorker (background thread, polls every 1s)
  |
HttpTransport (gzip + POST to /api/v1/ingest)
  |
TraceHub Backend (http://103.127.146.14)
```

## License

MIT
