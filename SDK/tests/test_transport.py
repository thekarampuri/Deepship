"""Tests for sentinel_sdk.transport."""

import gzip
import json
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

from sentinel_sdk.models import LogEntry, LogLevel
from sentinel_sdk.transport import DeadLetterQueue, HttpTransport


def _entry(msg: str = "test") -> LogEntry:
    return LogEntry(
        level=LogLevel.INFO,
        message=msg,
        timestamp="2026-04-05T10:00:00.000+00:00",
        service="svc",
        environment="test",
        host="localhost",
        pid=1,
        thread_id="main",
        sdk_version="1.0.0",
    )


class TestDeadLetterQueue:
    def test_save_and_pending(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            dlq = DeadLetterQueue(path=tmpdir)
            dlq.save([_entry("a"), _entry("b")])
            files = dlq.pending_files()
            assert len(files) == 1
            content = files[0].read_text()
            lines = content.strip().split("\n")
            assert len(lines) == 2
            assert json.loads(lines[0])["message"] == "a"

    def test_remove(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            dlq = DeadLetterQueue(path=tmpdir)
            dlq.save([_entry()])
            files = dlq.pending_files()
            dlq.remove(files[0])
            assert dlq.pending_files() == []


class TestHttpTransport:
    def test_send_success(self):
        transport = HttpTransport(
            endpoint="http://localhost:9999",
            api_key="test-key",
            compress=False,
            dlq_path=tempfile.mkdtemp(),
        )
        mock_response = MagicMock()
        mock_response.status_code = 202
        with patch.object(transport._client, "post", return_value=mock_response) as mock_post:
            result = transport.send([_entry("ok")])
            assert result is True
            mock_post.assert_called_once()
            call_kwargs = mock_post.call_args
            assert call_kwargs.kwargs["headers"]["X-API-Key"] == "test-key"

    def test_send_4xx_goes_to_dlq(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            transport = HttpTransport(
                endpoint="http://localhost:9999",
                api_key="bad-key",
                compress=False,
                dlq_path=tmpdir,
                max_retries=1,
            )
            mock_response = MagicMock()
            mock_response.status_code = 403
            mock_response.text = "Forbidden"
            with patch.object(transport._client, "post", return_value=mock_response):
                result = transport.send([_entry()])
                assert result is False
            dlq_files = list(Path(tmpdir).glob("failed_*.jsonl"))
            assert len(dlq_files) == 1

    def test_send_with_compression(self):
        transport = HttpTransport(
            endpoint="http://localhost:9999",
            api_key="key",
            compress=True,
            dlq_path=tempfile.mkdtemp(),
        )
        mock_response = MagicMock()
        mock_response.status_code = 202
        with patch.object(transport._client, "post", return_value=mock_response) as mock_post:
            transport.send([_entry("compressed")])
            call_kwargs = mock_post.call_args
            assert call_kwargs.kwargs["headers"]["Content-Encoding"] == "gzip"
            body = call_kwargs.kwargs["content"]
            decompressed = json.loads(gzip.decompress(body))
            assert decompressed[0]["message"] == "compressed"

    def test_send_retries_on_5xx(self):
        transport = HttpTransport(
            endpoint="http://localhost:9999",
            api_key="key",
            compress=False,
            dlq_path=tempfile.mkdtemp(),
            max_retries=3,
        )
        mock_500 = MagicMock(status_code=500, text="Internal Server Error")
        mock_202 = MagicMock(status_code=202)
        with patch.object(
            transport._client, "post", side_effect=[mock_500, mock_500, mock_202]
        ) as mock_post:
            with patch("sentinel_sdk.transport.time.sleep"):
                result = transport.send([_entry()])
                assert result is True
                assert mock_post.call_count == 3

    def test_url_construction(self):
        transport = HttpTransport(
            endpoint="http://103.127.146.14",
            api_key="key",
            dlq_path=tempfile.mkdtemp(),
        )
        assert transport._url == "http://103.127.146.14/api/v1/ingest"

    def test_url_construction_trailing_slash(self):
        transport = HttpTransport(
            endpoint="http://103.127.146.14/",
            api_key="key",
            dlq_path=tempfile.mkdtemp(),
        )
        assert transport._url == "http://103.127.146.14/api/v1/ingest"
