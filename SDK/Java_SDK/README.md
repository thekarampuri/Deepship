# TraceHub Java SDK v1.2.0

Lightweight, non-blocking Java logging SDK for TraceHub. Mirrors the Python SDK architecture with identical data structures, API endpoint, and behavior.

## Features

- **Non-blocking**: Logs enriched on caller thread (~1ms), batched and sent in background daemon thread
- **Thread-safe**: Ring buffer with synchronized operations
- **Fault-tolerant**: Auto-restart on batch worker failure (up to 5 attempts, 2s cooldown)
- **Auto-reconnect**: Recreates HTTP client after 2 consecutive transport failures
- **Gzip compression**: Enabled by default for reduced bandwidth
- **Dead-letter queue**: Failed batches persisted to `~/.tracehub/dlq/`, replayed on restart
- **Trace ID propagation**: ThreadLocal trace IDs for request correlation
- **Spring Boot integration**: Auto-configuration + servlet filter for automatic trace ID handling
- **Java exception support**: Pass `Throwable` directly to capture class name, message, and full stack trace

## Requirements

- **Java 17+**
- **Jackson** (JSON serialization) — included via Maven

## Integration Guide

### Option 1: Add as a local dependency (Maven)

1. Build the SDK jar:
```bash
cd Java_SDK
mvn clean package -DskipTests
```

2. Install to local Maven repository:
```bash
mvn install -DskipTests
```

3. Add to your project's `pom.xml`:
```xml
<dependency>
    <groupId>com.tracehub</groupId>
    <artifactId>tracehub-sdk</artifactId>
    <version>1.2.0</version>
</dependency>
```

### Option 2: Copy the JAR directly

1. Build the jar:
```bash
cd Java_SDK
mvn clean package -DskipTests
```

2. Copy `target/tracehub-sdk-1.2.0.jar` into your project's `libs/` folder.

3. Add to `pom.xml`:
```xml
<dependency>
    <groupId>com.tracehub</groupId>
    <artifactId>tracehub-sdk</artifactId>
    <version>1.2.0</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/libs/tracehub-sdk-1.2.0.jar</systemPath>
</dependency>

<!-- Also add Jackson (required by the SDK) -->
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.17.0</version>
</dependency>
```

### Option 3: Add as a Gradle dependency

```groovy
// build.gradle
dependencies {
    implementation files('libs/tracehub-sdk-1.2.0.jar')
    implementation 'com.fasterxml.jackson.core:jackson-databind:2.17.0'
}
```

---

## Quick Start (Plain Java)

```java
import com.tracehub.sdk.*;
import java.util.Map;

public class MyApp {
    public static void main(String[] args) {
        TraceHubConfig config = TraceHubConfig.builder()
                .apiKey("th_54d72cc1511c870f11eb6989daa5ce61fbc25470c0188481ad3bdca3af10597c")
                .service("my-service")
                .environment("production");

        TraceHubLogger logger = new TraceHubLogger(config);

        logger.info("Server started");
        logger.error("Payment failed", "payments",
                     "ConnectionError", "gateway timeout");

        // Pass Java exceptions directly
        try {
            riskyOperation();
        } catch (Exception e) {
            logger.error("Caught exception", "module", e);
        }

        logger.close(); // Flushes remaining logs
    }
}
```

---

## Spring Boot Integration

### Step 1: Add the dependency to `pom.xml`

```xml
<dependency>
    <groupId>com.tracehub</groupId>
    <artifactId>tracehub-sdk</artifactId>
    <version>1.2.0</version>
</dependency>
```

### Step 2: Add config to `application.properties`

```properties
tracehub.api-key=th_54d72cc1511c870f11eb6989daa5ce61fbc25470c0188481ad3bdca3af10597c
tracehub.service=my-spring-app
tracehub.environment=production
# tracehub.endpoint=http://103.127.146.14    (default)
# tracehub.batch-size=50                     (default)
# tracehub.flush-interval=5.0               (default)
# tracehub.max-buffer=10000                  (default)
# tracehub.max-retries=3                     (default)
# tracehub.timeout=10.0                      (default)
# tracehub.compress=true                     (default)
```

