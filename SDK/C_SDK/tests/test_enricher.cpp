#include <tracehub/enricher.h>
#include <cassert>
#include <iostream>

void test_basic_enrichment() {
    tracehub::Enricher enricher("my-service", "production", "1.2.0");

    auto entry = enricher.enrich(tracehub::LogLevel::INFO, "hello world");

    assert(entry.level == tracehub::LogLevel::INFO);
    assert(entry.message == "hello world");
    assert(entry.service == "my-service");
    assert(entry.environment == "production");
    assert(entry.sdk_version == "1.2.0");
    assert(!entry.host.empty());
    assert(entry.pid > 0);
    assert(!entry.thread_id.empty());
    assert(!entry.timestamp.empty());
    assert(!entry.trace_id.has_value());

    std::cout << "[PASS] test_basic_enrichment" << std::endl;
}

void test_module_and_extra() {
    tracehub::Enricher enricher("svc", "staging", "1.2.0");

    nlohmann::json extra = {{"user_id", "usr_42"}, {"count", 10}};
    auto entry = enricher.enrich(tracehub::LogLevel::WARN, "warning msg", "payments",
                                  "", "", "", extra);

    assert(entry.module.has_value());
    assert(entry.module.value() == "payments");
    assert(entry.extra["user_id"] == "usr_42");
    assert(entry.extra["count"] == 10);

    std::cout << "[PASS] test_module_and_extra" << std::endl;
}

void test_error_fields() {
    tracehub::Enricher enricher("svc", "dev", "1.2.0");

    auto entry = enricher.enrich(
        tracehub::LogLevel::ERROR, "failed",
        "payments", "RuntimeError", "something broke", "stack trace here");

    assert(entry.error_type.value() == "RuntimeError");
    assert(entry.error_message.value() == "something broke");
    assert(entry.stack_trace.value() == "stack trace here");

    std::cout << "[PASS] test_error_fields" << std::endl;
}

void test_trace_id_propagation() {
    tracehub::Enricher enricher("svc", "production", "1.2.0");

    // No trace id
    auto e1 = enricher.enrich(tracehub::LogLevel::INFO, "no trace");
    assert(!e1.trace_id.has_value());

    // Set trace id
    tracehub::set_trace_id("req_abc123");
    auto e2 = enricher.enrich(tracehub::LogLevel::INFO, "with trace");
    assert(e2.trace_id.has_value());
    assert(e2.trace_id.value() == "req_abc123");

    // Clear trace id
    tracehub::clear_trace_id();
    auto e3 = enricher.enrich(tracehub::LogLevel::INFO, "after clear");
    assert(!e3.trace_id.has_value());

    std::cout << "[PASS] test_trace_id_propagation" << std::endl;
}

void test_timestamp_format() {
    tracehub::Enricher enricher("svc", "dev", "1.2.0");
    auto entry = enricher.enrich(tracehub::LogLevel::DEBUG, "test");

    // Timestamp should be ISO format: YYYY-MM-DDTHH:MM:SS.mmm+00:00
    auto& ts = entry.timestamp;
    assert(ts.size() >= 26);
    assert(ts[4] == '-');
    assert(ts[7] == '-');
    assert(ts[10] == 'T');
    assert(ts.find("+00:00") != std::string::npos);

    std::cout << "[PASS] test_timestamp_format" << std::endl;
}

int main() {
    test_basic_enrichment();
    test_module_and_extra();
    test_error_fields();
    test_trace_id_propagation();
    test_timestamp_format();
    std::cout << "\nAll enricher tests passed!" << std::endl;
    return 0;
}
