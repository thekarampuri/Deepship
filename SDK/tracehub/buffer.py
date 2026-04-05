"""Thread-safe ring buffer backed by collections.deque."""

from __future__ import annotations

import threading
from collections import deque
from typing import List

from tracehub.models import LogEntry


class RingBuffer:
    """Fixed-capacity, thread-safe buffer.

    When the buffer is full the *oldest* entry is silently dropped —
    this guarantees the host application never blocks or runs out of memory.
    """

    def __init__(self, capacity: int = 10_000) -> None:
        self._buffer: deque[LogEntry] = deque(maxlen=capacity)
        self._lock = threading.Lock()

    # -- public API ---------------------------------------------------------

    def push(self, entry: LogEntry) -> None:
        """Append a log entry (called from the app thread)."""
        with self._lock:
            self._buffer.append(entry)

    def pop_batch(self, size: int = 50) -> List[LogEntry]:
        """Drain up to *size* entries (called from the BatchWorker thread)."""
        with self._lock:
            count = min(size, len(self._buffer))
            batch = [self._buffer.popleft() for _ in range(count)]
        return batch

    @property
    def size(self) -> int:
        with self._lock:
            return len(self._buffer)

    @property
    def is_empty(self) -> bool:
        return self.size == 0
