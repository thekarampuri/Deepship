#pragma once

// TraceHub C++ SDK v1.2.0
// Single-include header for the TraceHub logging SDK.
//
// Usage:
//   #include <tracehub/tracehub.h>
//
// Dependencies:
//   - nlohmann/json (header-only JSON library)
//   - libcurl (HTTP client)
//   - zlib (gzip compression)

#include "models.h"
#include "exceptions.h"
#include "buffer.h"
#include "enricher.h"
#include "serializer.h"
#include "transport.h"
#include "batcher.h"
#include "client.h"
