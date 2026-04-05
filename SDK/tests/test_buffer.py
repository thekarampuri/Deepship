"""Tests for sentinel_sdk.buffer."""

import threading

from sentinel_sdk.buffer import RingBuffer
from sentinel_sdk.models import LogEntry, LogLevel


def _entry(msg: str = "test") -> LogEntry:
    return LogEntry(level=LogLevel.INFO, message=msg)


class TestRingBuffer:
    def test_push_and_pop(self):
        buf = RingBuffer(capacity=100)
        buf.push(_entry("a"))
        buf.push(_entry("b"))
        assert buf.size == 2
        batch = buf.pop_batch(10)
        assert len(batch) == 2
        assert batch[0].message == "a"
        assert batch[1].message == "b"
        assert buf.is_empty

    def test_pop_batch_respects_size(self):
        buf = RingBuffer(capacity=100)
        for i in range(10):
            buf.push(_entry(str(i)))
        batch = buf.pop_batch(3)
        assert len(batch) == 3
        assert buf.size == 7

    def test_capacity_drops_oldest(self):
        buf = RingBuffer(capacity=3)
        for i in range(5):
            buf.push(_entry(str(i)))
        assert buf.size == 3
        batch = buf.pop_batch(10)
        assert [e.message for e in batch] == ["2", "3", "4"]

    def test_empty_pop(self):
        buf = RingBuffer(capacity=10)
        assert buf.pop_batch(5) == []
        assert buf.is_empty

    def test_thread_safety(self):
        buf = RingBuffer(capacity=10_000)
        errors = []

        def writer():
            try:
                for i in range(1000):
                    buf.push(_entry(str(i)))
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=writer) for _ in range(4)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors
        assert buf.size <= 10_000
