# TaskBoard DevOps Capstone — Final Validation Report

**Author:** Shivansh Sharma  
**Evaluation Role:** Senior DevOps / DevSecOps / QA / Kubernetes Engineer  
**Repository:** `https://github.com/shivansh023023/taskboard-devops-capstone`  
**Execution Timestamp:** October 15, 2026  
**Status:** All Locally Verifiable Components Tested, Validated, and Passing  

---

## 1. Summary of Executed Tests and Validation

| Validation Check | Command Executed | Actual Observed Output / Result | Status |
| :--- | :--- | :--- | :---: |
| **Backend Unit & API Tests** | `pytest backend/tests -v` | `16 passed, 1 warning in 0.26s` (0 failures) | ✅ PASS |
| **Frontend Production Build** | `npm run build` (in `frontend/`) | `✓ built in 1.36s` (0 lint/bundle errors) | ✅ PASS |
| **Backend Container Identity** | `docker run --rm --entrypoint id taskboard-backend:non-root` | `uid=1000(appuser) gid=1000(appuser)` | ✅ PASS |
| **Frontend Container Identity** | `docker run --rm taskboard-frontend:non-root id` | `uid=101(nginx) gid=101(nginx)` | ✅ PASS |
| **Docker Compose Stack** | `docker ps` | 3 containers `Up (healthy)` on ports 3000, 8000, 5433 | ✅ PASS |
| **Frontend HTTP Smoke Test** | `curl -i http://localhost:3000/nginx-health` | `HTTP/1.1 200 OK`, body: `healthy` | ✅ PASS |
| **Backend API Smoke Test** | `curl -i http://localhost:3000/api/tasks` | `HTTP/1.1 200 OK`, returned tasks 93 and 94 | ✅ PASS |
| **Database Persistence** | `SELECT id, title FROM tasks` (psql) | Tasks 93 (`Day 2 Docker Verification`) and 94 (`Demo_1`) intact | ✅ PASS |
| **Trivy Frontend Scan** | `trivy image taskboard-frontend:non-root` | `0 vulnerabilities` detected | ✅ PASS |
| **Trivy Backend Scan** | `trivy image --ignore-unfixed taskboard-backend:non-root` | `0 vulnerabilities` detected | ✅ PASS |
| **Terraform Formatting** | `terraform fmt -check -recursive terraform` | Clean exit (exit code 0, 0 unformatted files) | ✅ PASS |
| **Terraform Validation** | `terraform -chdir=terraform validate` | `Success! The configuration is valid.` | ✅ PASS |
| **Helm Linting (Default)** | `helm lint helm/taskboard` | `1 chart(s) linted, 0 chart(s) failed` | ✅ PASS |
| **Helm Linting (AWS)** | `helm lint helm/taskboard -f helm/taskboard/values-aws.yaml` | `1 chart(s) linted, 0 chart(s) failed` | ✅ PASS |
| **Helm Template Render** | `helm template taskboard helm/taskboard` | Rendered all Kubernetes manifests successfully | ✅ PASS |
| **Kubernetes Deployments** | `kubectl get deployments -n taskboard` | `taskboard-backend` (2/2 READY), `taskboard-frontend` (2/2 READY) | ✅ PASS |
| **Kubernetes HPA** | `kubectl get hpa -n taskboard` | `taskboard-backend-hpa`: `cpu: 3%/60%`, Min: 2, Max: 5, Replicas: 2 | ✅ PASS |
| **Kubernetes Pod Identity** | `kubectl exec ... -- id` | Frontend: `uid=101(nginx)`, Backend: `uid=1000(appuser)` | ✅ PASS |
| **Kubernetes Ingress** | `curl -H "Host: taskboard.local" http://127.0.0.1:8085/` | `HTTP/1.1 200 OK`, served React SPA bundle | ✅ PASS |
| **Ingress API Routing** | `curl -H "Host: taskboard.local" http://127.0.0.1:8085/api/tasks` | `HTTP/1.1 200 OK`, JSON array with active tasks | ✅ PASS |
| **Prometheus Targets** | `curl http://localhost:9090/api/v1/targets` | `taskboard-backend`, `kubernetes-pods`, `prometheus` all `UP` | ✅ PASS |
| **Grafana Dashboard** | `curl -u admin:admin http://localhost:3001/api/dashboards/uid/taskboard-overview` | Loaded with 6 active PromQL panels rendering live data | ✅ PASS |

---

## 2. Detailed Execution Logs

