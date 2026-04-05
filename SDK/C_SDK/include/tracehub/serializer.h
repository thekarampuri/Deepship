#pragma once

#include <string>
#include <vector>
#include <stdexcept>
#include <nlohmann/json.hpp>
#include <zlib.h>
#include "models.h"

namespace tracehub {

struct SerializedPayload {
    std::string data;
    bool compressed = false;
};

inline SerializedPayload serialize(const std::vector<LogEntry>& entries, bool compress = true) {
    // Convert entries to JSON array
    nlohmann::json json_array = nlohmann::json::array();
    for (const auto& entry : entries) {
        json_array.push_back(entry.to_json());
    }

    std::string json_str = json_array.dump();

    if (!compress) {
        return {json_str, false};
    }

    // Gzip compress
    z_stream zs{};
    // windowBits = 15 + 16 = gzip format
    if (deflateInit2(&zs, Z_DEFAULT_COMPRESSION, Z_DEFLATED, 15 + 16, 8, Z_DEFAULT_STRATEGY) != Z_OK) {
        throw std::runtime_error("Failed to initialize zlib for gzip compression");
    }

    zs.next_in = reinterpret_cast<Bytef*>(const_cast<char*>(json_str.data()));
    zs.avail_in = static_cast<uInt>(json_str.size());

    std::string compressed_data;
    char buffer[32768];

    int ret;
    do {
        zs.next_out = reinterpret_cast<Bytef*>(buffer);
        zs.avail_out = sizeof(buffer);
        ret = deflate(&zs, Z_FINISH);
        if (ret == Z_STREAM_ERROR) {
            deflateEnd(&zs);
            throw std::runtime_error("zlib compression error");
        }
        compressed_data.append(buffer, sizeof(buffer) - zs.avail_out);
    } while (zs.avail_out == 0);

    deflateEnd(&zs);

    return {compressed_data, true};
}

} // namespace tracehub
