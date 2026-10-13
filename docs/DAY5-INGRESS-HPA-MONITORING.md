# Day 5: Ingress, Horizontal Pod Autoscaling & Monitoring

This document details the architecture, configuration, deployment, validation, and operations for Day 5 of the TaskBoard DevOps Capstone project.

---

## 1. Architecture Overview

### 1.1 Ingress Request Flow & Service Routing

```
                            [ User Browser / Client ]
                                        |
                            http://taskboard.local
                                        |
                 +----------------------+----------------------+
                 |          Minikube Ingress Controller        |
                 |                 (ingress-nginx)             |
                 +----------------------+----------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
           Path: /api/*                                    Path: /*
                 |                                             |
                 v                                             v
     +-----------------------+                     +-----------------------+
     |  backend Service:8000 |                     | frontend Service:80   |
     +-----------+-----------+                     +-----------+-----------+
                 |                                             |
                 v                                             v
     +-----------------------+                     +-----------------------+
     | Backend Pod (FastAPI) |                     | Frontend Pod (Nginx)  |
     |  Mounts /api/tasks    |                     | Serves SPA React App  |
     +-----------+-----------+                     | Proxy fallback: /api  |
                 |                                 +-----------------------+
                 v
     +-----------------------+
     | postgres Service:5432 |
     +-----------+-----------+
                 |
                 v
     +-----------------------+
     | PostgreSQL StatefulSet|
     | Persistent Volume 1Gi |
     +-----------------------+
```

**Key Routing Principles:**
- **Frontend SPA Routing:** Requests to `/` match the Ingress frontend rule and route to `frontend:80`. Nginx serves `index.html` and static assets.
- **Backend API Routing:** Requests to `/api` route directly to `backend:8000`. Since FastAPI mounts routes under `/api` (`/api/tasks`), paths are passed directly without requiring rewrite annotations (`rewrite-target`).
- **Nginx Fallback Preservation:** `frontend/nginx.conf` continues to maintain internal `proxy_pass http://backend:8000` rules. If port-forwarding to the frontend directly (`kubectl port-forward svc/frontend 8080:80`), API requests are still reverse-proxied transparently.
- **Database Isolation:** PostgreSQL is strictly bound to `postgres:5432` inside the cluster and is deliberately excluded from Ingress routing.

---

### 1.2 HPA Control Loop Architecture

```
  +----------------------+          +----------------------+
  |    Kubelet / cAdvisor|  ----->  |    Metrics Server    |
  |  (measures Pod CPU)  |          | (metrics.k8s.io API) |
  +----------------------+          +----------+-----------+
                                               |
                                               v
                                    +----------------------+
                                    |    HPA Controller    |
                                    | (calculates desired) |
                                    +----------+-----------+
                                               |
                                               v
                                    +----------------------+
                                    | Backend Deployment   |
                                    | (scales 1 to 5 Pods) |
                                    +----------------------+
```

**Resource Calculations:**
$$\text{Desired Replicas} = \left\lceil \text{Current Replicas} \times \left( \frac{\text{Current CPU Utilization}}{\text{Target CPU Utilization (60\%)}} \right) \right\rceil$$

Where:
- $\text{CPU Utilization \%} = \frac{\text{Raw CPU Millicores Used}}{\text{Resource Request (100m)}} \times 100$

---

### 1.3 Observability & Monitoring Architecture

```
  +--------------------------------+           +---------------------------------+
  |      Namespace: taskboard      |           |      Namespace: monitoring      |
  |                                |           |                                 |
  |  +--------------------------+  |           |  +---------------------------+  |
  |  | Backend Pod (:8000)      |  |  Scrapes  |  | Prometheus Server (:9090) |  |
  |  | Path: /metrics           |<-+-----------+--| - taskboard-backend job   |  |
  |  | Annotations:             |  |   (10s)   |  | - kubernetes-pods SD      |  |
  |  |  prometheus.io/scrape=true  |           |  +-------------+-------------+  |
  |  +--------------------------+  |           |                |                |
  +--------------------------------+           |                | Queries (PromQL)
                                               |                v                |
                                               |  +---------------------------+  |
                                               |  | Grafana Dashboard (:3000) |  |
                                               |  | Pre-provisioned Dashboards|  |
                                               |  | - taskboard-overview      |  |
                                               |  +---------------------------+  |
                                               +---------------------------------+
```

---

## 2. Ingress Configuration & Validation

### 2.1 Manifest Structure

In `k8s/10-ingress.yaml` and `helm/taskboard/templates/ingress.yaml`:
- **API Version:** `networking.k8s.io/v1`
- **Ingress Class:** `ingressClassName: nginx`
- **Host:** `taskboard.local`
- **Rules:**
  1. `/api` (Prefix) -> Service `backend:8000`
  2. `/` (Prefix) -> Service `frontend:80`

