# TaskBoard Day 4 — Kubernetes, Helm & Local Deployment Guide

## 1. Executive Summary & Architecture Overview

Day 4 introduces container orchestration for TaskBoard using native **Kubernetes manifests** and a modular **Helm chart** (`helm/taskboard`). The architecture replicates the multi-tier application stack within a Kubernetes cluster:

```
                                  [ User Browser ]
                                         │
                         (Port-Forward or Ingress)
                                         ▼
            ┌────────────────────────────────────────────────────────┐
            │               TaskBoard Namespace                       │
            │                                                        │
            │   ┌────────────────────────────────────────────────┐   │
            │   │ Frontend Service (ClusterIP: port 80)          │   │
            │   └───────────────────────┬────────────────────────┘   │
            │                           ▼                            │
            │   ┌────────────────────────────────────────────────┐   │
            │   │ Frontend Pod (Nginx 1.27 + React SPA)          │   │
            │   │  - Serves static assets                        │   │
            │   │  - /nginx-health probe endpoint                │   │
            │   │  - Proxies /api and /health to backend:8000    │   │
            │   └───────────────────────┬────────────────────────┘   │
            │                           │                            │
            │                           ▼                            │
            │   ┌────────────────────────────────────────────────┐   │
            │   │ Backend Service (ClusterIP: port 8000)         │   │
            │   │ (DNS name: 'backend')                          │   │
            │   └───────────────────────┬────────────────────────┘   │
            │                           ▼                            │
            │   ┌────────────────────────────────────────────────┐   │
            │   │ Backend Pod (FastAPI, non-root UID 1000)       │   │
            │   │  - initContainer: wait-for-postgres (5432)     │   │
            │   │  - entrypoint: Alembic migrations -> Uvicorn   │   │
            │   │  - Probes: /health (liveness), /ready (DB)     │   │
            │   └───────────────────────┬────────────────────────┘   │
            │                           │                            │
            │                           ▼                            │
            │   ┌────────────────────────────────────────────────┐   │
            │   │ PostgreSQL Service (ClusterIP: port 5432)      │   │
            │   │ (DNS name: 'postgres')                         │   │
            │   └───────────────────────┬────────────────────────┘   │
            │                           ▼                            │
            │   ┌────────────────────────────────────────────────┐   │
            │   │ PostgreSQL StatefulSet (postgres:16-alpine)    │   │
            │   │  - Single replica (local dev appropriate)      │   │
            │   │  - PersistentVolumeClaim: 1Gi Storage          │   │
            │   │  - pg_isready liveness/readiness probes        │   │
            │   └────────────────────────────────────────────────┘   │
            └────────────────────────────────────────────────────────┘
```

---

## 2. Resource Inventory & Design Decisions

### A. Raw Manifests (`k8s/`)

| File | Resource | Purpose |
| :--- | :--- | :--- |
| `00-namespace.yaml` | `Namespace` (`taskboard`) | Dedicated boundary isolating TaskBoard resources from system components. |
| `01-configmap.yaml` | `ConfigMap` (`taskboard-config`) | Non-sensitive runtime variables (`ENVIRONMENT`, `API_V1_STR`, `POSTGRES_DB`, etc.). |
| `02-secret.yaml` | `Secret` (`taskboard-secrets`) | Base64-encoded database credentials template (`POSTGRES_PASSWORD`, `DATABASE_URL`). |
| `03-postgres-pvc.yaml` | `PersistentVolumeClaim` (`postgres-pvc`) | Persistent storage request (1Gi, `ReadWriteOnce`) preserving data across restarts. |
| `04-postgres-statefulset.yaml` | `StatefulSet` (`postgres`) | PostgreSQL 16 container, single replica, mounted with persistent volume on `/var/lib/postgresql/data`. |
| `05-postgres-service.yaml` | `Service` (`postgres`) | Internal `ClusterIP` exposing port 5432. Not accessible externally. |
| `06-backend-deployment.yaml` | `Deployment` (`backend`) | FastAPI backend with `wait-for-postgres` initContainer, non-root security context, and health probes. |
| `07-backend-service.yaml` | `Service` (`backend`) | Internal `ClusterIP` exposing port 8000. Name `backend` matches Nginx reverse-proxy rules. |
| `08-frontend-deployment.yaml` | `Deployment` (`frontend`) | React SPA served via Nginx with `/nginx-health` probes and zero database credential exposure. |
| `09-frontend-service.yaml` | `Service` (`frontend`) | Internal `ClusterIP` exposing port 80 for web and API proxy traffic. |
| `10-ingress.yaml` | `Ingress` (`taskboard-ingress`) | Optional routing rule directing `taskboard.local` to `frontend:80`. |

