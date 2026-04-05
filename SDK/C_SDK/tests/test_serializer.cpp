#include <tracehub/serializer.h>
#include <cassert>
#include <iostream>

void test_serialize_json() {
    tracehub::LogEntry entry;
    entry.level = tracehub::LogLevel::INFO;
    entry.message = "test message";
    entry.timestamp = "2026-04-05T10:00:00.000+00:00";
    entry.service = "test-svc";
    entry.environment = "dev";
    entry.host = "localhost";
    entry.pid = 1;
    entry.thread_id = "main";
    entry.sdk_version = "1.2.0";

    auto result = tracehub::serialize({entry}, false);
    assert(!result.compressed);
    assert(!result.data.empty());

    // Verify it's valid JSON
    auto j = nlohmann::json::parse(result.data);
    assert(j.is_array());
    assert(j.size() == 1);
    assert(j[0]["message"] == "test message");
    assert(j[0]["service"] == "test-svc");

    std::cout << "[PASS] test_serialize_json" << std::endl;
}

void test_serialize_gzip() {
    std::vector<tracehub::LogEntry> entries;
    for (int i = 0; i < 10; ++i) {
        tracehub::LogEntry e;
        e.level = tracehub::LogLevel::INFO;
        e.message = "message " + std::to_string(i);
        e.timestamp = "2026-04-05T10:00:00.000+00:00";
        e.service = "test";
        e.environment = "dev";
        e.host = "host";
        e.pid = 1;
        e.thread_id = "main";
        e.sdk_version = "1.2.0";
        entries.push_back(e);
    }

    auto uncompressed = tracehub::serialize(entries, false);
    auto compressed = tracehub::serialize(entries, true);

    assert(!uncompressed.compressed);
    assert(compressed.compressed);
    assert(compressed.data.size() < uncompressed.data.size());

    std::cout << "[PASS] test_serialize_gzip (compressed "
              << uncompressed.data.size() << " -> " << compressed.data.size()
              << " bytes)" << std::endl;
}

void test_serialize_batch() {
    std::vector<tracehub::LogEntry> entries;
    for (int i = 0; i < 50; ++i) {
        tracehub::LogEntry e;
        e.level = tracehub::LogLevel::DEBUG;
        e.message = "batch entry " + std::to_string(i);
        e.timestamp = "2026-04-05T10:00:00.000+00:00";
        e.service = "svc";
        e.environment = "production";
        e.host = "h";
        e.pid = 1;
        e.thread_id = "t";
        e.sdk_version = "1.2.0";
        entries.push_back(e);
    }

    auto result = tracehub::serialize(entries, false);
    auto j = nlohmann::json::parse(result.data);
    assert(j.size() == 50);

    std::cout << "[PASS] test_serialize_batch" << std::endl;
}

int main() {
    test_serialize_json();
    test_serialize_gzip();
    test_serialize_batch();
    std::cout << "\nAll serializer tests passed!" << std::endl;
    return 0;
}
