#pragma once

#include <stdexcept>
#include <string>

namespace tracehub {

class TraceHubError : public std::runtime_error {
public:
    explicit TraceHubError(const std::string& msg)
        : std::runtime_error(msg) {}
};

class TraceHubConfigError : public TraceHubError {
public:
    explicit TraceHubConfigError(const std::string& msg)
        : TraceHubError(msg) {}
};

class TraceHubTransportError : public TraceHubError {
public:
    explicit TraceHubTransportError(const std::string& msg)
        : TraceHubError(msg) {}
};

} // namespace tracehub
