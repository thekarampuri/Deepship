#pragma once

#include <string>
#include <memory>
#include <cstdlib>
#include <nlohmann/json.hpp>
#include "models.h"
#include "exceptions.h"
#include "buffer.h"
#include "enricher.h"
#include "batcher.h"
#include "transport.h"

// Windows.h macros conflict with LogLevel enum values — must undef after all includes
#ifdef ERROR
#undef ERROR
#endif
#ifdef DEBUG
#undef DEBUG
#endif
#ifdef FATAL
#undef FATAL
#endif

namespace tracehub {

static constexpr const char* SDK_VERSION = "1.2.0";
static constexpr const char* DEFAULT_ENDPOINT = "http://103.127.146.14";

struct TraceHubConfig {
    std::string api_key;
    std::string service;
    std::string environment;
    std::string endpoint = DEFAULT_ENDPOINT;
    size_t batch_size = 50;
    double flush_interval = 5.0;
    size_t max_buffer = 10000;
    int max_retries = 3;
    double timeout = 10.0;
    bool compress = true;
    std::string dlq_path;
};

class TraceHubLogger {
public:
    explicit TraceHubLogger(const TraceHubConfig& config)
        : config_(config) {
        validate_config();

        enricher_ = std::make_unique<Enricher>(
            config_.service, config_.environment, SDK_VERSION);

        buffer_ = std::make_unique<RingBuffer>(config_.max_buffer);

        transport_ = std::make_unique<HttpTransport>(
            config_.endpoint,
            config_.api_key,
            config_.max_retries,
            config_.timeout,
            config_.compress,
            config_.dlq_path);

        batcher_ = std::make_unique<BatchWorker>(
            *buffer_, *transport_,
            config_.batch_size,
            config_.flush_interval);

        // Replay any previously failed batches
        transport_->replay_dlq();

        // Start background flush thread
        batcher_->start();
    }

    ~TraceHubLogger() {
        close();
    }

    TraceHubLogger(const TraceHubLogger&) = delete;
    TraceHubLogger& operator=(const TraceHubLogger&) = delete;

    // ---- Logging methods (mirror Python SDK exactly) ----

    void debug(const std::string& message,
               const std::string& module_name = "",
               const nlohmann::json& extra = nlohmann::json::object()) {
        log(LogLevel::DEBUG, message, module_name, "", "", "", extra);
    }

    void info(const std::string& message,
              const std::string& module_name = "",
              const nlohmann::json& extra = nlohmann::json::object()) {
        log(LogLevel::INFO, message, module_name, "", "", "", extra);
    }

    void warn(const std::string& message,
              const std::string& module_name = "",
              const nlohmann::json& extra = nlohmann::json::object()) {
        log(LogLevel::WARN, message, module_name, "", "", "", extra);
    }

    void error(const std::string& message,
               const std::string& module_name = "",
               const std::string& error_type = "",
               const std::string& error_message = "",
               const std::string& stack_trace = "",
               const nlohmann::json& extra = nlohmann::json::object()) {
        log(LogLevel::ERROR, message, module_name, error_type, error_message, stack_trace, extra);
    }

    void fatal(const std::string& message,
               const std::string& module_name = "",
               const std::string& error_type = "",
               const std::string& error_message = "",
               const std::string& stack_trace = "",
               const nlohmann::json& extra = nlohmann::json::object()) {
        log(LogLevel::FATAL, message, module_name, error_type, error_message, stack_trace, extra);
    }

    void log(LogLevel level,
             const std::string& message,
             const std::string& module_name = "",
             const std::string& error_type = "",
             const std::string& error_message = "",
             const std::string& stack_trace = "",
             const nlohmann::json& extra = nlohmann::json::object()) {
        auto entry = enricher_->enrich(
            level, message, module_name,
            error_type, error_message, stack_trace, extra);
        buffer_->push(std::move(entry));
    }

    void flush() {
        // Trigger immediate flush
        batcher_->notify();
    }

    void close() {
        if (batcher_) {
            batcher_->stop();
            batcher_.reset();
        }
    }

private:
    TraceHubConfig config_;
    std::unique_ptr<Enricher> enricher_;
    std::unique_ptr<RingBuffer> buffer_;
    std::unique_ptr<HttpTransport> transport_;
    std::unique_ptr<BatchWorker> batcher_;

    void validate_config() {
        if (config_.api_key.empty()) {
            throw TraceHubConfigError("api_key is required");
        }
        if (config_.api_key.substr(0, 3) != "th_") {
            throw TraceHubConfigError("api_key must start with 'th_'");
        }
        if (config_.service.empty()) {
            throw TraceHubConfigError("service is required");
        }
        if (config_.environment.empty()) {
            throw TraceHubConfigError("environment is required");
        }
    }
};

} // namespace tracehub
