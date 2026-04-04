"""RabbitMQ consumer — used by the standalone worker process."""

from __future__ import annotations

from typing import Callable, Awaitable

import aio_pika


async def start_consumer(
    rabbitmq_url: str,
    queue_name: str,
    callback: Callable[[aio_pika.abc.AbstractIncomingMessage], Awaitable[None]],
) -> aio_pika.abc.AbstractRobustConnection:
    """Connect, declare queue, and start consuming messages."""
    connection = await aio_pika.connect_robust(rabbitmq_url)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)
    queue = await channel.declare_queue(queue_name, durable=True)
    await queue.consume(callback)
    return connection
