"""RabbitMQ publisher — used by the FastAPI ingestion endpoint."""

from __future__ import annotations

import aio_pika

_connection: aio_pika.abc.AbstractRobustConnection | None = None
_channel: aio_pika.abc.AbstractChannel | None = None
_queue_name: str = ""


async def init_publisher(rabbitmq_url: str, queue_name: str) -> None:
    """Connect to RabbitMQ and declare the durable queue."""
    global _connection, _channel, _queue_name
    _queue_name = queue_name
    _connection = await aio_pika.connect_robust(rabbitmq_url)
    _channel = await _connection.channel()
    await _channel.declare_queue(_queue_name, durable=True)


async def publish_batch(payload: bytes) -> None:
    """Publish a persistent message containing a serialised log batch."""
    if _channel is None:
        raise RuntimeError("RabbitMQ publisher not initialised")
    await _channel.default_exchange.publish(
        aio_pika.Message(
            body=payload,
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        ),
        routing_key=_queue_name,
    )


async def close_publisher() -> None:
    """Gracefully close the RabbitMQ connection."""
    global _connection, _channel
    if _connection:
        await _connection.close()
    _connection = None
    _channel = None
