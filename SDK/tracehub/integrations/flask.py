"""Flask integration — auto trace_id via before/after request hooks."""

from __future__ import annotations

import uuid

from flask import Flask, g, request

from tracehub.enricher import clear_trace_id, set_trace_id


def init_tracehub(app: Flask) -> None:
    """Register before/after request hooks that manage trace_id.

    Usage::

        from flask import Flask
        from tracehub.integrations.flask import init_tracehub

        app = Flask(__name__)
        init_tracehub(app)
    """

    @app.before_request
    def _set_trace_id() -> None:
        trace_id = request.headers.get("X-Trace-ID") or uuid.uuid4().hex
        g.tracehub_trace_id = trace_id
        set_trace_id(trace_id)

    @app.after_request
    def _clear_trace_id(response):
        response.headers["X-Trace-ID"] = getattr(g, "tracehub_trace_id", "")
        clear_trace_id()
        return response
