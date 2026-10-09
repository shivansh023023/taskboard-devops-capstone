from unittest.mock import patch
from fastapi.testclient import TestClient

def test_root_endpoint(client: TestClient):
    """Verify root endpoint returns system metadata."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "TaskBoard"
    assert data["status"] == "online"
    assert "version" in data
    assert data["docs_url"] == "/docs"

def test_health_liveness_endpoint(client: TestClient):
    """Verify /health returns lightweight 200 liveness check."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert data["service"] == "TaskBoard"

def test_ready_endpoint_healthy(client: TestClient):
    """Verify /ready returns 200 when database connectivity is valid."""
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["database"] == "connected"

def test_ready_endpoint_database_failure(client: TestClient):
    """Verify /ready returns 503 Service Unavailable when database fails."""
    with patch("backend.app.api.endpoints.health.check_db_connectivity", return_value=False):
        response = client.get("/ready")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "not_ready"
        assert data["database"] == "unreachable"

def test_metrics_endpoint(client: TestClient):
    """Verify Prometheus metrics are exposed at /metrics."""
    # First make a request to generate metrics
    client.get("/")
    response = client.get("/metrics")
    assert response.status_code == 200
    content = response.text
    assert "http_requests" in content or "taskboard" in content or "python_info" in content
