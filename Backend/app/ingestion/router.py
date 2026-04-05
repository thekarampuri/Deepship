"""POST /api/v1/ingest — SDK log ingestion endpoint."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request, status

from app.dependencies import validate_api_key
from app.ingestion.schemas import IngestResponse, LogEntryIn
from app.ingestion.service import decompress_body, parse_batch, prepare_for_queue
from app.queue.publisher import publish_batch

log = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def ingest_logs(
    request: Request,
    project_id: Annotated[str, Depends(validate_api_key)],
    content_encoding: Annotated[str | None, Header()] = None,
):
    """Receive a batch of logs from the SDK and queue them for processing."""
    raw_body = await request.body()
    decompressed = decompress_body(raw_body, content_encoding)
    raw_entries = parse_batch(decompressed)

    # Validate each entry through Pydantic
    entries = [LogEntryIn(**e) for e in raw_entries]

    # Prepare payload and publish to RabbitMQ
    payload = prepare_for_queue(entries, project_id)
    await publish_batch(payload)

    return IngestResponse(accepted=len(entries))
