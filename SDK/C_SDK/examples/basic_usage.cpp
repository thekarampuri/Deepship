#include <tracehub/tracehub.h>
#include <iostream>
#include <thread>
#include <chrono>

int main() {
    // ---- Initialize the logger (same config as Python SDK) ----
    tracehub::TraceHubConfig config;
    config.api_key     = "th_54d72cc1511c870f11eb6989daa5ce61fbc25470c0188481ad3bdca3af10597c";
    config.service     = "billing-service";
    config.environment = "production";
    // config.endpoint  = "http://103.127.146.14";  // default
    // config.batch_size      = 50;                 // default
    // config.flush_interval  = 5.0;                // default
    // config.max_buffer      = 10000;              // default
    // config.max_retries     = 3;                  // default
    // config.timeout         = 10.0;               // default
    // config.compress        = true;               // default

    tracehub::TraceHubLogger logger(config);

    // ---- Basic logging ----
    logger.debug("Application starting up");
    logger.info("Server listening on port 8080");
    logger.warn("Disk usage above 80%", "infra");

    // ---- Logging with extra metadata ----
    logger.info("Order placed", "orders", {
        {"user_id", "usr_42"},
        {"order_id", "ord_789"},
        {"total", 49.99}
    });

    // ---- Error logging with stack trace ----
    logger.error(
        "Payment failed",
        "payments",                          // module
        "ConnectionError",                   // error_type
        "gateway timeout",                   // error_message
        "ConnectionError: gateway timeout\n" // stack_trace
        "  at PaymentGateway::charge()\n"
        "  at OrderService::process()",
        {{"order_id", "ord_789"}}            // extra
    );

    // ---- Fatal error ----
    logger.fatal("Database connection lost", "database",
                 "DatabaseError", "connection refused");

    // ---- Trace ID propagation (for request tracing) ----
    tracehub::set_trace_id("req_abc123def456");
    logger.info("Processing request", "api");
    logger.info("Request completed", "api");
    tracehub::clear_trace_id();

    // ---- Flush and close ----
    logger.flush();
    std::this_thread::sleep_for(std::chrono::seconds(2));
    logger.close();

    std::cout << "All logs sent successfully." << std::endl;
    return 0;
}
