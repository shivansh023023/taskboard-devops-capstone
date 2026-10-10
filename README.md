# TaskBoard — Cloud & DevOps Capstone Project

TaskBoard is a realistic, SaaS-style project management application engineered as a comprehensive 6-day DevOps capstone. Over the course of the project, TaskBoard transitions from local development to a fully automated cloud architecture on AWS EKS with Kubernetes, Helm, Terraform, Prometheus/Grafana observability, and GitHub Actions CI/CD.

---

## 🚀 Status Checkpoints

- **Day 1: Application Foundation (Completed)**: Core FastAPI backend, PostgreSQL database, Alembic migrations, Pytest suite, and React + Vite frontend.
- **Day 2: Complete Dockerization (Completed)**: Full multi-container architecture using Docker Compose. Frontend (Nginx reverse proxy + React SPA), Backend (FastAPI non-root container with auto-migrations), and PostgreSQL (persistent Alpine container) connected via a dedicated bridge network.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 8, Lucide Icons, Nginx 1.27 Alpine (Reverse Proxy & SPA routing) |
| **Backend** | Python 3.13 Slim, FastAPI, Uvicorn, Pydantic v2, Prometheus Instrumentator |
| **Database** | PostgreSQL 16 Alpine, SQLAlchemy 2.0, Alembic, psycopg 3 |
| **Containerization** | Docker, Docker Compose, Multi-stage Dockerfiles, Bridge Networks |
| **Testing** | Pytest, FastAPI TestClient, HTTPX |
| **DevOps & Cloud** | Git, Docker *(Future: GitHub Actions CI/CD, Trivy, GHCR, Terraform, AWS EKS, Helm, K8s, Grafana)* |

---

## 📁 Repository Structure

```
devops_project/
├── frontend/                     # React + Vite frontend application
│   ├── src/                      # UI components, API services, and styles
│   ├── nginx.conf                # Nginx reverse proxy & SPA fallback configuration
│   ├── Dockerfile                # Multi-stage build (Node 22 builder -> Nginx runtime)
│   ├── .dockerignore             # Excludes node_modules, dist, and local artifacts
│   ├── package.json
│   └── vite.config.js            # Vite proxy configuration for local dev
├── backend/                      # FastAPI Python backend application
│   ├── app/                      # Route controllers, schemas, models, and services
│   ├── alembic/                  # Database migration scripts
│   ├── tests/                    # Automated pytest test suite
│   ├── entrypoint.sh             # Startup script: applies Alembic migrations, then execs uvicorn
│   ├── Dockerfile                # Production Dockerfile (python:3.13-slim, non-root user)
│   ├── .dockerignore             # Excludes .venv, caches, tests, and env files
│   ├── alembic.ini               # Alembic configuration
│   └── requirements.txt          # Python dependencies
├── terraform/                    # (Day 4) AWS infrastructure as code
├── helm/taskboard/               # (Day 5) Helm charts for Kubernetes deployment
├── k8s/                          # (Day 5) Kubernetes manifests
├── monitoring/                   # (Day 6) Prometheus & Grafana alerting & dashboards
├── troubleshooting/              # (Day 6) Debugging runbooks and incident scenarios
├── scripts/                      # Automation & setup scripts
├── .github/workflows/            # (Day 3) GitHub Actions CI/CD pipelines
├── docker-compose.yml            # Multi-container Compose stack (frontend, backend, postgres)
├── .env.example                  # Environment configuration template
├── .gitignore                    # Git ignore rules for Python, Node, Docker, & secrets
├── README.md                     # Project documentation & operational guides
└── PROJECT_REQUIREMENTS.md       # 6-day project requirements & acceptance tracker
```

---

## 📋 Prerequisites

- **Windows 11** with PowerShell
- **Docker Desktop** (`docker --version` >= 27) with WSL2 backend
- **Git** (`git --version` >= 2.40)
- Optional for host development: **Python** >= 3.11, **Node.js** >= 20

---

## 🐳 Running with Docker Compose (Recommended)

### 1. Configure Environment

Copy the example configuration to `.env`:

```powershell
Copy-Item .env.example .env
```

> **Security Note**: Development credentials (`taskboard:taskboard`) are set for local evaluation only. Never commit `.env` or use default credentials in production environments.

### 2. Build and Start the Complete Stack

Execute a single command to build the container images and launch the services:

```powershell
docker compose up --build -d
```

