#include <tracehub/models.h>
#include <cassert>
#include <iostream>

void test_log_level_to_string() {
    assert(tracehub::log_level_to_string(tracehub::LogLevel::DEBUG) == "DEBUG");
    assert(tracehub::log_level_to_string(tracehub::LogLevel::INFO) == "INFO");
    assert(tracehub::log_level_to_string(tracehub::LogLevel::WARN) == "WARN");
    assert(tracehub::log_level_to_string(tracehub::LogLevel::ERROR) == "ERROR");
    assert(tracehub::log_level_to_string(tracehub::LogLevel::FATAL) == "FATAL");
    std::cout << "[PASS] test_log_level_to_string" << std::endl;
}

void test_string_to_log_level() {
    assert(tracehub::string_to_log_level("DEBUG") == tracehub::LogLevel::DEBUG);
    assert(tracehub::string_to_log_level("INFO") == tracehub::LogLevel::INFO);
    assert(tracehub::string_to_log_level("WARN") == tracehub::LogLevel::WARN);
    assert(tracehub::string_to_log_level("ERROR") == tracehub::LogLevel::ERROR);
    assert(tracehub::string_to_log_level("FATAL") == tracehub::LogLevel::FATAL);
    assert(tracehub::string_to_log_level("UNKNOWN") == tracehub::LogLevel::INFO);
    std::cout << "[PASS] test_string_to_log_level" << std::endl;
}

void test_log_entry_to_json() {
    tracehub::LogEntry entry;
    entry.level = tracehub::LogLevel::ERROR;
    entry.message = "Payment failed";
    entry.timestamp = "2026-04-05T14:30:00.123+00:00";
    entry.service = "billing-service";
    entry.environment = "production";
    entry.host = "server-1";
    entry.pid = 12345;
    entry.thread_id = "worker-1";
    entry.sdk_version = "1.2.0";
    entry.trace_id = "abc123";
    entry.module = "payments";
    entry.error_type = "ConnectionError";
    entry.error_message = "gateway timeout";
    entry.extra = {{"user_id", "usr_42"}};

    auto j = entry.to_json();

    assert(j["level"] == "ERROR");
    assert(j["message"] == "Payment failed");
    assert(j["service"] == "billing-service");
    assert(j["environment"] == "production");
    assert(j["host"] == "server-1");
    assert(j["pid"] == 12345);
    assert(j["trace_id"] == "abc123");
    assert(j["module"] == "payments");
    assert(j["error_type"] == "ConnectionError");
    assert(j["error_message"] == "gateway timeout");
    assert(j["extra"]["user_id"] == "usr_42");
    std::cout << "[PASS] test_log_entry_to_json" << std::endl;
}

void test_log_entry_roundtrip() {
    tracehub::LogEntry original;
    original.level = tracehub::LogLevel::WARN;
    original.message = "Disk full";
    original.timestamp = "2026-04-05T10:00:00.000+00:00";
    original.service = "infra";
    original.environment = "staging";
    original.host = "node-2";
    original.pid = 999;
    original.thread_id = "main";
    original.sdk_version = "1.2.0";

    auto j = original.to_json();
    auto restored = tracehub::LogEntry::from_json(j);

    assert(restored.level == original.level);
    assert(restored.message == original.message);
    assert(restored.service == original.service);
    assert(restored.pid == original.pid);
    assert(!restored.trace_id.has_value());
    std::cout << "[PASS] test_log_entry_roundtrip" << std::endl;
}

int main() {
    test_log_level_to_string();
    test_string_to_log_level();
    test_log_entry_to_json();
    test_log_entry_roundtrip();
    std::cout << "\nAll model tests passed!" << std::endl;
    return 0;
}
