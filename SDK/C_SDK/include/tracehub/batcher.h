#pragma once

#include <thread>
#include <atomic>
#include <chrono>
#include <mutex>
#include <condition_variable>
#include <iostream>
#include <functional>
#include "buffer.h"
#include "transport.h"

namespace tracehub {

class BatchWorker {
public:
    BatchWorker(RingBuffer& buffer,
                HttpTransport& transport,
                size_t batch_size = 50,
                double flush_interval = 5.0)
        : buffer_(buffer)
        , transport_(transport)
        , batch_size_(batch_size)
        , flush_interval_(flush_interval)
        , running_(false)
        , restart_count_(0)
        , max_restarts_(5) {}

    ~BatchWorker() {
        stop();
    }

    BatchWorker(const BatchWorker&) = delete;
    BatchWorker& operator=(const BatchWorker&) = delete;

    void start() {
        running_ = true;
        last_flush_ = std::chrono::steady_clock::now();
        worker_thread_ = std::thread(&BatchWorker::run, this);
    }

    void stop() {
        if (!running_) return;
        running_ = false;
        cv_.notify_all();
        if (worker_thread_.joinable()) {
            worker_thread_.join();
        }
        // Final drain
        flush_remaining();
    }

    void notify() {
        cv_.notify_one();
    }

private:
    RingBuffer& buffer_;
    HttpTransport& transport_;
    size_t batch_size_;
    double flush_interval_;
    std::atomic<bool> running_;
    std::thread worker_thread_;
    std::mutex cv_mutex_;
    std::condition_variable cv_;
    std::chrono::steady_clock::time_point last_flush_;
    int restart_count_;
    int max_restarts_;

    void run() {
        while (running_) {
            try {
                std::unique_lock<std::mutex> lock(cv_mutex_);
                cv_.wait_for(lock, std::chrono::seconds(1));

                if (!running_) break;

                auto now = std::chrono::steady_clock::now();
                double elapsed = std::chrono::duration<double>(now - last_flush_).count();

                bool size_trigger = buffer_.size() >= batch_size_;
                bool time_trigger = elapsed >= flush_interval_;

                if (size_trigger || time_trigger) {
                    flush();
                    last_flush_ = std::chrono::steady_clock::now();
                }
            } catch (const std::exception& e) {
                std::cerr << "[TraceHub] BatchWorker error: " << e.what() << std::endl;
                restart_count_++;
                if (restart_count_ >= max_restarts_) {
                    std::cerr << "[TraceHub] BatchWorker max restarts reached, stopping"
                              << std::endl;
                    running_ = false;
                    break;
                }
                std::this_thread::sleep_for(std::chrono::seconds(2));
            }
        }
    }

    void flush() {
        while (buffer_.size() > 0) {
            auto batch = buffer_.drain(batch_size_);
            if (batch.empty()) break;
            transport_.send(batch);
        }
    }

    void flush_remaining() {
        auto remaining = buffer_.drain_all();
        if (!remaining.empty()) {
            // Send in batches
            for (size_t i = 0; i < remaining.size(); i += batch_size_) {
                size_t end = std::min(i + batch_size_, remaining.size());
                std::vector<LogEntry> batch(
                    std::make_move_iterator(remaining.begin() + i),
                    std::make_move_iterator(remaining.begin() + end));
                transport_.send(batch);
            }
        }
    }
};

} // namespace tracehub