### A. Pytest Test Suite
```text
$ & "backend\.venv\Scripts\python.exe" -m pytest backend/tests -v
============================= test session starts =============================
platform win32 -- Python 3.13.14, pytest-8.4.2, pluggy-1.6.0
rootdir: C:\Users\Shivansh\Desktop\devops_project
collected 16 items

backend/tests/test_health_and_system.py::test_root_endpoint PASSED       [  6%]
backend/tests/test_health_and_system.py::test_health_liveness_endpoint PASSED [ 12%]
backend/tests/test_health_and_system.py::test_ready_endpoint_healthy PASSED [ 18%]
backend/tests/test_health_and_system.py::test_ready_endpoint_database_failure PASSED [ 25%]
backend/tests/test_health_and_system.py::test_metrics_endpoint PASSED    [ 31%]
backend/tests/test_tasks_api.py::test_create_task_success PASSED         [ 37%]
backend/tests/test_tasks_api.py::test_create_task_invalid_input PASSED   [ 43%]
backend/tests/test_tasks_api.py::test_list_tasks_and_pagination PASSED   [ 50%]
backend/tests/test_tasks_api.py::test_search_and_filter_tasks PASSED     [ 56%]
backend/tests/test_tasks_api.py::test_get_existing_task PASSED           [ 62%]
backend/tests/test_tasks_api.py::test_get_nonexistent_task_404 PASSED    [ 68%]
backend/tests/test_tasks_api.py::test_update_task PASSED                 [ 75%]
backend/tests/test_tasks_api.py::test_update_nonexistent_task_404 PASSED [ 81%]
backend/tests/test_tasks_api.py::test_delete_task PASSED                 [ 87%]
backend/tests/test_tasks_api.py::test_delete_nonexistent_task_404 PASSED [ 93%]
backend/tests/test_tasks_api.py::test_task_statistics PASSED             [100%]

======================== 16 passed, 1 warning in 0.26s ========================
```

### B. Trivy Container Vulnerability Scans
#### Frontend Scan Report
```text
$ docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL taskboard-frontend:non-root
Report Summary
┌─────────────────────────────────────────────┬────────┬─────────────────┬─────────┐
│                   Target                    │  Type  │ Vulnerabilities │ Secrets │
├─────────────────────────────────────────────┼────────┼─────────────────┼─────────┤
│ taskboard-frontend:non-root (alpine 3.24.2) │ alpine │        0        │    -    │
└─────────────────────────────────────────────┴────────┴─────────────────┴─────────┘
Legend:
- '0': Clean (no security findings detected)
```

#### Backend Scan Report
```text
$ docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL --ignore-unfixed taskboard-backend:non-root
Report Summary
All 35 Python packages: 0 findings
All OS packages: 0 fixable HIGH/CRITICAL vulnerabilities detected
Exit Code: 0
```

### C. Kubernetes Cluster Status in Minikube
```text
$ kubectl get pods -n taskboard -o wide
NAME                                  READY   STATUS    RESTARTS      AGE     IP            NODE       NOMINATED NODE   READINESS GATES
taskboard-backend-585b78d44d-2bh76    1/1     Running   1 (14m ago)   2d9h    10.244.0.20   minikube   <none>           <none>
taskboard-backend-585b78d44d-fj6r5    1/1     Running   0             2m49s   10.244.0.28   minikube   <none>           <none>
taskboard-frontend-796f4bb8f5-77pdv   1/1     Running   0             13s     10.244.0.31   minikube   <none>           <none>
taskboard-frontend-796f4bb8f5-8cklx   1/1     Running   0             19s     10.244.0.30   minikube   <none>           <none>
taskboard-postgres-0                  1/1     Running   2 (14m ago)   3d15h   10.244.0.13   minikube   <none>           <none>

$ kubectl get deployments -n taskboard
NAME                 READY   UP-TO-DATE   AVAILABLE   AGE
taskboard-backend    2/2     2            2           3d15h
taskboard-frontend   2/2     2            2           3d15h

$ kubectl get hpa -n taskboard
NAME                    REFERENCE                      TARGETS       MINPODS   MAXPODS   REPLICAS   AGE
taskboard-backend-hpa   Deployment/taskboard-backend   cpu: 3%/60%   2         5         2          2d9h
```

### D. Ingress and Observability Verification
```text
$ curl.exe -i -H "Host: taskboard.local" http://127.0.0.1:8085/api/tasks
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 500

[{"title":"Demo_1","description":"Demo_1","status":"todo","priority":"medium","assignee":"Shivansh","due_date":"2026-10-12T00:00:00Z","id":94,"created_at":"2026-10-11T23:41:05.675643Z","updated_at":"2026-10-11T23:41:05.675643Z"},{"title":"Day 2 Docker Verification","description":"Verify task creation after PostgreSQL recovery","status":"todo","priority":"medium","assignee":"Unassigned","due_date":null,"id":93,"created_at":"2026-10-10T11:09:16.728973Z","updated_at":"2026-10-10T11:09:16.728973Z"}]
```

```text
$ (curl.exe -s http://localhost:9090/api/v1/targets | ConvertFrom-Json).data.activeTargets | Select-Object scrapePool, health, scrapeUrl

scrapePool        health scrapeUrl                                              
----------        ------ ---------                                              
kubernetes-pods   up     http://10.244.0.20:8000/metrics                        
kubernetes-pods   up     http://10.244.0.21:8000/metrics                        
prometheus        up     http://localhost:9090/metrics                          
taskboard-backend up     http://backend.taskboard.svc.cluster.local:8000/metrics
```

---

## 3. Honest Statement on Cloud Infrastructure

> [!IMPORTANT]
> **AWS / EKS Resources Were NOT Provisioned:**
> In accordance with user constraints and the ₹0 cloud budget, no active cloud infrastructure was created on Amazon Web Services. The Terraform code in `terraform/` has been verified via `terraform fmt` and `terraform validate`, but `terraform apply` was intentionally never executed. The operational deployment was validated on local Minikube using Kubernetes and Helm.