### B. Security & Secrets Management
> [!WARNING]
> **Base64 is encoding, not encryption!**
> Kubernetes Secrets store data as Base64 strings by default. Anyone with read access to the cluster, namespace, or Git history can decode them instantly:
> ```powershell
> [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String("<encoded_value>"))
> ```
> Therefore:
> 1. `k8s/02-secret.yaml` is provided strictly as a **non-working schema template** with placeholders. It **must not** be applied unchanged, and real credentials must **never** be committed to Git.
> 2. Local development passwords must never be reused in staging or production.
> 3. Secrets should always be generated dynamically inside the cluster using CLI commands or integrated with an external secret management provider (e.g. HashiCorp Vault, AWS Secrets Manager, or External Secrets Operator).

#### Dynamic Secret Creation Workflow (PowerShell)
To safely generate and provision the required Kubernetes Secret locally without committing any credentials:

```powershell
# 1. Generate a cryptographically secure, URL-safe alphanumeric password (24 chars)
$chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
$bytes = New-Object byte[] 24
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$dbPassword = (-join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] }))

# 2. Safely construct the URI (using URI escaping for reserved character safety)
$escapedPassword = [System.Uri]::EscapeDataString($dbPassword)
$databaseUrl = "postgresql+psycopg://taskboard:$($escapedPassword)@postgres:5432/taskboard"

# 3. Create the Secret directly in the taskboard namespace
kubectl create secret generic taskboard-secrets -n taskboard `
  --from-literal=POSTGRES_PASSWORD="$dbPassword" `
  --from-literal=DATABASE_URL="$databaseUrl"

# 4. Verify Secret creation WITHOUT printing credentials
kubectl get secret taskboard-secrets -n taskboard
```

### C. Migration & Multi-Replica Concurrency Strategy
- **Local Single-Replica:** Alembic migrations are executed automatically during backend container startup via `entrypoint.sh` (`alembic upgrade head`).
- **Startup Ordering:** The backend pod contains an `initContainer` (`wait-for-postgres`) running `pg_isready -h postgres -p 5432`. This prevents backend crash loops when PostgreSQL is initializing.
- **Production Multi-Replica Note:** If the backend deployment is scaled to multiple replicas, running migrations concurrently inside pod entrypoints can cause Alembic migration lock contention and schema race conditions. For production deployments, migrations should be decoupled into a pre-install/pre-upgrade Kubernetes Job (e.g., using Helm hooks).

---

## 3. Helm Chart Structure & Mapping

The Helm chart in `helm/taskboard/` maps `.Values` parameters into dynamic templates:

| Values Path | Default Value | Mapped Resource / Usage |
| :--- | :--- | :--- |
| `backend.image.repository` | `ghcr.io/shivansh023023/...-backend` | Container image repository in backend Deployment |
| `backend.image.tag` | `main` | Image tag (`main` or immutable commit SHA) |
| `backend.replicaCount` | `1` | Backend deployment replicas |
| `backend.resources` | `requests: 100m/128Mi, limits: 500m/512Mi` | CPU & memory constraints |
| `frontend.image.repository` | `ghcr.io/shivansh023023/...-frontend` | Container image repository in frontend Deployment |
| `frontend.image.tag` | `main` | Image tag |
| `postgresql.auth.password` | `""` | Database password (must be provided if `existingSecret` is omitted) |
| `postgresql.auth.existingSecret` | `""` | Pre-created Secret name (`taskboard-secrets`) |
| `postgresql.persistence.enabled`| `true` | Creates PersistentVolumeClaim and attaches to StatefulSet |
| `ingress.enabled` | `false` | Disabled by default for local clusters without Ingress controller |

> [!IMPORTANT]
> **No Unsafe Password Fallbacks:**
> The Helm chart enforces a hard failure if both `postgresql.auth.password` and `postgresql.auth.existingSecret` are empty. It will **never** silently substitute an insecure default password.

