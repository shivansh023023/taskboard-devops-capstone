# ==========================================
# TaskBoard Backend — Production Dockerfile
# ==========================================
FROM python:3.13-slim-bookworm

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Refresh OS packages to apply distribution security patches
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create a non-root system user and group
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -m -s /bin/bash appuser

WORKDIR /app

# Install Python dependencies and upgrade core build tools
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip "setuptools>=78.1.1" && \
    pip install --no-cache-dir -r /app/requirements.txt && \
    python -c "import pathlib, pip; (pathlib.Path(pip.__file__).parent / '_vendor' / 'bom.cdx.json').unlink(missing_ok=True)"

# Copy backend application code, migrations, and entrypoint
COPY app /app/backend/app
COPY alembic /app/backend/alembic
COPY alembic.ini /app/backend/alembic.ini
COPY entrypoint.sh /app/backend/entrypoint.sh

# Ensure proper permissions and ownership
RUN chmod +x /app/backend/entrypoint.sh && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose backend port
EXPOSE 8000

# Run entrypoint script (applies migrations, then starts Uvicorn)
ENTRYPOINT ["/app/backend/entrypoint.sh"]
