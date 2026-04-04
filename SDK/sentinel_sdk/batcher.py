"""Background daemon thread that flushes the buffer on size or time triggers."""

from __future__ import annotations

import threading
import time
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from sentinel_sdk.buffer import RingBuffer
    from sentinel_sdk.transport import HttpTransport


class BatchWorker:
    """Polls the ring buffer every second and flushes when thresholds are met.

    Flush triggers:
      - SIZE: buffer contains >= *batch_size* entries.
      - TIME: >= *flush_interval* seconds since last flush.
    """

    def __init__(
        self,
        buffer: "RingBuffer",
        transport: "HttpTransport",
        batch_size: int = 50,
        flush_interval: float = 5.0,
    ) -> None:
        self._buffer = buffer
        self._transport = transport
        self._batch_size = batch_size
        self._flush_interval = flush_interval

        self._stop_event = threading.Event()
        self._thread = threading.Thread(target=self._run, daemon=True, name="sentinel-batcher")
        self._last_flush = time.monotonic()

    # -- lifecycle ----------------------------------------------------------

    def start(self) -> None:
        self._thread.start()

    def stop(self, timeout: float = 5.0) -> None:
        """Signal the worker to stop and wait for it to drain."""
        self._stop_event.set()
        self._thread.join(timeout=timeout)

    # -- internals ----------------------------------------------------------

    def _run(self) -> None:
        while not self._stop_event.is_set():
            self._stop_event.wait(timeout=1.0)
            self._maybe_flush()

        # Final drain on shutdown — send whatever is left.
        self._flush()

    def _maybe_flush(self) -> None:
        elapsed = time.monotonic() - self._last_flush
        if self._buffer.size >= self._batch_size or elapsed >= self._flush_interval:
            self._flush()

    def _flush(self) -> None:
        while not self._buffer.is_empty:
            batch = self._buffer.pop_batch(self._batch_size)
            if batch:
                self._transport.send(batch)
        self._last_flush = time.monotonic()
