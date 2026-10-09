import pytest
from fastapi.testclient import TestClient

def test_create_task_success(client: TestClient):
    """Verify successful task creation."""
    payload = {
        "title": "Configure EKS Cluster",
        "description": "Set up AWS EKS control plane and worker nodes",
        "status": "todo",
        "priority": "high",
        "assignee": "Alex DevOps",
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["title"] == payload["title"]
    assert data["description"] == payload["description"]
    assert data["status"] == "todo"
    assert data["priority"] == "high"
    assert data["assignee"] == "Alex DevOps"
    assert "created_at" in data
    assert "updated_at" in data

def test_create_task_invalid_input(client: TestClient):
    """Verify validation rejection for invalid inputs."""
    # Empty title
    response1 = client.post("/api/tasks", json={"title": ""})
    assert response1.status_code == 422

    # Invalid status
    response2 = client.post(
        "/api/tasks",
        json={"title": "Valid Title", "status": "invalid_status"}
    )
    assert response2.status_code == 422

    # Invalid priority
    response3 = client.post(
        "/api/tasks",
        json={"title": "Valid Title", "priority": "super_urgent"}
    )
    assert response3.status_code == 422

def test_list_tasks_and_pagination(client: TestClient):
    """Verify task listing and pagination."""
    # Create 3 tasks
    for i in range(1, 4):
        client.post("/api/tasks", json={"title": f"Task {i}", "status": "todo"})
    
    response = client.get("/api/tasks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    # Test limit and offset
    page_resp = client.get("/api/tasks?skip=1&limit=1")
    assert page_resp.status_code == 200
    page_data = page_resp.json()
    assert len(page_data) == 1

def test_search_and_filter_tasks(client: TestClient):
    """Verify search and status/priority filtering."""
    client.post("/api/tasks", json={
        "title": "Deploy Prometheus",
        "description": "Set up Prometheus and Grafana alerts",
        "status": "in_progress",
        "priority": "high",
        "assignee": "Sarah",
    })
    client.post("/api/tasks", json={
        "title": "Build Frontend Dashboard",
        "description": "Implement React UI with Vite",
        "status": "done",
        "priority": "medium",
        "assignee": "John",
    })

    # Search by keyword
    search_resp = client.get("/api/tasks?search=Prometheus")
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert len(search_data) == 1
    assert search_data[0]["title"] == "Deploy Prometheus"

    # Filter by status
    status_resp = client.get("/api/tasks?status=done")
    assert status_resp.status_code == 200
    status_data = status_resp.json()
    assert len(status_data) == 1
    assert status_data[0]["title"] == "Build Frontend Dashboard"

    # Filter by priority
    prio_resp = client.get("/api/tasks?priority=high")
    assert prio_resp.status_code == 200
    prio_data = prio_resp.json()
    assert len(prio_data) == 1
    assert prio_data[0]["priority"] == "high"

def test_get_existing_task(client: TestClient):
    """Verify retrieving single task by ID."""
    created = client.post("/api/tasks", json={"title": "Inspect Logs"}).json()
    task_id = created["id"]

    response = client.get(f"/api/tasks/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == task_id
    assert data["title"] == "Inspect Logs"

def test_get_nonexistent_task_404(client: TestClient):
    """Verify 404 response for nonexistent task."""
    response = client.get("/api/tasks/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_update_task(client: TestClient):
    """Verify updating task status and details."""
    created = client.post("/api/tasks", json={"title": "Draft Architecture"}).json()
    task_id = created["id"]

    update_payload = {
        "title": "Draft Final Architecture",
        "status": "done",
        "priority": "urgent",
    }
    response = client.put(f"/api/tasks/{task_id}", json=update_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Draft Final Architecture"
    assert data["status"] == "done"
    assert data["priority"] == "urgent"

def test_update_nonexistent_task_404(client: TestClient):
    """Verify 404 when updating nonexistent task."""
    response = client.put("/api/tasks/999999", json={"title": "New Title"})
    assert response.status_code == 404

def test_delete_task(client: TestClient):
    """Verify deleting a task."""
    created = client.post("/api/tasks", json={"title": "Temp Task"}).json()
    task_id = created["id"]

    # Delete
    del_resp = client.delete(f"/api/tasks/{task_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["id"] == task_id

    # Verify gone
    get_resp = client.get(f"/api/tasks/{task_id}")
    assert get_resp.status_code == 404

def test_delete_nonexistent_task_404(client: TestClient):
    """Verify 404 when deleting nonexistent task."""
    response = client.delete("/api/tasks/999999")
    assert response.status_code == 404

def test_task_statistics(client: TestClient):
    """Verify /api/tasks/stats returns accurate breakdown."""
    client.post("/api/tasks", json={"title": "Task 1", "status": "todo", "priority": "low"})
    client.post("/api/tasks", json={"title": "Task 2", "status": "todo", "priority": "medium"})
    client.post("/api/tasks", json={"title": "Task 3", "status": "in_progress", "priority": "high"})
    client.post("/api/tasks", json={"title": "Task 4", "status": "done", "priority": "urgent"})

    response = client.get("/api/tasks/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total"] == 4
    assert stats["todo"] == 2
    assert stats["in_progress"] == 1
    assert stats["done"] == 1
    assert stats["by_priority"]["low"] == 1
    assert stats["by_priority"]["medium"] == 1
    assert stats["by_priority"]["high"] == 1
    assert stats["by_priority"]["urgent"] == 1