### 2.2 Enabling & Verifying Ingress Controller in Minikube

```powershell
# 1. Enable ingress addon in Minikube
minikube addons enable ingress

# 2. Verify ingress controller pods are running
kubectl get pods -n ingress-nginx

# 3. Add DNS mapping to Windows hosts file (Run PowerShell as Administrator)
# C:\Windows\System32\drivers\etc\hosts
# Add line:
# 127.0.0.1 taskboard.local

# 4. Start Minikube tunnel in a separate PowerShell window (Required on Windows/Docker driver)
minikube tunnel
```

### 2.3 Testing Ingress Routing

```powershell
# Test frontend SPA root
curl.exe -i http://taskboard.local/

# Test backend API through ingress
curl.exe -i http://taskboard.local/api/tasks

# Test health endpoint through ingress
curl.exe -i http://taskboard.local/health
```

### 2.4 Fallback Access via Port-Forward

If the Ingress controller is not running or tunnel is unavailable:
```powershell
# Frontend access (which proxies /api to backend internally)
kubectl port-forward -n taskboard svc/frontend 3000:80

# Direct backend access
kubectl port-forward -n taskboard svc/backend 8000:8000
```

---

## 3. Horizontal Pod Autoscaler (HPA)

### 3.1 HPA Configuration

- **API Version:** `autoscaling/v2`
- **Target:** `Deployment/backend` (or `Deployment/taskboard-backend` in Helm)
- **Min Replicas:** 1
- **Max Replicas:** 5
- **Metric Target:** Average CPU Utilization: `60%`
- **Scale-Up Behavior:** Immediate (0s stabilization window, up to 100% or 2 pods every 15s)
- **Scale-Down Behavior:** Conservative (60s stabilization window to avoid flapping)

### 3.2 Metrics Server Prerequisites

HPA requires Kubernetes Metrics Server to populate the `metrics.k8s.io` API.

```powershell
# 1. Enable metrics-server addon in Minikube
minikube addons enable metrics-server

# 2. Verify metrics-server pod is running
kubectl get pods -n kube-system -l k8s-app=metrics-server

# 3. Verify node and pod metrics are reporting (may take 60s to collect first sample)
kubectl top nodes
kubectl top pods -n taskboard
```

### 3.3 Database Migration Concurrency Safeguard

**The Challenge:**
In `backend/entrypoint.sh`, the container executes `alembic upgrade head` before launching Uvicorn. When HPA scales the backend from 1 to multiple replicas, concurrent pod startup could cause race conditions or lock contention on the `alembic_version` table during schema updates.

**The Solution:**
1. **Advisory Transaction Locking:** In `backend/alembic/env.py`, an explicit PostgreSQL transactional advisory lock is acquired inside the migration transaction:
   ```python
   with context.begin_transaction():
       if connection.dialect.name == "postgresql":
           connection.execute(text("SELECT pg_advisory_xact_lock(72142718)"))
       context.run_migrations()
   ```
   - Only one pod executes migration DDL at a time.
   - Secondary pods wait on the advisory lock. Once the first pod completes and releases the transaction lock, secondary pods discover the schema is already at `head` and exit immediately without side effects.
2. **Helm Replica Decoupling:** In `helm/taskboard/templates/backend-deployment.yaml`, the hardcoded `replicas` field is conditionally omitted when `backend.autoscaling.enabled: true`. This prevents `helm upgrade` from forcibly resetting the active replica count.

### 3.4 Load Testing & HPA Verification

Run a controlled load test from PowerShell to trigger backend scaling:

```powershell
# In PowerShell Window 1: Monitor HPA status and pod counts
kubectl get hpa backend-hpa -n taskboard -w

# In PowerShell Window 2: Generate HTTP load against the backend API
$stopTime = (Get-Date).AddMinutes(3)
while ((Get-Date) -lt $stopTime) {
    1..20 | ForEach-Object -Parallel {
        try {
            Invoke-RestMethod -Uri "http://taskboard.local/api/tasks" -Method Get -TimeoutSec 2 | Out-Null
        } catch {}
    } -ThrottleLimit 20
    Start-Sleep -Milliseconds 50
}
```

**Alternative: In-Cluster Load Generator Pod:**
```powershell
kubectl run load-generator --rm -i --tty --image=busybox:latest -n taskboard -- /bin/sh -c "while true; do wget -q -O- http://backend:8000/api/tasks > /dev/null; done"
```

---

## 4. Prometheus & Grafana Monitoring

### 4.1 Deployment Strategy

To avoid the heavyweight resource footprint of the full `kube-prometheus-stack` on a local developer machine, a modular, lightweight monitoring stack is deployed in the `monitoring` namespace using native manifests in `k8s/monitoring/`:

