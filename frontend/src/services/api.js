/**
 * API service for TaskBoard application.
 * All API paths are relative to leverage Vite proxy in dev and Ingress/Nginx in production.
 */

const API_BASE = '/api/tasks';

export async function fetchTasks({ search = '', status = '', priority = '' } = {}) {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (status && status !== 'all') params.append('status', status);
  if (priority && priority !== 'all') params.append('priority', priority);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${API_BASE}${queryString}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch tasks (HTTP ${response.status})`);
  }
  return response.json();
}

export async function fetchTaskStats() {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch stats (HTTP ${response.status})`);
  }
  return response.json();
}

export async function createTask(taskData) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create task (HTTP ${response.status})`);
  }
  return response.json();
}

export async function updateTask(taskId, taskData) {
  const response = await fetch(`${API_BASE}/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update task (HTTP ${response.status})`);
  }
  return response.json();
}

export async function deleteTask(taskId) {
  const response = await fetch(`${API_BASE}/${taskId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete task (HTTP ${response.status})`);
  }
  return response.json();
}

export async function checkSystemHealth() {
  try {
    const [healthRes, readyRes] = await Promise.all([
      fetch('/health'),
      fetch('/ready'),
    ]);
    const healthData = await healthRes.json().catch(() => ({}));
    const readyData = await readyRes.json().catch(() => ({}));
    return {
      healthy: healthRes.ok,
      ready: readyRes.ok,
      healthData,
      readyData,
    };
  } catch (err) {
    return {
      healthy: false,
      ready: false,
      error: err.message,
    };
  }
}
