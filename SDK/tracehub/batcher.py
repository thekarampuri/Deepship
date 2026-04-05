"""Background daemon thread that flushes the buffer on size or time triggers."""

from __future__ import annotations

import sys
import threading
import time
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tracehub.buffer import RingBuffer
    from tracehub.transport import HttpTransport


class BatchWorker:
    """Polls the ring buffer every second and flushes when thresholds are met.

    Flush triggers:
      - SIZE: buffer contains >= *batch_size* entries.
      - TIME: >= *flush_interval* seconds since last flush.

    The worker thread is fault-tolerant: if a flush raises an unexpected
    exception the thread logs the error and keeps running instead of dying
    silently.  If the thread does die (e.g. a truly fatal error), the next
    call to ``_ensure_alive`` — triggered by ``_flush`` or ``_maybe_flush``
    — will restart it automatically.
    """

    _MAX_RESTART_ATTEMPTS = 5
    _RESTART_COOLDOWN = 2.0  # seconds between restart attempts

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
        self._thread: threading.Thread | None = None
        self._last_flush = time.monotonic()
        self._restart_count = 0
        self._lock = threading.Lock()

    # -- lifecycle ----------------------------------------------------------

    def start(self) -> None:
        self._start_thread()

    def stop(self, timeout: float = 5.0) -> None:
        """Signal the worker to stop and wait for it to drain."""
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=timeout)

    # -- internals ----------------------------------------------------------

    def _start_thread(self) -> None:
        self._thread = threading.Thread(target=self._run, daemon=True, name="tracehub-batcher")
        self._thread.start()

    def _ensure_alive(self) -> None:
        """Restart the background thread if it died unexpectedly."""
        if self._stop_event.is_set():
            return
        if self._thread is not None and self._thread.is_alive():
            return
        with self._lock:
            # Double-check under lock
            if self._thread is not None and self._thread.is_alive():
                return
            if self._restart_count >= self._MAX_RESTART_ATTEMPTS:
                return
            self._restart_count += 1
            print(
                f"[tracehub] batcher thread died, restarting "
                f"(attempt {self._restart_count}/{self._MAX_RESTART_ATTEMPTS})",
                file=sys.stderr,
            )
            time.sleep(self._RESTART_COOLDOWN)
            self._start_thread()

    def _run(self) -> None:
        while not self._stop_event.is_set():
            self._stop_event.wait(timeout=1.0)
            try:
                self._maybe_flush()
            except Exception as exc:
                print(f"[tracehub] flush error (continuing): {exc}", file=sys.stderr)

        # Final drain on shutdown — send whatever is left.
        try:
            self._flush()
        except Exception as exc:
            print(f"[tracehub] final flush error: {exc}", file=sys.stderr)

    def _maybe_flush(self) -> None:
        self._ensure_alive()
        elapsed = time.monotonic() - self._last_flush
        if self._buffer.size >= self._batch_size or elapsed >= self._flush_interval:
            self._flush()

    def _flush(self) -> None:
        while not self._buffer.is_empty:
            batch = self._buffer.pop_batch(self._batch_size)
            if batch:
                self._transport.send(batch)
        self._last_flush = time.monotonic()
