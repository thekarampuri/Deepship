"""Tests for tracehub.exceptions."""

from tracehub.exceptions import TraceHubConfigError, TraceHubError, TraceHubTransportError


class TestExceptions:
    def test_hierarchy(self):
        assert issubclass(TraceHubConfigError, TraceHubError)
        assert issubclass(TraceHubTransportError, TraceHubError)
        assert issubclass(TraceHubError, Exception)

    def test_config_error_message(self):
        err = TraceHubConfigError("api_key is required")
        assert str(err) == "api_key is required"

    def test_transport_error_message(self):
        err = TraceHubTransportError("connection refused")
        assert str(err) == "connection refused"
