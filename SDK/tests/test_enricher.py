"""Tests for sentinel_sdk.enricher."""

import os
import socket

from sentinel_sdk.enricher import Enricher, clear_trace_id, get_trace_id, set_trace_id
from sentinel_sdk.models import LogLevel


class TestTraceId:
    def setup_method(self):
        clear_trace_id()

    def test_default_empty(self):
        assert get_trace_id() == ""

    def test_set_and_get(self):
        set_trace_id("trace-123")
        assert get_trace_id() == "trace-123"

    def test_clear(self):
        set_trace_id("trace-123")
        clear_trace_id()
        assert get_trace_id() == ""


class TestEnricher:
    def test_basic_enrichment(self):
        enricher = Enricher(service="test-svc", environment="test")
        entry = enricher.enrich(LogLevel.INFO, "hello", module="auth")

        assert entry.level == LogLevel.INFO
        assert entry.message == "hello"
        assert entry.module == "auth"
        assert entry.service == "test-svc"
        assert entry.environment == "test"
        assert entry.host == socket.gethostname()
        assert entry.pid == os.getpid()
        assert entry.timestamp  # not empty
        assert entry.sdk_version  # not empty
        assert entry.stack_trace is None
        assert entry.error_type is None

    def test_enrichment_with_trace_id(self):
        set_trace_id("my-trace")
        enricher = Enricher(service="svc", environment="prod")
        entry = enricher.enrich(LogLevel.DEBUG, "msg")
        assert entry.trace_id == "my-trace"
        clear_trace_id()

    def test_enrichment_with_exc_info(self):
        enricher = Enricher(service="svc", environment="test")
        try:
            raise ValueError("test error")
        except ValueError:
            entry = enricher.enrich(LogLevel.ERROR, "failed", exc_info=True)
        assert entry.error_type == "ValueError"
        assert "ValueError: test error" in entry.stack_trace

    def test_enrichment_with_extra(self):
        enricher = Enricher(service="svc", environment="test")
        entry = enricher.enrich(LogLevel.INFO, "msg", extra={"user_id": 42})
        assert entry.extra == {"user_id": 42}

    def test_enrichment_without_exc_info_no_stack(self):
        enricher = Enricher(service="svc", environment="test")
        entry = enricher.enrich(LogLevel.ERROR, "msg", exc_info=False)
        assert entry.stack_trace is None
        assert entry.error_type is None
