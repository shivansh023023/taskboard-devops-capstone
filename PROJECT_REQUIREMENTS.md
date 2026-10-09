# TaskBoard DevOps Capstone — Project Requirements Tracking

This document tracks all mandatory requirements across the 6-day project lifecycle.
Status values: `NOT_STARTED` | `IN_PROGRESS` | `BLOCKED` | `DONE`.
Rules: A requirement is marked `DONE` only after concrete verification.

---

## 1. Overall Capstone Requirements Matrix

| Requirement | Category | Target Day | Status | Verification Notes |
| :--- | :--- | :--- | :--- | :--- |
| React + Vite frontend | Frontend | Day 1 | DONE | React 18, Vite 8, responsive dashboard, build verified (`npm run build`) |
| Responsive HTML/JSX and CSS | Frontend | Day 1 | DONE | Custom vanilla CSS design system with dark sidebar, cards, and animations |
| FastAPI Python backend | Backend | Day 1 | DONE | FastAPI app with modular routers, schemas, and services |
| PostgreSQL database | Database | Day 1 | DONE | PostgreSQL 16 container running healthy on port 5433 with persistent volume |
| SQLAlchemy ORM | Backend/DB | Day 1 | DONE | Declarative models, session lifecycle, connection pooling |
| Alembic database migrations | Database | Day 1 | DONE | Initial migration `001_initial` executed via `alembic upgrade head` |
| REST APIs | Backend | Day 1 | DONE | Tasks CRUD, stats, health, ready, metrics all responding with HTTP 200 |
| Pytest automated tests | Testing | Day 1 | DONE | 16/16 automated test suite passing in 0.42s |
| Docker and Docker Compose | DevOps | Day 1-2 | IN_PROGRESS | Docker Compose running PostgreSQL container; app multi-stage builds Day 2 |
| Git and GitHub | DevOps | Day 1-2 | IN_PROGRESS | Git initialized with comprehensive `.gitignore` |
| GitHub Actions CI/CD | CI/CD | Day 3 | NOT_STARTED | Planned for Day 3 |
| Trivy container security scanning | Security | Day 3 | NOT_STARTED | Planned for Day 3 |
| GitHub Container Registry (GHCR) | Container Registry | Day 3 | NOT_STARTED | Planned for Day 3 |
| Terraform for AWS infrastructure | Infrastructure | Day 4 | NOT_STARTED | Planned for Day 4 |
| AWS VPC, EKS & managed worker nodes | Cloud/K8s | Day 4 | NOT_STARTED | Planned for Day 4 |
| Kubernetes Manifests | Orchestration | Day 5 | NOT_STARTED | Planned for Day 5 |
| Helm Chart (`helm/taskboard`) | Orchestration | Day 5 | NOT_STARTED | Planned for Day 5 |
| Ingress Controller | Networking | Day 5 | NOT_STARTED | Planned for Day 5 |
| Horizontal Pod Autoscaler (HPA) | Scaling | Day 5 | NOT_STARTED | Planned for Day 5 |
| Prometheus and Grafana | Observability | Day 6 | NOT_STARTED | `/metrics` endpoint instrumented Day 1; monitoring stack Day 6 |
| Health and readiness endpoints | Observability | Day 1 | DONE | `/health` (liveness), `/ready` (DB readiness probe), `/metrics` verified |
| Load testing & troubleshooting | Reliability | Day 6 | NOT_STARTED | Planned for Day 6 |

---

## 2. Day 1: Application Foundation — Acceptance Checklist

| # | Acceptance Criterion | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| 1 | Complete repository structure exists | DONE | Verified: `frontend/`, `backend/`, `terraform/`, `helm/`, `k8s/`, `monitoring/`, `troubleshooting/`, `scripts/`, `.github/` |
| 2 | Dashboard is implemented and responsive | DONE | Implemented with dark sidebar, KPI cards, task table, modal, activity feed |
| 3 | FastAPI starts successfully | DONE | Verified: Running on `http://127.0.0.1:8000` via Uvicorn |
| 4 | PostgreSQL is accessible & application data persists | DONE | PostgreSQL 16 container running on port 5433; tasks persist across queries |
| 5 | Alembic migrations initialize a fresh database | DONE | `alembic upgrade head` creates `tasks` table and indexes in PostgreSQL |
| 6 | All required Day 1 API endpoints implemented | DONE | Verified: `GET /`, `/health`, `/ready`, `/metrics`, `/api/tasks`, `/api/tasks/{id}`, `POST /api/tasks`, `PUT /api/tasks/{id}`, `DELETE /api/tasks/{id}`, `GET /api/tasks/stats` |
| 7 | Frontend communicates with backend via Vite proxy | DONE | Relative `/api` requests forwarded to `http://localhost:8000` |
| 8 | Task CRUD operations work from UI | DONE | Create, Read, Update, Delete verified via proxy and REST client |
| 9 | Task statistics appear on dashboard | DONE | Total tasks, status breakdown, and priority metrics fetched from `/api/tasks/stats` |
| 10 | Loading, empty, and backend-error states work | DONE | Skeletons, empty state graphics, and error retry banner implemented |
| 11 | `/docs`, `/health`, `/ready`, `/metrics` verified | DONE | All endpoints return HTTP 200 with valid schema payloads |
| 12 | Pytest runs and all implemented tests pass | DONE | 16 tests executed and passing (`pytest -v backend/tests`) |
| 13 | Frontend production build succeeds | DONE | `npm run build` completed with zero errors in 1.06s |
| 14 | README and requirement tracking updated | DONE | Comprehensive beginner-friendly documentation created |
| 15 | Project remains ready for Day 2 Docker integration | DONE | Clean structure, `.env.example`, Docker Compose configured |