Compose automatically coordinates service startup:
1. Starts **PostgreSQL 16** and runs health checks using `pg_isready`.
2. Starts **FastAPI Backend** once PostgreSQL is healthy, automatically applies Alembic migrations, and starts Uvicorn.
3. Starts **Nginx Frontend** once the backend is healthy, serving the React SPA and proxying API traffic.

### 3. Verify Container Status & Health

```powershell
docker compose ps
```

All three services should report `Up` and `(healthy)`:

```
NAME                 IMAGE                      STATUS
taskboard-postgres   postgres:16-alpine         Up (healthy)
taskboard-backend    devops_project-backend     Up (healthy)
taskboard-frontend   devops_project-frontend    Up (healthy)
```

---

## 🌐 Application Access & Endpoints

| Service / Endpoint | URL | Description |
| :--- | :--- | :--- |
| **Frontend Dashboard** | `http://localhost:3000` | TaskBoard SaaS project management UI |
| **Backend Liveness Probe** | `http://localhost:3000/health` | Lightweight process check (via Nginx proxy) |
| **Database Readiness Probe** | `http://localhost:3000/ready` | Live PostgreSQL connectivity check (via Nginx proxy) |
| **Interactive API Docs** | `http://localhost:3000/docs` | OpenAPI Swagger UI (via Nginx proxy) |
| **Prometheus Metrics** | `http://localhost:3000/metrics` | Application metrics exposition (via Nginx proxy) |
| **Task REST API** | `http://localhost:3000/api/tasks` | Task CRUD endpoints (via Nginx proxy) |
| **Task Statistics** | `http://localhost:3000/api/tasks/stats` | KPI aggregate statistics (via Nginx proxy) |
| **Direct Backend (Dev)** | `http://localhost:8000` | Optional direct backend access on host |

---

## 🔎 Inspecting Logs and Managing the Stack

### View Container Logs
```powershell
# Follow logs for all containers
docker compose logs -f

# View logs for a specific service
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

### Stop the Stack Safely
```powershell
# Stop running containers while preserving all database data
docker compose down
```

> ⚠️ **Warning**: Never run `docker compose down -v` unless you explicitly want to erase your PostgreSQL database volume and all saved tasks.

### Restart Services (Data Persistence)
```powershell
docker compose restart
```

---

## 🧪 Automated Testing (Host Development)

You can run the existing automated test suite against the running database container on host port `5433`:

```powershell
# Run the 16 automated backend tests
& "backend\.venv\Scripts\pytest.exe" -v backend\tests

# Run frontend build check
cd frontend
npm run build
```

---

## 🔧 Architecture & Troubleshooting Guide

### Docker Networking Architecture
- All three containers communicate within an isolated Docker bridge network: `taskboard_network`.
- The frontend Nginx container communicates with the backend via internal service DNS: `http://backend:8000`.
- The backend communicates with PostgreSQL via internal service DNS: `postgres:5432`.
- PostgreSQL is only published to host port `5433` for optional local host tooling, avoiding collisions with any local PostgreSQL instance on port `5432`.

### Common Issues & Resolutions

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| `Port 5433 already in use` | Another container or process is using port 5433. | Change `POSTGRES_PORT` in `.env` to another port (e.g. `5434`). |
| `Backend fails with connection refused` | Database container not yet ready. | The `docker-compose.yml` uses `depends_on: { postgres: { condition: service_healthy } }` to ensure PostgreSQL is ready before backend boots. |
| `Migrations do not apply` | Database URL incorrect or schema out of sync. | Inspect logs with `docker compose logs backend`. The entrypoint script runs `alembic upgrade head` before Uvicorn starts. |
| `Frontend returns 502 Bad Gateway` | Backend container is restarting or unhealthy. | Check `docker compose logs backend` to resolve backend crashes. |

---

## 🗺 DevOps Capstone 6-Day Roadmap

```mermaid
flowchart LR
    D1["Day 1: Foundation\nFastAPI + React + Postgres"] --> D2["Day 2: Containerization\nDocker + Compose + Nginx"]
    D2 --> D3["Day 3: CI/CD & Security\nGitHub Actions + Trivy + GHCR"]
    D3 --> D4["Day 4: Cloud Infra\nTerraform + AWS VPC & EKS"]
    D4 --> D5["Day 5: Orchestration\nK8s Manifests + Helm + Ingress"]
    D5 --> D6["Day 6: SRE & Observability\nPrometheus + Grafana + Troubleshooting"]
```
