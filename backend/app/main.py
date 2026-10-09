from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from backend.app.core.config import settings
from backend.app.api.endpoints import health, tasks

def create_app() -> FastAPI:
    """Create and configure the FastAPI application instance."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="TaskBoard DevOps Capstone API — Modern Project Management System",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Configure CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Instrument Prometheus metrics endpoint at /metrics
    instrumentator = Instrumentator(
        should_group_status_codes=False,
        should_ignore_untemplated=True,
        should_instrument_requests_inprogress=True,
        excluded_handlers=["/metrics", "/health", "/ready"],
        inprogress_name="taskboard_inprogress_requests",
    )
    instrumentator.instrument(app).expose(app, endpoint="/metrics", tags=["Observability"])

    # Include routers
    # Health, ready, root
    app.include_router(health.router)

    # Tasks API under /api/tasks
    app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks")

    return app

app = create_app()
