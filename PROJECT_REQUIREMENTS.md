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
| Pytest automated tests | Testing | Day 1 | DONE | 16/16 automated test suite passing in 0.45s |
| Docker and Docker Compose | DevOps | Day 1-2 | DONE | Full 3-container stack (`postgres`, `backend`, `frontend`) running via Compose on `taskboard_network` |
| Git and GitHub | DevOps | Day 1-2 | DONE | Git repository initialized, pushed to GitHub `origin/main` |
| GitHub Actions CI/CD | CI/CD | Day 3 | DONE | Multi-job workflow (`.github/workflows/ci-cd.yml`) with automated tests and builds |
| Trivy container security scanning | Security | Day 3 | DONE | Trivy scanning integrated with HIGH/CRITICAL blocking exit policy |
| GitHub Container Registry (GHCR) | Container Registry | Day 3 | DONE | Automated multi-tag publishing (`:${{ github.sha }}`, `:latest`, `:main`) to GHCR |
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
| 13 | Frontend production build succeeds | DONE | `npm run build` completed with zero errors in 1.02s |
| 14 | README and requirement tracking updated | DONE | Initial documentation and requirements created |
| 15 | Project remains ready for Day 2 Docker integration | DONE | Clean structure, `.env.example`, Docker Compose configured |

---

## 3. Day 2: Complete Dockerization — Acceptance Checklist

| # | Acceptance Criterion | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| 1 | Backend Dockerfile exists and builds | DONE | `backend/Dockerfile` based on `python:3.13-slim` builds cleanly (`devops_project-backend`) |
| 2 | Backend runs as non-root user | DONE | Configured user/group `appuser` (UID/GID 1000) inside container |
| 3 | Frontend uses multi-stage Docker build | DONE | `frontend/Dockerfile` uses `node:22-alpine` builder and `nginx:alpine` runtime |
| 4 | Final frontend image serves static assets via Nginx | DONE | Static production bundle served from `/usr/share/nginx/html` |
| 5 | Nginx proxies API and operational endpoints | DONE | Reverse proxy rules route `/api`, `/health`, `/ready`, `/metrics`, `/docs`, `/openapi.json` |
| 6 | Docker Compose defines frontend, backend, postgres | DONE | `docker-compose.yml` orchestrates all 3 services on `taskboard_network` |
| 7 | PostgreSQL uses persistent storage | DONE | Named volume `taskboard_postgres_data` mapped to `/var/lib/postgresql/data` |
| 8 | Backend uses internal database connection | DONE | `DATABASE_URL` connects via service DNS to `postgres:5432` |
| 9 | Alembic migrations run before API starts | DONE | `entrypoint.sh` executes `alembic upgrade head` before replacing process with `uvicorn` |
| 10 | Health checks and startup dependencies work | DONE | `depends_on` with `service_healthy` conditions for postgres -> backend -> frontend |
| 11 | `docker compose up --build` starts full app | DONE | All 3 containers started, healthy, and operational |
| 12 | Frontend accessible at `http://localhost:3000` | DONE | Verified HTTP 200 on port 3000 |
| 13 | API endpoints work through Nginx | DONE | `/health`, `/ready`, `/docs`, `/metrics`, `/api/tasks`, `/api/tasks/stats` all return 200 |
| 14 | CRUD operations work end-to-end | DONE | Tasks created, updated, and listed through port 3000 proxy |
| 15 | Database data survives container restarts | DONE | Verified task data persists across `docker compose restart` |
| 16 | Existing backend tests still pass | DONE | 16/16 Pytest tests pass against database on host port 5433 |
| 17 | Frontend production build succeeds | DONE | `npm run build` succeeds on host in 1.02s |
| 18 | README and requirement tracking updated | DONE | Updated with full Day 2 Docker workflow, commands, and architecture |

---

## 4. Day 3: CI/CD, Trivy & GHCR — Acceptance Checklist

| # | Acceptance Criterion | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| 1 | Workflow file exists and YAML is valid | DONE | `.github/workflows/ci-cd.yml` created; validated via Python PyYAML parser |
| 2 | Automated tests run against real PostgreSQL in CI | DONE | Job `backend-tests` launches `postgres:16-alpine` service, runs Alembic & Pytest |
| 3 | Frontend builds in CI | DONE | Job `frontend-build` executes clean `npm ci` and `npm run build` |
| 4 | Actions pinned to immutable commit SHAs | DONE | Pinned SHAs used for checkout, python, node, buildx, login, build-push, and trivy |
| 5 | Docker images build in CI | DONE | Job `docker-build-and-scan` builds backend and frontend images locally |
| 6 | Trivy vulnerability scan runs on both images | DONE | Scans OS packages and application dependencies for CVEs |
| 7 | Blocking policy for HIGH and CRITICAL vulnerabilities | DONE | Configured `exit-code: '1'` and `severity: 'HIGH,CRITICAL'` |
| 8 | Images published to GHCR only on main push | DONE | Condition: `github.event_name == 'push' && github.ref == 'refs/heads/main'` |
| 9 | PRs run validation and security without publishing | DONE | PRs trigger tests, build, and Trivy; `publish-ghcr` job skipped on PRs |
| 10 | Dynamic lowercased repository naming for GHCR | DONE | `ghcr.io/<owner>/<repo>-backend` and `-frontend` formatted safely |
| 11 | Multi-tag strategy (commit SHA, latest, main) | DONE | Images tagged with immutable SHA (`:${{ github.sha }}`), `:latest`, and `:main` |
| 12 | Principle of least privilege enforced | DONE | Global `contents: read`; only `publish-ghcr` gets `packages: write` |
| 13 | Step summary report generated | DONE | Job `pipeline-summary` outputs rich Markdown table to `$GITHUB_STEP_SUMMARY` |
| 14 | Comprehensive documentation created | DONE | Detailed [docs/DAY3-CICD.md](file:///c:/Users/Shivansh/Desktop/devops_project/docs/DAY3-CICD.md) and updated README created |
| 15 | Ready for Day 4 AWS & Terraform infrastructure | DONE | Verified container images in GHCR will serve as deployment targets for Kubernetes |
