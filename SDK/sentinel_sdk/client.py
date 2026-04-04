"""Public-facing SentinelLogger — the only class developers interact with."""

from __future__ import annotations

import atexit
from typing import Any, Optional

from sentinel_sdk.batcher import BatchWorker
from sentinel_sdk.buffer import RingBuffer
from sentinel_sdk.enricher import Enricher
from sentinel_sdk.exceptions import SentinelConfigError
from sentinel_sdk.models import LogLevel
from sentinel_sdk.transport import HttpTransport


class SentinelLogger:
    """Lightweight, non-blocking logger that ships logs to the Sentinel backend.

    Usage::

        logger = SentinelLogger(
            api_key="proj_abc123",
            service="auth-service",
            environment="production",
            endpoint="https://sentinel.yourdomain.com",
        )

        logger.info("user logged in", module="auth")

        try:
            db.connect()
        except Exception:
            logger.error("DB connection failed", exc_info=True, module="db")
    """

    def __init__(
        self,
        api_key: str,
        service: str,
        environment: str,
        endpoint: str,
        *,
        batch_size: int = 50,
        flush_interval: float = 5.0,
        max_buffer: int = 10_000,
        max_retries: int = 3,
        timeout: float = 10.0,
        compress: bool = True,
        dlq_path: str = "~/.sentinel/dlq",
    ) -> None:
        if not api_key:
            raise SentinelConfigError("api_key is required")
        if not endpoint:
            raise SentinelConfigError("endpoint is required")

        self._enricher = Enricher(service=service, environment=environment)
        self._buffer = RingBuffer(capacity=max_buffer)
        self._transport = HttpTransport(
            endpoint=endpoint,
            api_key=api_key,
            timeout=timeout,
            max_retries=max_retries,
            compress=compress,
            dlq_path=dlq_path,
        )
        self._batcher = BatchWorker(
            buffer=self._buffer,
            transport=self._transport,
            batch_size=batch_size,
            flush_interval=flush_interval,
        )

        # Replay any previously failed batches from the dead-letter queue.
        self._transport.replay_dlq()

        # Start the background flush thread.
        self._batcher.start()

        # Ensure we flush remaining logs when the process exits.
        atexit.register(self.close)

    # -- public logging methods ---------------------------------------------

    def debug(self, message: str, *, module: str = "", extra: Optional[dict[str, Any]] = None) -> None:
        self._log(LogLevel.DEBUG, message, module=module, extra=extra)

    def info(self, message: str, *, module: str = "", extra: Optional[dict[str, Any]] = None) -> None:
        self._log(LogLevel.INFO, message, module=module, extra=extra)

    def warn(self, message: str, *, module: str = "", extra: Optional[dict[str, Any]] = None) -> None:
        self._log(LogLevel.WARN, message, module=module, extra=extra)

    def error(
        self,
        message: str,
        *,
        exc_info: bool = False,
        module: str = "",
        extra: Optional[dict[str, Any]] = None,
    ) -> None:
        self._log(LogLevel.ERROR, message, exc_info=exc_info, module=module, extra=extra)

    def fatal(
        self,
        message: str,
        *,
        exc_info: bool = False,
        module: str = "",
        extra: Optional[dict[str, Any]] = None,
    ) -> None:
        self._log(LogLevel.FATAL, message, exc_info=exc_info, module=module, extra=extra)

    # -- lifecycle ----------------------------------------------------------

    def flush(self) -> None:
        """Force an immediate flush of the buffer (useful in tests or scripts)."""
        self._batcher._flush()

    def close(self) -> None:
        """Stop the background thread and flush remaining logs."""
        self._batcher.stop()
        self._transport.close()

    # -- internals ----------------------------------------------------------

    def _log(
        self,
        level: LogLevel,
        message: str,
        *,
        exc_info: bool = False,
        module: str = "",
        extra: Optional[dict] = None,
    ) -> None:
        entry = self._enricher.enrich(
            level=level,
            message=message,
            module=module,
            exc_info=exc_info,
            extra=extra,
        )
        self._buffer.push(entry)
