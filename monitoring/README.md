# TaskBoard Observability & Monitoring Stack

This directory contains the Prometheus and Grafana monitoring configurations for the TaskBoard DevOps Capstone.

---

## 1. Architecture Overview

```
                      +-----------------------------+
                      |   TaskBoard Backend Pod     |
                      |   (FastAPI on Port 8000)    |
                      |   Path: /metrics            |
                      +--------------+--------------+
                                     ^
                                     | Scrapes every 10s
                                     |
                      +--------------+--------------+
                      |     Prometheus Server       |
                      |  Namespace: monitoring      |
                      |  Port: 9090                 |
                      +--------------+--------------+
                                     ^
                                     | Queries via PromQL
                                     |
                      +--------------+--------------+
                      |       Grafana UI            |
                      |  Namespace: monitoring      |
                      |  Port: 3000                 |
                      +-----------------------------+
```

1. **Instrumentation**: FastAPI automatically exposes Prometheus metrics via `prometheus-fastapi-instrumentator` at `/metrics`.
2. **Prometheus Scraper**: Prometheus is deployed in the `monitoring` namespace and configured with:
   - A static scrape job targeting `backend.taskboard.svc.cluster.local:8000/metrics`.
   - Kubernetes Pod discovery discovering pods with annotation `prometheus.io/scrape: "true"`.
3. **Grafana Dashboards**: Grafana is pre-provisioned with the Prometheus DataSource and an automated TaskBoard dashboard (`taskboard-overview`).

---

## 2. Fast Deployment via Kubernetes Manifests

Apply the monitoring stack to Minikube:

```powershell
kubectl apply -f k8s/monitoring/
```

Verify deployment status:

```powershell
kubectl get pods -n monitoring
```

---

## 3. Accessing Prometheus & Grafana

### Option A: Prometheus Dashboard
Port-forward Prometheus to `http://localhost:9090`:
```powershell
kubectl port-forward -n monitoring svc/prometheus 9090:9090
```

Verify target status: Navigate to **Status** -> **Targets** and confirm `taskboard-backend` is in state `UP`.

### Option B: Grafana Dashboard
Port-forward Grafana to `http://localhost:3000`:
```powershell
kubectl port-forward -n monitoring svc/grafana 3000:3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
Anonymous admin access is enabled by default for local development. Navigate to **Dashboards** -> **TaskBoard — Application & Resource Observability**.

---

## 4. Documented PromQL Queries

| Metric / Goal | PromQL Query | Description |
| :--- | :--- | :--- |
| **HTTP Request Volume** | `sum(rate(http_requests_total[1m])) by (handler, status)` | Throughput in requests/sec broken down by endpoint and status code |
| **HTTP Request Latency (p95)** | `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[1m])) by (le, handler))` | 95th percentile request latency in seconds |
| **HTTP Request Latency (p99)** | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[1m])) by (le, handler))` | 99th percentile request latency in seconds |
| **HTTP 5xx Error Rate** | `sum(rate(http_requests_total{status=~"5.."}[1m])) or vector(0)` | Server-side error rate per second |
| **In-Flight Requests** | `sum(taskboard_inprogress_requests) or vector(0)` | Current active concurrent HTTP connections |
| **Backend CPU Usage** | `rate(process_cpu_seconds_total[1m]) * 100` | Process CPU utilization percentage |
| **Backend Memory (MB)** | `process_resident_memory_bytes / 1048576` | Resident set size (RSS) memory in megabytes |