1. `00-namespace.yaml`: Namespace `monitoring`.
2. `01-prometheus-rbac.yaml`: ServiceAccount, ClusterRole, and ClusterRoleBinding for Prometheus service discovery.
3. `02-prometheus.yaml`: Prometheus 2.54.1 ConfigMap, Deployment, and Service.
4. `03-grafana-datasource.yaml`: Pre-provisioned Prometheus DataSource (`http://prometheus.monitoring.svc.cluster.local:9090`).
5. `04-grafana-dashboard.yaml`: Pre-provisioned TaskBoard dashboard provider and dashboard JSON.
6. `05-grafana-deployment.yaml`: Grafana 11.1.0 Deployment and Service.

### 4.2 Prometheus Scrape Targets

Prometheus scrapes targets every 10–15 seconds:
- **`taskboard-backend`**: Static service DNS `backend.taskboard.svc.cluster.local:8000/metrics`.
- **`kubernetes-pods`**: Dynamically discovers any pod annotated with `prometheus.io/scrape: "true"`.

### 4.3 Grafana Dashboard Panels

The automated dashboard (`taskboard-overview`) provides 6 panels:
1. **HTTP Request Volume (Rate req/sec):** `sum(rate(http_requests_total[1m])) by (handler, status)`
2. **HTTP Request Latency (p95 & p99):** `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le, handler))`
3. **HTTP Error Rate (5xx):** `sum(rate(http_requests_total{status=~"5.."}[1m])) or vector(0)`
4. **In-Progress Requests:** `sum(taskboard_inprogress_requests) or vector(0)`
5. **Backend Process CPU (%):** `rate(process_cpu_seconds_total[1m]) * 100`
6. **Backend Process Memory (MB):** `process_resident_memory_bytes / 1048576`

---

## 5. Local Deployment & Validation Commands

### 5.1 Deploying the Full Stack via Helm & Manifests

```powershell
# 1. Create taskboard namespace and secret
kubectl create namespace taskboard
kubectl create secret generic taskboard-secrets `
  --namespace taskboard `
  --from-literal=POSTGRES_PASSWORD=taskboard_local_pass `
  --from-literal=DATABASE_URL=postgresql+psycopg://taskboard:taskboard_local_pass@postgres:5432/taskboard

# 2. Deploy TaskBoard with Ingress and HPA enabled
helm upgrade --install taskboard helm/taskboard `
  --namespace taskboard `
  --set postgresql.auth.existingSecret=taskboard-secrets `
  --set ingress.enabled=true `
  --set backend.autoscaling.enabled=true

# 3. Deploy Prometheus and Grafana
kubectl apply -f k8s/monitoring/
```

### 5.2 Accessing Monitoring Tools

```powershell
# Port-forward Prometheus UI
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open: http://localhost:9090/targets

# Port-forward Grafana UI
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Open: http://localhost:3000 (Dashboards -> TaskBoard)
```

### 5.3 Non-Destructive Cleanup (Preserving Database Data)

```powershell
# Uninstall application release (preserves PVC and PostgreSQL data)
helm uninstall taskboard -n taskboard

# Remove monitoring stack
kubectl delete -f k8s/monitoring/

# Verify PVC is preserved
kubectl get pvc -n taskboard
```

---

## 6. Environment & Validation Status Report

| Check / Test | Type | Result | Notes |
| :--- | :--- | :--- | :--- |
| `helm lint helm/taskboard` | Static | **PASS** | 0 chart(s) failed, 0 warnings. Credential enforcement intact. |
| `helm template` (Default) | Static | **PASS** | Renders cleanly with required secrets. |
| `helm template` (Day 5 Flags) | Static | **PASS** | Ingress and HPA v2 render accurately; replicas decoupled. |
| YAML Structural Validation | Static | **PASS** | 18 manifest files (23 documents) validated via Python PyYAML parser. |
| Code Formatting (`git diff --check`) | Static | **PASS** | Zero whitespace or EOF formatting issues across all files. |
| Migration Concurrency Safeguard | Code | **PASS** | PostgreSQL `pg_advisory_xact_lock` implemented in `backend/alembic/env.py`. |
| Minikube Pod Scheduling & Live Ingress | Runtime | **BLOCKED** | Docker Desktop engine is offline on the host machine. Minikube daemon cannot be reached until Docker Desktop is started. |
| Metrics Server & Live HPA Scaling | Runtime | **BLOCKED** | Blocked by offline Docker daemon. Validation commands provided above. |
| Live Prometheus Scrape & Grafana UI | Runtime | **BLOCKED** | Blocked by offline Docker daemon. Validation commands provided above. |
