"""RabbitMQ consumer — used by the standalone worker process.

Uses ``aio_pika.connect_robust`` which auto-reconnects on connection loss.
Additional safeguards:
  - ``heartbeat=60`` keeps the AMQP connection alive even when idle.
  - ``connection_timeout=10`` prevents hanging during initial connect.
  - Channel-level close callback re-opens the channel + consumer
    automatically so processing resumes without a full restart.
"""

from __future__ import annotations

import logging
from typing import Callable, Awaitable

import aio_pika

log = logging.getLogger(__name__)


async def start_consumer(
    rabbitmq_url: str,
    queue_name: str,
    callback: Callable[[aio_pika.abc.AbstractIncomingMessage], Awaitable[None]],
) -> aio_pika.abc.AbstractRobustConnection:
    """Connect, declare queue, and start consuming messages.

    The robust connection will automatically reconnect on broker restarts
    or network interruptions.  The ``on_reconnect`` callback re-establishes
    the channel and consumer so log processing resumes without manual
    intervention.
    """
    connection = await aio_pika.connect_robust(
        rabbitmq_url,
        heartbeat=60,
        timeout=10,
    )

    async def _setup_channel(conn: aio_pika.abc.AbstractRobustConnection) -> None:
        """(Re)create channel, declare queue, and start consuming."""
        channel = await conn.channel()
        await channel.set_qos(prefetch_count=10)
        queue = await channel.declare_queue(queue_name, durable=True)
        await queue.consume(callback)
        log.info("Consumer (re)started on queue '%s'", queue_name)

    # Set up initial channel
    await _setup_channel(connection)

    # Re-setup after reconnection
    connection.reconnect_callbacks.add(
        lambda conn: _setup_channel(conn)  # type: ignore[arg-type]
    )

    return connection
