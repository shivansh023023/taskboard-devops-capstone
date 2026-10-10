#!/bin/sh
set -e

echo "[TaskBoard Backend] Applying database migrations..."
cd /app/backend
alembic upgrade head
cd /app

echo "[TaskBoard Backend] Starting Uvicorn server on port 8000..."
exec uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
