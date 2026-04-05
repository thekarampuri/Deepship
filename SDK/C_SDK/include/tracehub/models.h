#pragma once

#include <string>
#include <unordered_map>
#include <optional>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <nlohmann/json.hpp>

namespace tracehub {

enum class LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
    FATAL
};

inline std::string log_level_to_string(LogLevel level) {
    switch (level) {
        case LogLevel::DEBUG: return "DEBUG";
        case LogLevel::INFO:  return "INFO";
        case LogLevel::WARN:  return "WARN";
        case LogLevel::ERROR: return "ERROR";
        case LogLevel::FATAL: return "FATAL";
        default:              return "INFO";
    }
}

inline LogLevel string_to_log_level(const std::string& s) {
    if (s == "DEBUG") return LogLevel::DEBUG;
    if (s == "INFO")  return LogLevel::INFO;
    if (s == "WARN")  return LogLevel::WARN;
    if (s == "ERROR") return LogLevel::ERROR;
    if (s == "FATAL") return LogLevel::FATAL;
    return LogLevel::INFO;
}

struct LogEntry {
    LogLevel level = LogLevel::INFO;
    std::string message;
    std::string timestamp;
    std::string service;
    std::string environment;
    std::string host;
    int pid = 0;
    std::string thread_id;
    std::string sdk_version;
    std::optional<std::string> trace_id;
    std::optional<std::string> module;
    std::optional<std::string> stack_trace;
    std::optional<std::string> error_type;
    std::optional<std::string> error_message;
    nlohmann::json extra = nlohmann::json::object();

    nlohmann::json to_json() const {
        nlohmann::json j;
        j["level"] = log_level_to_string(level);
        j["message"] = message;
        j["timestamp"] = timestamp;
        j["service"] = service;
        j["environment"] = environment;
        j["host"] = host;
        j["pid"] = pid;
        j["thread_id"] = thread_id;
        j["sdk_version"] = sdk_version;

        if (trace_id.has_value())
            j["trace_id"] = trace_id.value();
        else
            j["trace_id"] = nullptr;

        if (module.has_value())
            j["module"] = module.value();

        if (stack_trace.has_value())
            j["stack_trace"] = stack_trace.value();

        if (error_type.has_value())
            j["error_type"] = error_type.value();

        if (error_message.has_value())
            j["error_message"] = error_message.value();

        if (!extra.empty())
            j["extra"] = extra;
        else
            j["extra"] = nlohmann::json::object();

        return j;
    }

    static LogEntry from_json(const nlohmann::json& j) {
        LogEntry entry;
        entry.level = string_to_log_level(j.at("level").get<std::string>());
        entry.message = j.at("message").get<std::string>();
        entry.timestamp = j.at("timestamp").get<std::string>();
        entry.service = j.at("service").get<std::string>();
        entry.environment = j.at("environment").get<std::string>();
        entry.host = j.at("host").get<std::string>();
        entry.pid = j.at("pid").get<int>();
        entry.thread_id = j.at("thread_id").get<std::string>();
        entry.sdk_version = j.at("sdk_version").get<std::string>();

        if (j.contains("trace_id") && !j["trace_id"].is_null())
            entry.trace_id = j["trace_id"].get<std::string>();
        if (j.contains("module"))
            entry.module = j["module"].get<std::string>();
        if (j.contains("stack_trace"))
            entry.stack_trace = j["stack_trace"].get<std::string>();
        if (j.contains("error_type"))
            entry.error_type = j["error_type"].get<std::string>();
        if (j.contains("error_message"))
            entry.error_message = j["error_message"].get<std::string>();
        if (j.contains("extra"))
            entry.extra = j["extra"];

        return entry;
    }
};

} // namespace tracehub
