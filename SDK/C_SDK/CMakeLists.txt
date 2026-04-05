cmake_minimum_required(VERSION 3.16)
project(tracehub-cpp-sdk VERSION 1.2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ---- Dependencies ----
find_package(CURL REQUIRED)
find_package(ZLIB REQUIRED)

# nlohmann/json — try find_package first, fall back to FetchContent
find_package(nlohmann_json QUIET)
if(NOT nlohmann_json_FOUND)
    include(FetchContent)
    FetchContent_Declare(
        nlohmann_json
        URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
    )
    FetchContent_MakeAvailable(nlohmann_json)
endif()

# ---- Library (header-only) ----
add_library(tracehub INTERFACE)
target_include_directories(tracehub INTERFACE
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)
target_link_libraries(tracehub INTERFACE
    CURL::libcurl
    ZLIB::ZLIB
    nlohmann_json::nlohmann_json
)

# ---- Example ----
option(TRACEHUB_BUILD_EXAMPLES "Build example programs" ON)
if(TRACEHUB_BUILD_EXAMPLES)
    add_executable(tracehub_example examples/basic_usage.cpp)
    target_link_libraries(tracehub_example PRIVATE tracehub)
endif()

# ---- Tests ----
option(TRACEHUB_BUILD_TESTS "Build tests" ON)
if(TRACEHUB_BUILD_TESTS)
    enable_testing()

    add_executable(test_models tests/test_models.cpp)
    target_link_libraries(test_models PRIVATE tracehub)
    add_test(NAME test_models COMMAND test_models)

    add_executable(test_buffer tests/test_buffer.cpp)
    target_link_libraries(test_buffer PRIVATE tracehub)
    add_test(NAME test_buffer COMMAND test_buffer)

    add_executable(test_enricher tests/test_enricher.cpp)
    target_link_libraries(test_enricher PRIVATE tracehub)
    add_test(NAME test_enricher COMMAND test_enricher)

    add_executable(test_serializer tests/test_serializer.cpp)
    target_link_libraries(test_serializer PRIVATE tracehub)
    add_test(NAME test_serializer COMMAND test_serializer)

    add_executable(test_exceptions tests/test_exceptions.cpp)
    target_link_libraries(test_exceptions PRIVATE tracehub)
    add_test(NAME test_exceptions COMMAND test_exceptions)
endif()

# ---- Install ----
install(TARGETS tracehub EXPORT tracehub-targets)
install(DIRECTORY include/tracehub DESTINATION include)
install(EXPORT tracehub-targets
    FILE tracehub-config.cmake
    NAMESPACE tracehub::
    DESTINATION lib/cmake/tracehub
)
