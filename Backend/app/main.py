"""FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_pool, init_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # --- startup ---
    await init_pool()

    # RabbitMQ publisher (best-effort; queue may not be running locally)
    try:
        from app.queue.publisher import init_publisher
        await init_publisher(settings.RABBITMQ_URL, settings.LOG_QUEUE_NAME)
    except Exception:
        import logging
        logging.getLogger(__name__).warning("RabbitMQ not available — ingestion will fail until it connects.")

    yield

    # --- shutdown ---
    try:
        from app.queue.publisher import close_publisher
        await close_publisher()
    except Exception:
        pass
    await close_pool()


app = FastAPI(title="Orchid API", version="1.0.0", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
from app.auth.router import router as auth_router          # noqa: E402
from app.ingestion.router import router as ingestion_router  # noqa: E402
from app.logs.router import router as logs_router            # noqa: E402
from app.issues.router import router as issues_router        # noqa: E402
from app.stats.router import router as stats_router          # noqa: E402
from app.admin.router import router as admin_router          # noqa: E402

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(ingestion_router, prefix="/api/v1", tags=["Ingestion"])
app.include_router(logs_router, prefix="/api/v1", tags=["Logs"])
app.include_router(issues_router, prefix="/api/v1", tags=["Issues"])
app.include_router(stats_router, prefix="/api/v1", tags=["Stats"])
app.include_router(admin_router, prefix="/api/v1", tags=["Admin"])


@app.get("/health")
async def health():
    return {"status": "ok"}
