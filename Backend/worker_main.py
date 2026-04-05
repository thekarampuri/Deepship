"""Standalone worker process: consumes log batches from RabbitMQ."""

from __future__ import annotations

import asyncio
import logging
import signal
import sys

# Ensure the Backend directory is on sys.path so `app.*` imports work
# when running as `python worker_main.py` from inside Backend/.
sys.path.insert(0, ".")

from app.config import settings
from app.database import init_pool, close_pool
from app.queue.consumer import start_consumer
from app.worker.processor import process_batch

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("orchid.worker")


async def main() -> None:
    log.info("Initialising database pool …")
    pool = await init_pool()

    # Wrap processor callback so it receives the pool.
    # Catch-all ensures one bad message never kills the consumer.
    async def on_message(message):
        try:
            await process_batch(message, pool)
        except Exception:
            log.exception("Unhandled error processing message — message will be requeued")

    log.info("Connecting to RabbitMQ at %s …", settings.RABBITMQ_URL)
    connection = await start_consumer(
        settings.RABBITMQ_URL,
        settings.LOG_QUEUE_NAME,
        on_message,
    )

    log.info("Worker ready — consuming queue '%s'", settings.LOG_QUEUE_NAME)

    # Block until cancelled
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, stop.set)
        except NotImplementedError:
            # Windows doesn't support add_signal_handler
            pass

    try:
        await stop.wait()
    except KeyboardInterrupt:
        pass

    log.info("Shutting down …")
    await connection.close()
    await close_pool()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
