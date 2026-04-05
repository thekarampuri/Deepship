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

    # RabbitMQ publisher (required for log ingestion)
    from app.queue.publisher import init_publisher
    await init_publisher(settings.RABBITMQ_URL, settings.LOG_QUEUE_NAME)

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

# Global exception handler — ensures a proper JSON 500 response is returned
# so the CORS middleware can attach its headers (plain crashes bypass CORS).
from fastapi.responses import JSONResponse   # noqa: E402
from fastapi import Request as _Req          # noqa: E402

@app.exception_handler(Exception)
async def _global_exc_handler(_req: _Req, exc: Exception):
    import traceback, logging                # noqa: E401
    logging.getLogger("orchid").error("Unhandled: %s\n%s", exc, traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

# --- Routers ---
from app.auth.router import router as auth_router          # noqa: E402
from app.ingestion.router import router as ingestion_router  # noqa: E402
from app.logs.router import router as logs_router            # noqa: E402
from app.issues.router import router as issues_router        # noqa: E402
from app.stats.router import router as stats_router          # noqa: E402
from app.admin.router import router as admin_router                  # noqa: E402
from app.organizations.router import router as organizations_router  # noqa: E402
from app.join_requests.router import router as join_requests_router  # noqa: E402
from app.projects.router import router as projects_router            # noqa: E402

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(ingestion_router, prefix="/api/v1", tags=["Ingestion"])
app.include_router(logs_router, prefix="/api/v1", tags=["Logs"])
app.include_router(issues_router, prefix="/api/v1", tags=["Issues"])
app.include_router(stats_router, prefix="/api/v1", tags=["Stats"])
app.include_router(admin_router, prefix="/api/v1", tags=["Admin"])
app.include_router(organizations_router, prefix="/api/v1", tags=["Organizations"])
app.include_router(join_requests_router, prefix="/api/v1", tags=["Join Requests"])
app.include_router(projects_router, prefix="/api/v1", tags=["Projects"])


@app.get("/health")
async def health():
    return {"status": "ok"}
