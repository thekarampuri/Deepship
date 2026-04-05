"""Django middleware — auto-generates and propagates trace_id per request."""

from __future__ import annotations

import uuid
from typing import Callable

from tracehub.enricher import clear_trace_id, set_trace_id


class TraceHubMiddleware:
    """Django middleware that assigns a unique trace_id to every HTTP request.

    Add to ``MIDDLEWARE`` in your Django settings::

        MIDDLEWARE = [
            "tracehub.integrations.django.TraceHubMiddleware",
            ...
        ]

    All logs emitted via :class:`TraceHubLogger` during a request will
    automatically include this trace_id, enabling end-to-end tracing.
    """

    def __init__(self, get_response: Callable) -> None:
        self.get_response = get_response

    def __call__(self, request):  # type: ignore[override]
        trace_id = request.META.get("HTTP_X_TRACE_ID") or uuid.uuid4().hex
        set_trace_id(trace_id)

        response = self.get_response(request)

        # Attach trace_id to response header for downstream correlation.
        response["X-Trace-ID"] = trace_id
        clear_trace_id()
        return response
