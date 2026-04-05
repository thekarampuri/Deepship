#include <tracehub/exceptions.h>
#include <cassert>
#include <iostream>
#include <string>

void test_tracehub_error() {
    try {
        throw tracehub::TraceHubError("base error");
    } catch (const std::runtime_error& e) {
        assert(std::string(e.what()) == "base error");
    }
    std::cout << "[PASS] test_tracehub_error" << std::endl;
}

void test_config_error() {
    try {
        throw tracehub::TraceHubConfigError("bad config");
    } catch (const tracehub::TraceHubError& e) {
        assert(std::string(e.what()) == "bad config");
    }
    std::cout << "[PASS] test_config_error" << std::endl;
}

void test_transport_error() {
    try {
        throw tracehub::TraceHubTransportError("connection refused");
    } catch (const tracehub::TraceHubError& e) {
        assert(std::string(e.what()) == "connection refused");
    }
    std::cout << "[PASS] test_transport_error" << std::endl;
}

void test_hierarchy() {
    // TraceHubConfigError -> TraceHubError -> runtime_error
    bool caught_as_runtime = false;
    try {
        throw tracehub::TraceHubConfigError("test");
    } catch (const std::runtime_error&) {
        caught_as_runtime = true;
    }
    assert(caught_as_runtime);

    bool caught_as_base = false;
    try {
        throw tracehub::TraceHubTransportError("test");
    } catch (const tracehub::TraceHubError&) {
        caught_as_base = true;
    }
    assert(caught_as_base);

    std::cout << "[PASS] test_hierarchy" << std::endl;
}

int main() {
    test_tracehub_error();
    test_config_error();
    test_transport_error();
    test_hierarchy();
    std::cout << "\nAll exception tests passed!" << std::endl;
    return 0;
}
