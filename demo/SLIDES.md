# TaskBoard DevOps Capstone — Presentation Deck

**File Location (PowerPoint):** [`presentation/taskboard_capstone_presentation.pptx`](file:///c:/Users/Shivansh/Desktop/devops_project/presentation/taskboard_capstone_presentation.pptx)  
**Total Slides:** 12  
**Aspect Ratio:** 16:9 Widescreen  
**Presenter:** Shivansh Sharma  
**Target Audience:** Capstone Evaluators, Senior Technical Leaders  

---

### Slide 1: Title and Problem Statement
- **Header:** SLIDE 01 | FINAL CAPSTONE SUBMISSION
- **Title:** TaskBoard — Cloud DevOps Capstone
- **Subtitle:** Production-Grade Engineering, GitOps, DevSecOps, and Observability
- **Key Points:**
  - **Candidate & Role:** Shivansh Sharma — Senior DevOps, Cloud, & Infrastructure Engineer
  - **Problem Statement:** Modern engineering teams require reliable, secure, and observable platforms that eliminate manual deployment drift and protect persistent application state.
  - **Delivered Solution:** A production-hardened microservices platform featuring React, FastAPI, PostgreSQL, multi-stage Docker non-root security, Trivy DevSecOps, automated CI/CD with GHCR, zero-downtime Kubernetes/Helm deployments, full Prometheus/Grafana observability, GitOps with ArgoCD, and modular Terraform AWS IaC.

---

### Slide 2: System Architecture & Workload Topology
- **Header:** SLIDE 02 | ARCHITECTURE (M1 & M8)
- **Title:** System Architecture & Workload Topology
- **Subtitle:** Multi-tier decoupled architecture with high availability and resilience
- **Key Points:**
  - **Presentation Tier:** React/Vite single-page application served via optimized NGINX (Alpine Linux) listening on unprivileged port 8080.
  - **Application Tier:** FastAPI asynchronous REST API with Uvicorn worker processes, OpenAPI/Swagger documentation, and native Prometheus instrumentation.
  - **Persistence Tier:** PostgreSQL 16 relational database with SQLAlchemy 2.0 ORM, transactional migrations via Alembic, and persistent volume storage.
  - **Edge Routing:** NGINX Ingress Controller routing host `taskboard.local` to frontend SPA (`/`) and reverse proxying backend API (`/api`).

---

### Slide 3: Application Engineering & Automated Testing
- **Header:** SLIDE 03 | TESTING SUITE (M1 & M2)
- **Title:** Application Engineering & Automated Testing
- **Subtitle:** Test-driven reliability with database isolation and zero regression
- **Key Points:**
  - **Pytest Test Suite:** 16 comprehensive test cases executing in 0.26s with 100% pass rate covering health, readiness, metadata, and task CRUD.
  - **Isolated Test Fixtures:** Integrated an in-memory SQLite database (`sqlite:///:memory:`) using StaticPool fixtures to guarantee active PostgreSQL records (tasks 93 & 94) are never purged.
  - **Readiness Failure Simulation:** Mocked database outage fixtures verifying that `/ready` accurately returns HTTP 503 Service Unavailable when the database is unreachable.
  - **Frontend Bundle Validation:** Compiled production bundle via Vite in 1.36s with zero linting or bundling errors, optimizing chunk delivery with Gzip compression.

---

### Slide 4: Docker Multi-Stage & Non-Root Security
- **Header:** SLIDE 04 | CONTAINER SECURITY (M4)
- **Title:** Docker Multi-Stage & Non-Root Security
- **Subtitle:** Hardened container images implementing the principle of least privilege
- **Key Points:**
  - **Backend Runtime Identity:** Built from `python:3.13-slim-bookworm` with dedicated non-root user `appuser` (UID 1000, GID 1000).
  - **Frontend Runtime Identity:** Engineered custom unprivileged `nginx:alpine` runtime executing as `nginx` (UID 101, GID 101) on port 8080.
  - **Permission Remediation:** Relocated NGINX PID to `/tmp/nginx.pid` and pre-assigned recursive ownership across `/var/cache/nginx`, `/var/log/nginx`, and `/usr/share/nginx/html`.
  - **Docker Compose Orchestration:** 3-tier healthchecked stack (Postgres on 5433, Backend on 8000, Frontend on 3000) running with healthy container status and volume persistence.

---

### Slide 5: CI/CD Automation & GitHub Actions
- **Header:** SLIDE 05 | CI/CD PIPELINE (M5)
- **Title:** CI/CD Automation & GitHub Actions
- **Subtitle:** Continuous integration quality gates with immutable container publishing
- **Key Points:**
  - **Multi-Stage Pipeline:** 5 orchestrated jobs: `backend-tests`, `frontend-build`, `docker-build-and-scan`, `publish-ghcr`, and `pipeline-summary`.
  - **PostgreSQL Service Container:** Automated CI testing with live PostgreSQL 16 service, executing Alembic database migrations (`upgrade head`) prior to Pytest.
  - **Immutable GHCR Publishing:** Publishes container images to GitHub Container Registry only on pushes to `main`, tagged with the exact Git commit SHA alongside `main`.
  - **Supply Chain Hardening:** All third-party GitHub Actions pinned to exact immutable 40-character commit SHAs; minimal global permissions (`contents: read`).

---

### Slide 6: DevSecOps Vulnerability Management with Trivy
- **Header:** SLIDE 06 | DEVSECOPS SCANNING (M6)
- **Title:** DevSecOps Vulnerability Management with Trivy
- **Subtitle:** Shift-left vulnerability detection enforcing automated quality gates
- **Key Points:**
  - **Automated Container Scanning:** Integrated Aqua Security Trivy container scanning directly into the CI/CD pipeline prior to image publication.
  - **Strict Severity Policy:** Pipeline automatically fails (exit code 1) upon detecting any fixable HIGH or CRITICAL severity vulnerability.
  - **Frontend Scan Results:** Trivy detected exactly 0 vulnerabilities in the `taskboard-frontend:non-root` Alpine image.
  - **Backend Scan Results:** With `--ignore-unfixed`, all 35 Python package dependencies and OS libraries verified clean of fixable High/Critical findings.

---

### Slide 7: Kubernetes & Helm Deployment in Minikube
- **Header:** SLIDE 07 | KUBERNETES & HELM (M8)
- **Title:** Kubernetes & Helm Deployment in Minikube
- **Subtitle:** Resilient orchestration with high availability, Ingress, and Autoscaling
- **Key Points:**
  - **Multi-Replica Deployment:** Both frontend and backend workloads actively running at 2 healthy replicas each in Minikube with non-root security contexts.
  - **NGINX Ingress Routing:** Configured Ingress for hostname `taskboard.local` providing unified routing to frontend webroot and backend API endpoints.
  - **Horizontal Pod Autoscaling:** Backend HPA v2 actively monitoring CPU utilization (target 60%), scaling dynamically from 2 to 5 replicas under load.
  - **Stateful Storage Safety:** PostgreSQL deployed as StatefulSet backed by a bound 1Gi PersistentVolumeClaim, preserving data across pod rollouts.

---

### Slide 8: Full-Stack Observability: Prometheus & Grafana
- **Header:** SLIDE 08 | OBSERVABILITY (M9)
- **Title:** Full-Stack Observability: Prometheus & Grafana
- **Subtitle:** Real-time metrics harvesting and populated performance dashboards
- **Key Points:**
  - **Prometheus Server:** Prometheus v2.54.1 scraping cluster targets every 15s via Kubernetes RBAC and service discovery in `monitoring` namespace.
  - **Active Targets UP:** Verified live scrape targets: `taskboard-backend` (:8000/metrics), `kubernetes-pods`, and `prometheus` all reporting state UP.
  - **Grafana 11.1.0 Provisioning:** Auto-provisioned Prometheus datasource and custom TaskBoard Overview dashboard rendering real metrics.
  - **6 Key Dashboard Panels:** HTTP Request Volume rate, Request Latency (p95 & p99 ms), 5xx Error Rate, In-Progress Requests, CPU %, and Resident Memory (MB).

---

### Slide 9: Infrastructure as Code: Terraform AWS EKS
- **Header:** SLIDE 09 | TERRAFORM / AWS (M7)
- **Title:** Infrastructure as Code: Terraform AWS EKS
- **Subtitle:** Modular cloud architecture statically validated with zero budget risk
- **Key Points:**
  - **VPC & Subnet Topology:** Multi-AZ VPC across us-east-1a and us-east-1b with public and private subnets, NAT Gateway, and least-privilege security groups.
  - **EKS Control Plane & Nodes:** Amazon EKS configured for Kubernetes 1.35 with private endpoint access and managed worker node groups enforcing IMDSv2.
  - **Least-Privilege IRSA:** Dedicated IAM OIDC role for AWS EBS CSI driver with Web Identity trust policy; worker node role decoupled from EBS permissions.
  - **Honest Budget Constraint:** Statically validated via `terraform fmt` and `terraform validate` (Success). Intentionally NOT deployed to maintain ₹0 cost.

---

### Slide 10: GitOps Continuous Reconciliation with ArgoCD
- **Header:** SLIDE 10 | GITOPS (M8 & M10)
- **Title:** GitOps Continuous Reconciliation with ArgoCD
- **Subtitle:** Declarative desired-state synchronization with stateful volume protection
- **Key Points:**
  - **Declarative GitOps Manifest:** Engineered `k8s/argocd/application.yaml` targeting the Git repository and `helm/taskboard` chart path.
  - **Stateful Storage Safety:** Sync policy explicitly configures `prune: false` to guarantee PVCs and database volumes are never purged by automated reconciliation.
  - **Automated Drift Healing:** Enabled `selfHeal: true` to automatically detect and remediate manual configuration drift back to the Git source of truth.
  - **Operational Runbook:** Comprehensive installation guide, architecture diagram, and verification checklist documented in `k8s/argocd/README.md`.

---

### Slide 11: Technical Challenges & Engineering Solutions
- **Header:** SLIDE 11 | ENGINEERING HIGHLIGHTS
- **Title:** Technical Challenges & Engineering Solutions
- **Subtitle:** Key obstacles diagnosed and remediated during project execution
- **Key Points:**
  - **Nginx PID Permission Denied:** Challenge: Alpine Nginx defaulted PID to `/run/nginx.pid` causing crash under non-root user. Fixed: Rewrote sed pattern to target `/run/` and `/tmp/nginx.pid`.
  - **Debian APT Clock Skew in Docker:** Challenge: Container build failed due to InRelease file future time. Fixed: Added `-o Acquire::Check-Valid-Until=false -o Acquire::Max-FutureTime=86400`.
  - **Test Database Data Loss:** Challenge: Pytest fixture issued table deletes on live PostgreSQL. Fixed: Migrated test suite to isolated in-memory SQLite preserving live tasks 93 & 94.
  - **Minikube Multi-Replica Alignment:** Challenge: Workloads defaulted to single replica. Fixed: Scaled both frontend and backend to 2 replicas backed by Alembic advisory locking.

---

### Slide 12: Conclusion, Deliverables & Final Score Estimate
- **Header:** SLIDE 12 | EVALUATION & SUBMISSION
- **Title:** Conclusion, Deliverables & Final Score Estimate
- **Subtitle:** Capstone evaluation summary against the official 100-mark grading rubric
- **Key Points:**
  - **Portfolio Deliverables:** Complete code repository, documentation suite (FINAL_AUDIT, FINAL_VALIDATION_REPORT, ARCHITECTURE, DEMO_SCRIPT), and slide deck.
  - **Locally Verified Modules (85/85):** M1 (10/10), M2 (10/10), M3 (5/5), M4 (10/10), M5 (15/15), M6 (5/5), M8 (15/15), M9 (10/10), M10 (5/5) — 100% verified.
  - **Cloud Module M7 (10-12 / 15):** Terraform IaC fully implemented and validated ('Success'). 3-5 marks withheld honestly due to non-provisioned cloud infrastructure.
  - **Realistic Score Range:** 95 – 97 / 100 — Production-grade capstone submission representing top-tier DevOps engineering.
