"""FastAPI / Starlette middleware — auto trace_id per request."""

from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from sentinel_sdk.enricher import clear_trace_id, set_trace_id


class SentinelTraceMiddleware(BaseHTTPMiddleware):
    """Starlette-compatible middleware for FastAPI.

    Usage::

        from fastapi import FastAPI
        from sentinel_sdk.integrations.fastapi import SentinelTraceMiddleware

        app = FastAPI()
        app.add_middleware(SentinelTraceMiddleware)
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        trace_id = request.headers.get("x-trace-id") or uuid.uuid4().hex
        set_trace_id(trace_id)

        try:
            response = await call_next(request)
        finally:
            clear_trace_id()

        response.headers["X-Trace-ID"] = trace_id
        return response
