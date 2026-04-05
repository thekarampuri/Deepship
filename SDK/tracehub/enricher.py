"""Metadata enrichment — runs synchronously on the caller's thread (~1ms)."""

from __future__ import annotations

import os
import socket
import sys
import threading
import traceback
from datetime import datetime, timezone
from typing import Optional

import tracehub
from tracehub.models import LogEntry, LogLevel

# Thread-local storage for trace_id (set by framework integrations).
_thread_local = threading.local()


def set_trace_id(trace_id: str) -> None:
    """Set the trace ID for the current thread (called by integrations)."""
    _thread_local.trace_id = trace_id


def get_trace_id() -> str:
    """Return the current thread's trace ID, or empty string if not set."""
    return getattr(_thread_local, "trace_id", "")


def clear_trace_id() -> None:
    """Clear the trace ID for the current thread."""
    _thread_local.trace_id = ""


class Enricher:
    """Attaches host, env, timestamp, stack trace and other metadata to logs."""

    def __init__(self, service: str, environment: str) -> None:
        self._service = service
        self._environment = environment
        self._host = socket.gethostname()
        self._sdk_version = tracehub.__version__

    def enrich(
        self,
        level: LogLevel,
        message: str,
        module: str = "",
        exc_info: bool = False,
        exception: Optional[BaseException] = None,
        error_message: Optional[str] = None,
        stack_trace: Optional[str] = None,
        extra: Optional[dict] = None,
    ) -> LogEntry:
        entry = LogEntry(
            level=level,
            message=message,
            timestamp=datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
            service=self._service,
            environment=self._environment,
            host=self._host,
            pid=os.getpid(),
            thread_id=threading.current_thread().name,
            sdk_version=self._sdk_version,
            trace_id=get_trace_id(),
            module=module,
            extra=extra or {},
        )

        # Priority 1: explicit exception object passed by the caller
        if exception is not None:
            entry.error_type = type(exception).__name__
            entry.error_message = str(exception)
            entry.stack_trace = "".join(
                traceback.format_exception(type(exception), exception, exception.__traceback__)
            )
        # Priority 2: auto-capture from sys.exc_info() (active except block)
        elif exc_info:
            exc = sys.exc_info()
            if exc[0] is not None:
                entry.stack_trace = traceback.format_exc()
                entry.error_type = exc[0].__name__
                if exc[1] is not None:
                    entry.error_message = str(exc[1])
            else:
                # No active exception — capture the caller's stack trace
                entry.stack_trace = "".join(traceback.format_stack()[:-1])

        # Priority 3: explicit stack_trace string
        if stack_trace:
            entry.stack_trace = stack_trace

        # Allow explicit error_message to override auto-captured one
        if error_message:
            entry.error_message = error_message

        return entry
