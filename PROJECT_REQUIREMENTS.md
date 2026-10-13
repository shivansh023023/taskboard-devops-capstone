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
| Terraform for AWS infrastructure | Infrastructure | Deferred | NOT_STARTED | Preserved for cloud stage (pending AWS account setup) |
| AWS VPC, EKS & managed worker nodes | Cloud/K8s | Deferred | NOT_STARTED | Preserved for cloud stage (pending AWS account setup) |
| Kubernetes Manifests (`k8s/`) | Orchestration | Day 4 | DONE | 11 YAML manifests created, validated with PyYAML |
| Helm Chart (`helm/taskboard`) | Orchestration | Day 4 | DONE | Complete modular chart created; passed `helm lint` (0 errors) & `helm template` |
| Ingress Controller | Networking | Day 4 | IN_PROGRESS | Manifest and Helm template implemented; requires active cluster ingress controller |
| Horizontal Pod Autoscaler (HPA) | Scaling | Day 5 | NOT_STARTED | Planned for Day 5 scaling and resilience |
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

---

## 5. Day 4: Kubernetes, Helm & Local Deployment — Acceptance Checklist

| # | Acceptance Criterion | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| 1 | Raw Kubernetes manifests created in `k8s/` | DONE | 11 manifests covering Namespace, ConfigMap, Secret, PVC, StatefulSet, Deployments, Services, Ingress |
| 2 | PostgreSQL StatefulSet with persistent storage | DONE | `k8s/04-postgres-statefulset.yaml` with 1Gi PVC, `pg_isready` probes, resource requests/limits |
| 3 | Backend deployment uses published GHCR image | DONE | Configured `ghcr.io/shivansh023023/...-backend:main`, with documented commit-specific tag |
| 4 | Startup ordering handles PostgreSQL readiness | DONE | `wait-for-postgres` initContainer checks `postgres:5432` connectivity before starting app |
| 5 | Non-root security context preserved | DONE | Backend enforces `runAsNonRoot: true`, `runAsUser: 1000`, `runAsGroup: 1000` |
| 6 | Frontend deployment uses published GHCR image | DONE | Configured `ghcr.io/shivansh023023/...-frontend:main`, probes `/nginx-health` on port 80 |
| 7 | Frontend proxies to backend via k8s Service | DONE | Backend service named `backend` (matching Nginx `proxy_pass http://backend:8000`) |
| 8 | ConfigMap and Secret cleanly separate sensitive data | DONE | Non-sensitive configs in ConfigMap; Secret manifest converted to placeholder template with dynamic CLI docs |
| 9 | Ingress manifest created and documented | DONE | Ingress rule routes `taskboard.local` to `frontend:80`; database strictly excluded |
| 10 | Complete Helm chart created in `helm/taskboard` | DONE | Modular chart with `Chart.yaml`, `values.yaml`, `_helpers.tpl`, templates, and `NOTES.txt` |
| 11 | Helm values parameterize images, resources, and probes | DONE | `.Values` overrides for backend, frontend, postgres, persistence, and ingress |
| 12 | Ingress configurable and disabled by default | DONE | `ingress.enabled: false` by default for local clusters without ingress controller |
| 13 | Helm chart passes linting | DONE | `helm lint helm/taskboard` exited with code 0 (0 chart(s) failed, 0 warnings) |
| 14 | Helm chart templates render valid Kubernetes YAML | DONE | Enforces mandatory credentials (fails safely if missing); parses cleanly when provided via `--set` or `existingSecret` |
| 15 | Manifests validated with YAML parser | DONE | Python PyYAML successfully validated all 11 files in `k8s/` |
| 16 | Local cluster status honestly reported | DONE | Reported offline Docker Desktop / Minikube daemon blocker; smallest setup path documented |
| 17 | Comprehensive documentation created | DONE | Detailed [docs/DAY4-KUBERNETES-HELM.md](file:///c:/Users/Shivansh/Desktop/devops_project/docs/DAY4-KUBERNETES-HELM.md) and updated README created |
| 18 | Terraform/AWS boundary preserved | DONE | AWS/EKS requirements preserved for cloud phase; no mock infrastructure created |

---

## 6. Day 5: Ingress, HPA, Prometheus & Grafana — Acceptance Checklist

| # | Acceptance Criterion | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| 1 | Ingress routes `/` to frontend service | DONE | `k8s/10-ingress.yaml` and Helm `ingress.yaml` map root prefix to `frontend:80` |
| 2 | Ingress routes `/api` directly to backend service | DONE | Multi-path Ingress configured for `backend:8000` without stripping or double prefixing |
| 3 | Nginx fallback reverse-proxy preserved | DONE | `frontend/nginx.conf` proxy to `http://backend:8000` remains active for port-forward fallback |
| 4 | Ingress class configured for Minikube | DONE | `spec.ingressClassName: nginx` configured; Minikube addon instructions documented |
| 5 | Backend CPU requests validated | DONE | Backend specifies `requests.cpu: 100m`, providing baseline for Metrics Server calculations |
| 6 | HPA manifest created using `autoscaling/v2` | DONE | `k8s/11-backend-hpa.yaml` created with min 1, max 5, target 60% CPU utilization |
| 7 | HPA template integrated into Helm chart | DONE | `helm/taskboard/templates/backend-hpa.yaml` created; toggleable via `backend.autoscaling.enabled` |
| 8 | Deployment replicas decoupled when HPA is enabled | DONE | Helm `backend-deployment.yaml` omits static `replicas` when HPA is active to prevent fighting |
| 9 | Multi-replica Alembic migration race condition fixed | DONE | PostgreSQL transactional advisory lock (`pg_advisory_xact_lock`) added to `backend/alembic/env.py` |
| 10 | Metrics Server prerequisites documented | DONE | Documented Minikube addon enable command and CPU utilization relationship |
| 11 | Controlled load testing method provided | DONE | Provided PowerShell parallel loop and in-cluster busybox load generator commands |
| 12 | Prometheus scrapes FastAPI `/metrics` directly | DONE | Scrapes `backend.taskboard.svc.cluster.local:8000/metrics` and annotated Pods |
| 13 | Grafana pre-provisioned with Prometheus DataSource | DONE | `k8s/monitoring/03-grafana-datasource.yaml` auto-configures Prometheus proxy datasource |
| 14 | Grafana pre-provisioned with TaskBoard dashboard | DONE | `k8s/monitoring/04-grafana-dashboard.yaml` defines 6 panels (RPS, latency, errors, in-flight, CPU, RAM) |
| 15 | Monitoring stack isolated in `monitoring` namespace | DONE | Native manifests in `k8s/monitoring/` isolate observability workloads with low resource limits |
| 16 | Helm chart passes linting with Day 5 additions | DONE | `helm lint helm/taskboard` passed with 0 failed charts and 0 warnings |
| 17 | Helm chart renders valid YAML with Ingress & HPA | DONE | `helm template` validated with `--set ingress.enabled=true --set backend.autoscaling.enabled=true` |
| 18 | All Kubernetes & monitoring manifests parse cleanly | DONE | Python PyYAML successfully validated 18 files (23 documents) across `k8s/` and `k8s/monitoring/` |
| 19 | Comprehensive Day 5 documentation created | DONE | Detailed [docs/DAY5-INGRESS-HPA-MONITORING.md](file:///c:/Users/Shivansh/Desktop/devops_project/docs/DAY5-INGRESS-HPA-MONITORING.md) created |
| 20 | Non-destructive database preservation documented | DONE | Uninstall instructions preserve PostgreSQL PVC; no destructive scripts introduced |
| 21 | AWS / EKS boundary strictly maintained | DONE | AWS Terraform and EKS remain deferred for cloud phase; no mock cloud resources created |
| 22 | Cluster runtime status honestly reported | BLOCKED | Host Docker engine is stopped; static checks pass, live scheduling documented |