### Pinning Immutable Image Releases
While `main` allows rapid development tracking, production releases should pin immutable commit SHAs:
```powershell
helm upgrade --install taskboard helm/taskboard `
  --namespace taskboard `
  --set postgresql.auth.existingSecret=taskboard-secrets `
  --set backend.image.tag=f444898ae2c35c922bc0abedbe14360d97af9652 `
  --set frontend.image.tag=f444898ae2c35c922bc0abedbe14360d97af9652
```

---

## 4. Local Deployment Instructions (When Cluster Is Active)

### Prerequisites
- Docker Desktop with Kubernetes enabled **OR** Minikube running (`minikube start`)
- `kubectl` client configured to target the active cluster context
- `helm` v3/v4 installed

### Option 1: Deploying via Helm (Recommended)

1. **Create Namespace and Secret:**
   ```powershell
   kubectl create namespace taskboard

   # Generate a safe local password and secret:
   $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
   $bytes = New-Object byte[] 24
   [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
   $dbPassword = (-join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] }))
   $databaseUrl = "postgresql+psycopg://taskboard:$([System.Uri]::EscapeDataString($dbPassword))@postgres:5432/taskboard"

   kubectl create secret generic taskboard-secrets -n taskboard `
     --from-literal=POSTGRES_PASSWORD="$dbPassword" `
     --from-literal=DATABASE_URL="$databaseUrl"
   ```

2. **Verify the Secret Exists (Without Exposing Credentials):**
   ```powershell
   kubectl get secret taskboard-secrets -n taskboard
   ```

3. **Install or Upgrade the Release Referencing the Existing Secret:**
   ```powershell
   helm upgrade --install taskboard helm/taskboard `
     --namespace taskboard `
     --set postgresql.auth.existingSecret=taskboard-secrets
   ```

4. **Verify Deployment Rollout:**
   ```powershell
   kubectl get pods -n taskboard -w
   ```

5. **Port-Forward to Access Application:**
   ```powershell
   kubectl port-forward svc/frontend 3000:80 -n taskboard
   ```
   Open `http://localhost:3000` in your web browser.

### Option 2: Deploying via Raw Manifests

When deploying with raw manifests, do **not** apply `k8s/02-secret.yaml` directly, as it contains non-working placeholders. Instead, create the secret dynamically using the same `kubectl create secret` command:

```powershell
# 1. Create namespace
kubectl apply -f k8s/00-namespace.yaml

# 2. Create the Secret dynamically (do NOT commit secrets)
$chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
$bytes = New-Object byte[] 24
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$dbPassword = (-join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] }))
$databaseUrl = "postgresql+psycopg://taskboard:$([System.Uri]::EscapeDataString($dbPassword))@postgres:5432/taskboard"

kubectl create secret generic taskboard-secrets -n taskboard `
  --from-literal=POSTGRES_PASSWORD="$dbPassword" `
  --from-literal=DATABASE_URL="$databaseUrl"

# 3. Apply configurations, storage, and workloads
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/03-postgres-pvc.yaml
kubectl apply -f k8s/04-postgres-statefulset.yaml
kubectl apply -f k8s/05-postgres-service.yaml
kubectl apply -f k8s/06-backend-deployment.yaml
kubectl apply -f k8s/07-backend-service.yaml
kubectl apply -f k8s/08-frontend-deployment.yaml
kubectl apply -f k8s/09-frontend-service.yaml
```

---

## 5. Health Checks & Verification Commands

Once port-forwarding is running (`kubectl port-forward svc/frontend 3000:80 -n taskboard`):

| Endpoint | Test Command | Expected Output |
| :--- | :--- | :--- |
| Frontend Health | `Invoke-RestMethod http://localhost:3000/nginx-health` | `healthy` |
| Backend Liveness | `Invoke-RestMethod http://localhost:3000/health` | `{"status":"ok"}` |
| Database Readiness | `Invoke-RestMethod http://localhost:3000/ready` | `{"status":"ready","database":"connected"}` |
| Prometheus Metrics | `Invoke-RestMethod http://localhost:3000/metrics` | Prometheus metrics text stream |
| Task List API | `Invoke-RestMethod http://localhost:3000/api/tasks` | `[]` (or JSON array of tasks) |
| Create Task | `Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/tasks -Body '{"title":"K8s Task","status":"todo","priority":"high"}' -ContentType 'application/json'` | HTTP 201 with created task |