### Step 3: Inject and use in your controllers/services

```java
import com.tracehub.sdk.TraceHubLogger;
import org.springframework.web.bind.annotation.*;

@RestController
public class OrderController {

    private final TraceHubLogger logger;

    public OrderController(TraceHubLogger logger) {
        this.logger = logger;
    }

    @PostMapping("/orders")
    public String createOrder(@RequestBody OrderRequest req) {
        logger.info("Order created", "orders",
                Map.of("user_id", req.getUserId(), "total", req.getTotal()));
        return "OK";
    }

    @ExceptionHandler(Exception.class)
    public String handleError(Exception e) {
        logger.error("Unhandled exception", "api", e);
        return "Error";
    }
}
```

The `TraceHubFilter` is auto-registered and will:
- Read or generate `X-Trace-ID` header per request
- Set it on the thread-local so all logs include it
- Return it in the response `X-Trace-ID` header
- Clear it after each request

### Manual Filter Registration (without auto-config)

```java
import com.tracehub.sdk.integrations.TraceHubFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FilterConfig {
    @Bean
    public FilterRegistrationBean<TraceHubFilter> traceHubFilter() {
        FilterRegistrationBean<TraceHubFilter> bean = new FilterRegistrationBean<>();
        bean.setFilter(new TraceHubFilter());
        bean.addUrlPatterns("/*");
        return bean;
    }
}
```

---

## Configuration

| Parameter        | Type    | Default                  | Description                        |
|-----------------|---------|--------------------------|------------------------------------|
| `apiKey`        | String  | **required**             | API key (must start with `th_`)    |
| `service`       | String  | **required**             | Service/application name           |
| `environment`   | String  | **required**             | `production`, `staging`, or `dev`  |
| `endpoint`      | String  | `http://103.127.146.14`  | TraceHub API base URL              |
| `batchSize`     | int     | `50`                     | Flush when buffer reaches this     |
| `flushInterval` | double  | `5.0`                    | Max seconds between flushes        |
| `maxBuffer`     | int     | `10000`                  | Ring buffer capacity               |
| `maxRetries`    | int     | `3`                      | Retries on 5xx/network error       |
| `timeout`       | double  | `10.0`                   | HTTP request timeout (seconds)     |
| `compress`      | boolean | `true`                   | Enable gzip compression            |
| `dlqPath`       | String  | `~/.tracehub/dlq`        | Dead-letter queue directory        |

## API Reference

```java
// Basic logging
logger.debug(message);
logger.debug(message, module);
logger.debug(message, module, extra);

logger.info(message);
logger.info(message, module);
logger.info(message, module, extra);

logger.warn(message);
logger.warn(message, module);
logger.warn(message, module, extra);

logger.error(message);
logger.error(message, module);
logger.error(message, module, errorType, errorMessage);
logger.error(message, module, errorType, errorMessage, stackTrace);
logger.error(message, module, errorType, errorMessage, stackTrace, extra);
logger.error(message, module, exception);          // Java Throwable
logger.error(message, module, exception, extra);   // Java Throwable + metadata

logger.fatal(message);
logger.fatal(message, module);
logger.fatal(message, module, errorType, errorMessage);
logger.fatal(message, module, errorType, errorMessage, stackTrace);
logger.fatal(message, module, errorType, errorMessage, stackTrace, extra);
logger.fatal(message, module, exception);

// Trace ID propagation
TraceHubLogger.setTraceId("request-id");
TraceHubLogger.clearTraceId();
TraceHubLogger.getTraceId();

// Control
logger.flush();   // Trigger immediate flush
logger.close();   // Stop worker thread and flush remaining
```

## Architecture

```
Your Spring Boot App
  |
Enricher (adds host, pid, thread_id, timestamp, trace_id — ThreadLocal)
  |
RingBuffer (synchronized LinkedList, 10k capacity)
  |
BatchWorker (daemon thread, polls every 1s)
  |
HttpTransport (gzip + POST via java.net.http.HttpClient)
  |
TraceHub Backend (http://103.127.146.14/api/v1/ingest)
```

## License

MIT
