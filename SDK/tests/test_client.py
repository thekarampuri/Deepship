"""Tests for sentinel_sdk.client (SentinelLogger)."""

import tempfile
from unittest.mock import MagicMock, patch

import pytest

from sentinel_sdk import DEFAULT_ENDPOINT
from sentinel_sdk.client import SentinelLogger
from sentinel_sdk.exceptions import SentinelConfigError


class TestSentinelLoggerConfig:
    def test_requires_api_key(self):
        with pytest.raises(SentinelConfigError, match="api_key"):
            SentinelLogger(api_key="", service="svc", environment="test")

    def test_default_endpoint(self):
        with patch("sentinel_sdk.client.HttpTransport") as mock_transport:
            mock_transport.return_value = MagicMock()
            with patch("sentinel_sdk.client.BatchWorker") as mock_batcher:
                mock_batcher.return_value = MagicMock()
                logger = SentinelLogger(
                    api_key="test-key",
                    service="svc",
                    environment="test",
                )
                mock_transport.assert_called_once()
                call_kwargs = mock_transport.call_args
                assert call_kwargs.kwargs["endpoint"] == DEFAULT_ENDPOINT
                logger.close()

    def test_custom_endpoint(self):
        with patch("sentinel_sdk.client.HttpTransport") as mock_transport:
            mock_transport.return_value = MagicMock()
            with patch("sentinel_sdk.client.BatchWorker") as mock_batcher:
                mock_batcher.return_value = MagicMock()
                logger = SentinelLogger(
                    api_key="test-key",
                    service="svc",
                    environment="test",
                    endpoint="http://custom:8000",
                )
                call_kwargs = mock_transport.call_args
                assert call_kwargs.kwargs["endpoint"] == "http://custom:8000"
                logger.close()


class TestSentinelLoggerLogging:
    def setup_method(self):
        self._tmpdir = tempfile.mkdtemp()

    def _make_logger(self):
        return SentinelLogger(
            api_key="test-key",
            service="test-svc",
            environment="test",
            endpoint="http://localhost:9999",
            batch_size=100,
            flush_interval=60.0,
            dlq_path=self._tmpdir,
        )

    def test_debug(self):
        logger = self._make_logger()
        logger.debug("debug msg", module="mod")
        assert not logger._buffer.is_empty
        entry = logger._buffer.pop_batch(1)[0]
        assert entry.message == "debug msg"
        assert entry.level.value == "DEBUG"
        assert entry.module == "mod"
        logger.close()

    def test_info(self):
        logger = self._make_logger()
        logger.info("info msg")
        entry = logger._buffer.pop_batch(1)[0]
        assert entry.level.value == "INFO"
        logger.close()

    def test_warn(self):
        logger = self._make_logger()
        logger.warn("warn msg")
        entry = logger._buffer.pop_batch(1)[0]
        assert entry.level.value == "WARN"
        logger.close()

    def test_error(self):
        logger = self._make_logger()
        logger.error("error msg")
        entry = logger._buffer.pop_batch(1)[0]
        assert entry.level.value == "ERROR"
        logger.close()

    def test_fatal(self):
        logger = self._make_logger()
        logger.fatal("fatal msg")
        entry = logger._buffer.pop_batch(1)[0]
        assert entry.level.value == "FATAL"
        logger.close()

    def test_error_with_exc_info(self):
        logger = self._make_logger()
        try:
            raise RuntimeError("boom")
        except RuntimeError:
            logger.error("caught error", exc_info=True)
        entry = logger._buffer.pop_batch(1)[0]
        assert entry.error_type == "RuntimeError"
        assert "boom" in entry.stack_trace
        logger.close()

    def test_extra_metadata(self):
        logger = self._make_logger()
        logger.info("msg", extra={"user_id": 42, "action": "login"})
        entry = logger._buffer.pop_batch(1)[0]
        assert entry.extra == {"user_id": 42, "action": "login"}
        logger.close()

    def test_flush(self):
        logger = self._make_logger()
        logger.info("to flush")
        with patch.object(logger._transport, "send", return_value=True) as mock_send:
            logger.flush()
            assert mock_send.called
        logger.close()
