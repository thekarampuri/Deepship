#pragma once

#include <string>
#include <vector>
#include <fstream>
#include <iostream>
#include <filesystem>
#include <chrono>
#include <thread>
#include <mutex>
#include <atomic>
#include <curl/curl.h>
#include "models.h"
#include "serializer.h"
#include "exceptions.h"

namespace tracehub {

class DeadLetterQueue {
public:
    explicit DeadLetterQueue(const std::string& dlq_path = "")
        : dlq_path_(dlq_path) {
        if (dlq_path_.empty()) {
#ifdef _WIN32
            const char* home = std::getenv("USERPROFILE");
#else
            const char* home = std::getenv("HOME");
#endif
            if (home) {
                dlq_path_ = std::string(home) + "/.tracehub/dlq";
            } else {
                dlq_path_ = ".tracehub/dlq";
            }
        }
        std::filesystem::create_directories(dlq_path_);
    }

    void save(const std::vector<LogEntry>& entries) {
        auto now = std::chrono::system_clock::now();
        auto epoch_ms = std::chrono::duration_cast<std::chrono::milliseconds>(
            now.time_since_epoch()).count();

        std::string filename = dlq_path_ + "/failed_" + std::to_string(epoch_ms) + ".jsonl";
        std::ofstream ofs(filename);
        if (!ofs.is_open()) {
            std::cerr << "[TraceHub] Failed to write DLQ file: " << filename << std::endl;
            return;
        }
        for (const auto& entry : entries) {
            ofs << entry.to_json().dump() << "\n";
        }
        ofs.close();
    }

    std::vector<std::vector<LogEntry>> load_all() {
        std::vector<std::vector<LogEntry>> batches;
        if (!std::filesystem::exists(dlq_path_)) return batches;

        for (const auto& file : std::filesystem::directory_iterator(dlq_path_)) {
            if (file.path().extension() != ".jsonl") continue;
            std::ifstream ifs(file.path());
            if (!ifs.is_open()) continue;

            std::vector<LogEntry> batch;
            std::string line;
            while (std::getline(ifs, line)) {
                if (line.empty()) continue;
                try {
                    auto j = nlohmann::json::parse(line);
                    batch.push_back(LogEntry::from_json(j));
                } catch (...) {
                    // Skip malformed lines
                }
            }
            ifs.close();

            if (!batch.empty()) {
                batches.push_back(std::move(batch));
            }

            // Remove processed file
            std::filesystem::remove(file.path());
        }
        return batches;
    }

private:
    std::string dlq_path_;
};

class HttpTransport {
public:
    HttpTransport(const std::string& endpoint,
                  const std::string& api_key,
                  int max_retries = 3,
                  double timeout = 10.0,
                  bool compress = true,
                  const std::string& dlq_path = "")
        : endpoint_(endpoint)
        , api_key_(api_key)
        , max_retries_(max_retries)
        , timeout_sec_(timeout)
        , compress_(compress)
        , dlq_(dlq_path)
        , consecutive_failures_(0) {
        ingest_url_ = endpoint_ + "/api/v1/ingest";
        create_client();
    }

    ~HttpTransport() {
        if (curl_) {
            curl_easy_cleanup(curl_);
            curl_ = nullptr;
        }
    }

    HttpTransport(const HttpTransport&) = delete;
    HttpTransport& operator=(const HttpTransport&) = delete;

    bool send(const std::vector<LogEntry>& entries) {
        SerializedPayload payload;
        try {
            payload = serialize(entries, compress_);
        } catch (const std::exception& e) {
            std::cerr << "[TraceHub] Serialization error: " << e.what() << std::endl;
            dlq_.save(entries);
            return false;
        }

        for (int attempt = 0; attempt <= max_retries_; ++attempt) {
            if (attempt > 0) {
                int backoff = 1 << attempt; // 2^attempt seconds
                std::this_thread::sleep_for(std::chrono::seconds(backoff));
            }

            long http_code = 0;
            bool success = do_post(payload, http_code);

            if (success && (http_code == 200 || http_code == 202)) {
                consecutive_failures_ = 0;
                return true;
            }

            if (http_code >= 400 && http_code < 500) {
                std::cerr << "[TraceHub] Client error " << http_code
                          << ", saving to DLQ" << std::endl;
                dlq_.save(entries);
                return false;
            }

            // Server error or network failure
            consecutive_failures_++;
            if (consecutive_failures_ >= 2) {
                recreate_client();
                consecutive_failures_ = 0;
            }

            if (attempt < max_retries_) {
                std::cerr << "[TraceHub] Retry " << (attempt + 1) << "/" << max_retries_
                          << " after error (HTTP " << http_code << ")" << std::endl;
            }
        }

        std::cerr << "[TraceHub] All retries exhausted, saving to DLQ" << std::endl;
        dlq_.save(entries);
        return false;
    }

    void replay_dlq() {
        auto batches = dlq_.load_all();
        for (auto& batch : batches) {
            try {
                send(batch);
            } catch (...) {
                // Best-effort replay
            }
        }
    }

private:
    std::string endpoint_;
    std::string api_key_;
    std::string ingest_url_;
    int max_retries_;
    double timeout_sec_;
    bool compress_;
    DeadLetterQueue dlq_;
    CURL* curl_ = nullptr;
    std::mutex curl_mutex_;
    int consecutive_failures_;

    void create_client() {
        if (curl_) {
            curl_easy_cleanup(curl_);
        }
        curl_ = curl_easy_init();
    }

    void recreate_client() {
        std::lock_guard<std::mutex> lock(curl_mutex_);
        create_client();
    }

    static size_t write_callback(void* contents, size_t size, size_t nmemb, void* userp) {
        (void)contents;
        (void)userp;
        return size * nmemb; // Discard response body
    }

    bool do_post(const SerializedPayload& payload, long& http_code) {
        std::lock_guard<std::mutex> lock(curl_mutex_);
        if (!curl_) {
            create_client();
            if (!curl_) return false;
        }

        curl_easy_reset(curl_);
        curl_easy_setopt(curl_, CURLOPT_URL, ingest_url_.c_str());
        curl_easy_setopt(curl_, CURLOPT_POST, 1L);
        curl_easy_setopt(curl_, CURLOPT_POSTFIELDS, payload.data.data());
        curl_easy_setopt(curl_, CURLOPT_POSTFIELDSIZE, static_cast<long>(payload.data.size()));
        curl_easy_setopt(curl_, CURLOPT_TIMEOUT, static_cast<long>(timeout_sec_));
        curl_easy_setopt(curl_, CURLOPT_WRITEFUNCTION, write_callback);

        struct curl_slist* headers = nullptr;
        std::string api_header = "X-API-Key: " + api_key_;
        headers = curl_slist_append(headers, api_header.c_str());
        headers = curl_slist_append(headers, "Content-Type: application/json");
        if (payload.compressed) {
            headers = curl_slist_append(headers, "Content-Encoding: gzip");
        }
        curl_easy_setopt(curl_, CURLOPT_HTTPHEADER, headers);

        CURLcode res = curl_easy_perform(curl_);
        if (res != CURLE_OK) {
            curl_slist_free_all(headers);
            return false;
        }

        curl_easy_getinfo(curl_, CURLINFO_RESPONSE_CODE, &http_code);
        curl_slist_free_all(headers);
        return true;
    }
};

} // namespace tracehub
