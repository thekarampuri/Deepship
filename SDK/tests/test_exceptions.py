"""Tests for sentinel_sdk.exceptions."""

from sentinel_sdk.exceptions import SentinelConfigError, SentinelError, SentinelTransportError


class TestExceptions:
    def test_hierarchy(self):
        assert issubclass(SentinelConfigError, SentinelError)
        assert issubclass(SentinelTransportError, SentinelError)
        assert issubclass(SentinelError, Exception)

    def test_config_error_message(self):
        err = SentinelConfigError("api_key is required")
        assert str(err) == "api_key is required"

    def test_transport_error_message(self):
        err = SentinelTransportError("connection refused")
        assert str(err) == "connection refused"
