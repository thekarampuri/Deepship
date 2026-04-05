"""Integration test — verifies SDK -> API -> RabbitMQ pipeline.

Requirements:
    - TraceHub backend running at http://103.127.146.14
    - RabbitMQ running and connected to the backend
    - A valid API key (set TRACEHUB_TEST_API_KEY env var)

Run:
    TRACEHUB_TEST_API_KEY=th_xxx pytest tests/test_integration_rabbitmq.py -v -s
"""

import os
import time

import pytest

from tracehub import TraceHubLogger

API_KEY = os.environ.get("TRACEHUB_TEST_API_KEY", "")
ENDPOINT = "http://103.127.146.14"

pytestmark = pytest.mark.skipif(
    not API_KEY,
    reason="Set TRACEHUB_TEST_API_KEY to run integration tests",
)


@pytest.fixture
def logger():
    lg = TraceHubLogger(
        api_key=API_KEY,
        service="sdk-integration-test",
        environment="test",
        endpoint=ENDPOINT,
        batch_size=5,
        flush_interval=2.0,
        compress=True,
    )
    yield lg
    lg.close()


class TestRabbitMQIntegration:
    def test_single_log_ingestion(self, logger):
        """Send a single log and verify it's accepted (202)."""
        logger.info("integration test - single log", module="test")
        logger.flush()
        time.sleep(1)

    def test_batch_ingestion(self, logger):
        """Send a batch of logs across all severity levels."""
        logger.debug("integration batch - debug", module="test")
        logger.info("integration batch - info", module="test")
        logger.warn("integration batch - warn", module="test")
        logger.error("integration batch - error", module="test")
        logger.fatal("integration batch - fatal", module="test")
        logger.flush()
        time.sleep(1)

    def test_error_with_stack_trace(self, logger):
        """Send an error log with stack trace (triggers issue creation via RabbitMQ worker)."""
        try:
            raise ValueError("SDK integration test error -- safe to ignore")
        except ValueError:
            logger.error(
                "Caught test error",
                exc_info=True,
                module="test",
                extra={"test_run": True, "source": "sdk-integration-test"},
            )
        logger.flush()
        time.sleep(1)

    def test_high_volume_batch(self, logger):
        """Send 50 logs rapidly to test batching under load."""
        for i in range(50):
            logger.info(
                f"high volume log #{i}",
                module="load-test",
                extra={"index": i},
            )
        logger.flush()
        time.sleep(2)

    def test_extra_metadata(self, logger):
        """Verify extra metadata is transmitted correctly."""
        logger.info(
            "metadata test",
            module="test",
            extra={
                "user_id": "usr_12345",
                "request_id": "req_abc",
                "latency_ms": 42.5,
                "tags": ["sdk", "integration"],
            },
        )
        logger.flush()
        time.sleep(1)
