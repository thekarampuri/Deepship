import com.tracehub.sdk.*;

import java.util.Map;

public class BasicUsage {

    public static void main(String[] args) throws InterruptedException {
        // ---- Initialize the logger (same config as Python SDK) ----
        TraceHubConfig config = TraceHubConfig.builder()
                .apiKey("th_54d72cc1511c870f11eb6989daa5ce61fbc25470c0188481ad3bdca3af10597c")
                .service("billing-service")
                .environment("production");
                // .endpoint("http://103.127.146.14")  // default
                // .batchSize(50)                       // default
                // .flushInterval(5.0)                  // default
                // .maxBuffer(10000)                    // default
                // .maxRetries(3)                       // default
                // .timeout(10.0)                       // default
                // .compress(true)                      // default

        TraceHubLogger logger = new TraceHubLogger(config);

        // ---- Basic logging ----
        logger.debug("Application starting up");
        logger.info("Server listening on port 8080");
        logger.warn("Disk usage above 80%", "infra");

        // ---- Logging with extra metadata ----
        logger.info("Order placed", "orders",
                Map.of("user_id", "usr_42", "order_id", "ord_789", "total", 49.99));

        // ---- Error logging with stack trace ----
        logger.error("Payment failed", "payments",
                "ConnectionError", "gateway timeout",
                "ConnectionError: gateway timeout\n"
                + "  at PaymentGateway.charge()\n"
                + "  at OrderService.process()",
                Map.of("order_id", "ord_789"));

        // ---- Error logging with Java exception ----
        try {
            throw new RuntimeException("database connection lost");
        } catch (Exception e) {
            logger.error("Caught exception", "database", e);
        }

        // ---- Fatal error ----
        logger.fatal("Database connection lost", "database",
                "DatabaseError", "connection refused");

        // ---- Trace ID propagation (for request tracing) ----
        TraceHubLogger.setTraceId("req_abc123def456");
        logger.info("Processing request", "api");
        logger.info("Request completed", "api");
        TraceHubLogger.clearTraceId();

        // ---- Flush and close ----
        logger.flush();
        Thread.sleep(2000);
        logger.close();

        System.out.println("All logs sent successfully.");
    }
}
