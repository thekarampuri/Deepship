#pragma once

#include <deque>
#include <mutex>
#include <vector>
#include <cstddef>
#include "models.h"

namespace tracehub {

class RingBuffer {
public:
    explicit RingBuffer(size_t capacity = 10000)
        : capacity_(capacity) {}

    void push(LogEntry entry) {
        std::lock_guard<std::mutex> lock(mutex_);
        if (buffer_.size() >= capacity_) {
            buffer_.pop_front();
        }
        buffer_.push_back(std::move(entry));
    }

    std::vector<LogEntry> drain(size_t count) {
        std::lock_guard<std::mutex> lock(mutex_);
        std::vector<LogEntry> batch;
        size_t n = std::min(count, buffer_.size());
        batch.reserve(n);
        for (size_t i = 0; i < n; ++i) {
            batch.push_back(std::move(buffer_.front()));
            buffer_.pop_front();
        }
        return batch;
    }

    std::vector<LogEntry> drain_all() {
        std::lock_guard<std::mutex> lock(mutex_);
        std::vector<LogEntry> batch;
        batch.reserve(buffer_.size());
        while (!buffer_.empty()) {
            batch.push_back(std::move(buffer_.front()));
            buffer_.pop_front();
        }
        return batch;
    }

    size_t size() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return buffer_.size();
    }

    bool empty() const {
        std::lock_guard<std::mutex> lock(mutex_);
        return buffer_.empty();
    }

    size_t capacity() const {
        return capacity_;
    }

private:
    size_t capacity_;
    std::deque<LogEntry> buffer_;
    mutable std::mutex mutex_;
};

} // namespace tracehub
