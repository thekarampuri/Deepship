"""Tests for tracehub.batcher."""

import time
from unittest.mock import MagicMock

from tracehub.batcher import BatchWorker
from tracehub.buffer import RingBuffer
from tracehub.models import LogEntry, LogLevel


def _entry(msg: str = "test") -> LogEntry:
    return LogEntry(level=LogLevel.INFO, message=msg)


class TestBatchWorker:
    def test_flush_on_batch_size(self):
        buf = RingBuffer(capacity=1000)
        transport = MagicMock()
        transport.send.return_value = True
        worker = BatchWorker(buf, transport, batch_size=5, flush_interval=60.0)

        for i in range(5):
            buf.push(_entry(str(i)))

        worker.start()
        time.sleep(2)
        worker.stop()

        assert transport.send.called
        assert buf.is_empty

    def test_flush_on_interval(self):
        buf = RingBuffer(capacity=1000)
        transport = MagicMock()
        transport.send.return_value = True
        worker = BatchWorker(buf, transport, batch_size=100, flush_interval=1.0)

        buf.push(_entry("interval-test"))

        worker.start()
        time.sleep(3)
        worker.stop()

        assert transport.send.called
        assert buf.is_empty

    def test_stop_flushes_remaining(self):
        buf = RingBuffer(capacity=1000)
        transport = MagicMock()
        transport.send.return_value = True
        worker = BatchWorker(buf, transport, batch_size=100, flush_interval=60.0)

        buf.push(_entry("leftover"))

        worker.start()
        worker.stop()

        assert transport.send.called
        assert buf.is_empty

    def test_manual_flush(self):
        buf = RingBuffer(capacity=1000)
        transport = MagicMock()
        transport.send.return_value = True
        worker = BatchWorker(buf, transport, batch_size=100, flush_interval=60.0)

        buf.push(_entry("manual"))
        worker._flush()

        assert transport.send.called
        assert buf.is_empty
