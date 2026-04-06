#pragma once

#include <string>
#include <chrono>
#include <sstream>
#include <iomanip>
#include <thread>
#include <cstdlib>

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#include <process.h>
// Windows.h defines ERROR, DEBUG as macros — kill them immediately
#ifdef ERROR
#undef ERROR
#endif
#ifdef DEBUG
#undef DEBUG
#endif
#ifdef FATAL
#undef FATAL
#endif
#endif

#include "models.h"

#ifndef _WIN32
#include <unistd.h>
#endif

namespace tracehub {

inline thread_local std::string _trace_id;

inline void set_trace_id(const std::string& tid) {
    _trace_id = tid;
}

inline void clear_trace_id() {
    _trace_id.clear();
}

inline std::string get_trace_id() {
    return _trace_id;
}

class Enricher {
public:
    Enricher(const std::string& service,
             const std::string& environment,
             const std::string& sdk_version)
        : service_(service)
        , environment_(environment)
        , sdk_version_(sdk_version) {
        // Cache hostname
        char hostname[256] = {0};
#ifdef _WIN32
        DWORD size = sizeof(hostname);
        GetComputerNameA(hostname, &size);
#else
        gethostname(hostname, sizeof(hostname));
#endif
        host_ = std::string(hostname);
    }

    LogEntry enrich(LogLevel level,
                    const std::string& message,
                    const std::string& module_name = "",
                    const std::string& error_type = "",
                    const std::string& error_message = "",
                    const std::string& stack_trace = "",
                    const nlohmann::json& extra = nlohmann::json::object()) const {
        LogEntry entry;
        entry.level = level;
        entry.message = message;
        entry.timestamp = now_iso();
        entry.service = service_;
        entry.environment = environment_;
        entry.host = host_;
        entry.pid = get_pid();
        entry.thread_id = get_thread_id();
        entry.sdk_version = sdk_version_;

        if (!_trace_id.empty())
            entry.trace_id = _trace_id;

        if (!module_name.empty())
            entry.module = module_name;

        if (!error_type.empty())
            entry.error_type = error_type;

        if (!error_message.empty())
            entry.error_message = error_message;

        if (!stack_trace.empty())
            entry.stack_trace = stack_trace;

        if (!extra.empty())
            entry.extra = extra;

        return entry;
    }

private:
    std::string service_;
    std::string environment_;
    std::string sdk_version_;
    std::string host_;

    static std::string now_iso() {
        auto now = std::chrono::system_clock::now();
        auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
            now.time_since_epoch()) % 1000;
        auto time = std::chrono::system_clock::to_time_t(now);

        struct tm utc_tm;
#ifdef _WIN32
        gmtime_s(&utc_tm, &time);
#else
        gmtime_r(&time, &utc_tm);
#endif

        std::ostringstream oss;
        oss << std::put_time(&utc_tm, "%Y-%m-%dT%H:%M:%S");
        oss << '.' << std::setfill('0') << std::setw(3) << ms.count();
        oss << "+00:00";
        return oss.str();
    }

    static int get_pid() {
#ifdef _WIN32
        return _getpid();
#else
        return static_cast<int>(getpid());
#endif
    }

    static std::string get_thread_id() {
        std::ostringstream oss;
        oss << std::this_thread::get_id();
        return oss.str();
    }
};

} // namespace tracehub
