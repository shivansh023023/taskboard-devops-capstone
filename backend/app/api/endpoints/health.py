from datetime import datetime, timezone
from fastapi import APIRouter, Response, status
from backend.app.db.session import check_db_connectivity
from backend.app.core.config import settings

router = APIRouter()

@router.get("/", tags=["System"])
def root():
    """Root endpoint providing high-level application metadata."""
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "online",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json"
    }

@router.get("/health", tags=["Observability"])
def health():
    """
    Liveness probe.
    Provides a lightweight check that the HTTP process is alive and responsive.
    Does not depend on external services such as the database.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": settings.PROJECT_NAME
    }

@router.get("/ready", tags=["Observability"])
def ready(response: Response):
    """
    Readiness probe.
    Verifies that dependencies (PostgreSQL database) are healthy and ready to accept traffic.
    Returns HTTP 200 when ready, or HTTP 503 when the database is unreachable.
    """
    db_ok = check_db_connectivity()
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "database": "unreachable",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    return {
        "status": "ready",
        "database": "connected",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
