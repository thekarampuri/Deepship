"""Flask integration — auto trace_id via before/after request hooks."""

from __future__ import annotations

import uuid

from flask import Flask, g, request

from sentinel_sdk.enricher import clear_trace_id, set_trace_id


def init_sentinel_tracing(app: Flask) -> None:
    """Register before/after request hooks that manage trace_id.

    Usage::

        from flask import Flask
        from sentinel_sdk.integrations.flask import init_sentinel_tracing

        app = Flask(__name__)
        init_sentinel_tracing(app)
    """

    @app.before_request
    def _set_trace_id() -> None:
        trace_id = request.headers.get("X-Trace-ID") or uuid.uuid4().hex
        g.sentinel_trace_id = trace_id
        set_trace_id(trace_id)

    @app.after_request
    def _clear_trace_id(response):
        response.headers["X-Trace-ID"] = getattr(g, "sentinel_trace_id", "")
        clear_trace_id()
        return response