### Data Persistence Verification
To verify data persistence across Pod restarts:
```powershell
# 1. Create a task via API
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/tasks -Body '{"title":"Persistent Task","status":"in_progress"}' -ContentType 'application/json'

# 2. Delete the PostgreSQL Pod to force Kubernetes to recreate it
kubectl delete pod postgres-0 -n taskboard

# 3. Wait for PostgreSQL to return to Ready state
kubectl wait --for=condition=ready pod/postgres-0 -n taskboard --timeout=60s

# 4. Query tasks again to verify the task still exists
Invoke-RestMethod http://localhost:3000/api/tasks
```

---

## 6. Troubleshooting Runbook

### 1. `Pending` Pods
- **Cause:** Cluster lacks sufficient CPU/memory or persistent storage driver cannot bind the PVC.
- **Diagnostics:** `kubectl describe pod <pod-name> -n taskboard`
- **Resolution:** Verify `kubectl get pvc -n taskboard` shows `Bound`. In Minikube or Docker Desktop, default storage classes are automatically provided.

### 2. `ImagePullBackOff` / `ErrImagePull`
- **Cause:** Network timeout, typo in repository name, or private registry permissions.
- **Diagnostics:** `kubectl describe pod <pod-name> -n taskboard`
- **Resolution:** Verify GHCR package is public (`ghcr.io/shivansh023023/...`). If private, configure an `imagePullSecret`.

### 3. `CrashLoopBackOff` on Backend
- **Cause:** Database connection failure or unapplied migrations.
- **Diagnostics:** `kubectl logs -n taskboard deployment/taskboard-backend -c backend`
- **Resolution:** Check `wait-for-postgres` init container logs: `kubectl logs -n taskboard deployment/taskboard-backend -c wait-for-postgres`. Ensure `POSTGRES_PASSWORD` in Secret matches database credentials.

### 4. Failed Health / Readiness Probes
- **Cause:** Application slow to start or database unreachable.
- **Diagnostics:** `kubectl describe pod <pod-name> -n taskboard` (look at Events for `Unhealthy`).
- **Resolution:** Increase `initialDelaySeconds` or `failureThreshold` in deployment manifest or Helm values.

---

## 7. Cleanup Commands

### Routine Testing Cleanup (Preserves PVC & All Data)
When testing re-deployments or restarting workloads, never delete the PVC:

```powershell
# Option A: If using Helm (Helm uninstalls workloads and preserves PVCs by default)
helm uninstall taskboard -n taskboard

# Option B: If using raw manifests (delete workloads and configs, preserve PVC)
kubectl delete -f k8s/06-backend-deployment.yaml,k8s/07-backend-service.yaml,k8s/08-frontend-deployment.yaml,k8s/09-frontend-service.yaml,k8s/04-postgres-statefulset.yaml,k8s/05-postgres-service.yaml,k8s/01-configmap.yaml,k8s/02-secret.yaml,k8s/10-ingress.yaml
```

> ⚠️ **Data Safety Warning**: Never run `kubectl delete -f k8s/` or `kubectl delete namespace taskboard` during routine testing, because doing so deletes `03-postgres-pvc.yaml` and destroys all PostgreSQL database volume data!

### Destructive Purge (Deletes All Data)
Only execute these commands when you want to permanently erase all application data and remove the namespace:

```powershell
# Delete the persistent volume claim and purge storage
kubectl delete -f k8s/03-postgres-pvc.yaml

# Delete the namespace and any remaining resources
kubectl delete -f k8s/00-namespace.yaml
```

---

## 8. Differences: Local Kubernetes vs. Production AWS EKS

| Dimension | Local Kubernetes (Minikube / Docker Desktop) | Production AWS EKS |
| :--- | :--- | :--- |
| **Node Architecture** | Single-node control plane + worker shared | Multi-AZ managed worker node groups (e.g., m5.large) |
| **Database** | Single-replica PostgreSQL StatefulSet on local PVC | Amazon RDS PostgreSQL Multi-AZ or CloudNativePG Operator |
| **Ingress & DNS** | `kubectl port-forward` or local Nginx Ingress | AWS Load Balancer Controller (ALB) + Route 53 + ACM SSL |
| **Storage Class** | Hostpath / docker-desktop default provisioner | AWS EBS CSI Driver (`gp3` storage class) |
| **Secrets Management** | Kubernetes Opaque Secrets | AWS Secrets Manager integrated via External Secrets Operator |
| **Infrastructure Tool** | Local CLI | Terraform (VPC, subnets, IGW, NAT Gateways, EKS cluster) |
