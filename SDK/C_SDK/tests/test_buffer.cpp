#include <tracehub/buffer.h>
#include <cassert>
#include <iostream>
#include <thread>
#include <vector>

void test_push_and_drain() {
    tracehub::RingBuffer buf(100);

    tracehub::LogEntry e1;
    e1.message = "msg1";
    tracehub::LogEntry e2;
    e2.message = "msg2";

    buf.push(e1);
    buf.push(e2);

    assert(buf.size() == 2);

    auto batch = buf.drain(1);
    assert(batch.size() == 1);
    assert(batch[0].message == "msg1");
    assert(buf.size() == 1);

    auto rest = buf.drain_all();
    assert(rest.size() == 1);
    assert(rest[0].message == "msg2");
    assert(buf.empty());

    std::cout << "[PASS] test_push_and_drain" << std::endl;
}

void test_capacity_overflow() {
    tracehub::RingBuffer buf(3);

    for (int i = 0; i < 5; ++i) {
        tracehub::LogEntry e;
        e.message = "msg" + std::to_string(i);
        buf.push(e);
    }

    assert(buf.size() == 3);

    auto all = buf.drain_all();
    assert(all[0].message == "msg2");
    assert(all[1].message == "msg3");
    assert(all[2].message == "msg4");

    std::cout << "[PASS] test_capacity_overflow" << std::endl;
}

void test_thread_safety() {
    tracehub::RingBuffer buf(10000);
    const int per_thread = 500;
    const int num_threads = 4;

    std::vector<std::thread> threads;
    for (int t = 0; t < num_threads; ++t) {
        threads.emplace_back([&buf, t, per_thread]() {
            for (int i = 0; i < per_thread; ++i) {
                tracehub::LogEntry e;
                e.message = "t" + std::to_string(t) + "_" + std::to_string(i);
                buf.push(e);
            }
        });
    }
    for (auto& th : threads) th.join();

    assert(buf.size() == static_cast<size_t>(num_threads * per_thread));
    auto all = buf.drain_all();
    assert(all.size() == static_cast<size_t>(num_threads * per_thread));
    assert(buf.empty());

    std::cout << "[PASS] test_thread_safety" << std::endl;
}

void test_empty_drain() {
    tracehub::RingBuffer buf(10);
    auto batch = buf.drain(5);
    assert(batch.empty());
    auto all = buf.drain_all();
    assert(all.empty());
    std::cout << "[PASS] test_empty_drain" << std::endl;
}

int main() {
    test_push_and_drain();
    test_capacity_overflow();
    test_thread_safety();
    test_empty_drain();
    std::cout << "\nAll buffer tests passed!" << std::endl;
    return 0;
}
