# TaskBoard DevOps Capstone — Video Walkthrough & Demonstration Script

**Estimated Duration:** 10 – 12 minutes  
**Target Audience:** Capstone Evaluators, Senior Engineering Leaders, DevOps Recruiters  
**Demonstration Mode:** Live Local Minikube Cluster & Statically Validated Terraform Infrastructure  

---

## 1. Overview & Demonstration Timeline

| Segment | Topic | Target Time | Key Screens / Artifacts |
| :---: | :--- | :---: | :--- |
| **1** | Introduction & Problem Statement | 0:00 – 1:00 | Project Overview, Architecture Diagram (`docs/ARCHITECTURE.md`) |
| **2** | Local Application & Automated Testing | 1:00 – 2:30 | Terminal: Pytest (16 tests passed), Frontend build (Vite) |
| **3** | Docker & Non-Root Container Security | 2:30 – 4:00 | Terminal: `docker ps`, `id` check (`uid=1000`, `uid=101`), Trivy scan |
| **4** | CI/CD Pipeline & GHCR Publishing | 4:00 – 5:30 | GitHub Actions workflow (`ci-cd.yml`), GHCR packages, SHA tags |
| **5** | Kubernetes Cluster & Helm Deployment | 5:30 – 7:30 | Terminal: `kubectl get pods,svc,ingress,hpa,pvc -n taskboard`, Browser: `http://taskboard.local` |
| **6** | Observability: Prometheus & Grafana | 7:30 – 9:00 | Browser: Prometheus Targets (All UP), Grafana 6-Panel Dashboard with live data |
| **7** | Infrastructure as Code (Terraform AWS) | 9:00 – 10:30 | VS Code: `terraform/`, `terraform validate`, architecture diagram, cost disclaimer |
| **8** | GitOps (ArgoCD) & Conclusion | 10:30 – 11:30 | `k8s/argocd/application.yaml`, final audit rubric table |

---

## 2. Step-by-Step Script and Narration

### Segment 1: Introduction & Architecture (0:00 – 1:00)
- **Screen:** Show [`docs/ARCHITECTURE.md`](file:///c:/Users/Shivansh/Desktop/devops_project/docs/ARCHITECTURE.md) in the editor or browser.
- **Spoken Narration:**
  > "Hello, my name is Shivansh Sharma, and this is the final walkthrough of the TaskBoard DevOps Capstone project. TaskBoard is a multi-tier SaaS task management platform designed for cloud engineering teams. The stack consists of a React Vite single-page application, a high-performance FastAPI asynchronous backend, and a persistent PostgreSQL relational database. Over the course of this project, I engineered a complete production-grade DevOps lifecycle spanning automated testing, non-root multi-stage containerization, DevSecOps vulnerability scanning, automated CI/CD with GHCR, zero-downtime Kubernetes deployments using Helm and NGINX Ingress, full-stack observability with Prometheus and Grafana, and cost-aware Infrastructure as Code using Terraform for AWS."

---

### Segment 2: Application & Automated Testing (1:00 – 2:30)
- **Screen:** PowerShell terminal.
- **Commands to Run:**
  ```powershell
  # 1. Run the backend Pytest suite
  & "backend\.venv\Scripts\python.exe" -m pytest backend/tests -v

  # 2. Run the frontend Vite production build
  cd frontend
  npm run build
  cd ..
  ```
- **Spoken Narration:**
  > "Let's begin with our automated quality gates. Here, I am running our Pytest backend test suite. As you can see, all 16 tests pass in less than one second. The test suite thoroughly validates root metadata, liveness probes, readiness checks against database failure, Prometheus metrics emission, and comprehensive CRUD lifecycle workflows. Notice that our test fixtures use an in-memory SQLite database with transactional isolation, ensuring our active PostgreSQL development records are never mutated or wiped. Next, I execute the production build of our frontend using Vite, compiling all React modules and TypeScript assets in 1.36 seconds with zero errors."

---

### Segment 3: Docker & Non-Root Container Security (2:30 – 4:00)
- **Screen:** PowerShell terminal.
- **Commands to Run:**
  ```powershell
  # 1. Verify container runtime identity for both images
  docker run --rm --entrypoint id taskboard-backend:non-root
  docker run --rm taskboard-frontend:non-root id

  # 2. Check running Docker Compose stack
  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

  # 3. Demonstrate Trivy vulnerability scanning
  docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --severity HIGH,CRITICAL taskboard-frontend:non-root
  ```
- **Spoken Narration:**
  > "Security is embedded directly into our container runtime architecture. In accordance with DevSecOps best practices and principle of least privilege, neither of our production containers runs as root. When executing the `id` command on our backend image, we observe `uid=1000(appuser)`. Similarly, our frontend image runs under `uid=101(nginx)`. For the frontend, Nginx was reconfigured to listen on unprivileged port 8080, with its PID file relocated to `/tmp/nginx.pid` and directory permissions granted on all cache and log paths. Furthermore, our Trivy container vulnerability scan verifies that zero fixable High or Critical vulnerabilities exist in our images."

---

### Segment 4: CI/CD Pipeline & GHCR (4:00 – 5:30)
- **Screen:** VS Code displaying [`.github/workflows/ci-cd.yml`](file:///c:/Users/Shivansh/Desktop/devops_project/.github/workflows/ci-cd.yml).
- **Spoken Narration:**
  > "Moving to continuous integration and continuous deployment, our GitHub Actions workflow orchestrates five distinct jobs: backend tests against a live PostgreSQL service container, automated Alembic migrations, frontend production build, multi-stage Docker buildx with local Trivy scanning enforcing an exit code of 1 on High/Critical vulnerabilities, and automated publication to the GitHub Container Registry. Security best practices include pinned commit SHAs on all third-party GitHub Actions, minimal top-level permissions, and immutable tagging where each image is tagged with the exact Git commit SHA alongside `main`."

---

### Segment 5: Kubernetes & Helm Deployment (5:30 – 7:30)
- **Screen:** PowerShell terminal, then Browser navigated to `http://taskboard.local`.
- **Commands to Run:**
  ```powershell
  # 1. Check pods, deployments, services, ingress, and HPA
  kubectl get pods,deployments,svc,ingress,hpa,pvc -n taskboard

  # 2. Demonstrate live HTTP response through Ingress
  curl.exe -i -H "Host: taskboard.local" http://127.0.0.1:8085/api/tasks
  ```
- **Spoken Narration:**
  > "Here in our local Kubernetes environment on Minikube, our application is deployed using our custom Helm chart. Notice that both the frontend and backend deployments are actively running with two healthy replicas each, satisfying our rubric requirements. Our PostgreSQL database is deployed as a StatefulSet backed by a persistent 1Gi PVC that preserves our task records across pod rollouts. Our Horizontal Pod Autoscaler is configured with CPU utilization targets, ready to scale from 2 up to 5 replicas under load. When querying our NGINX Ingress controller at `taskboard.local`, we receive HTTP 200 responses containing our persistent tasks."

---

### Segment 6: Observability (Prometheus & Grafana) (7:30 – 9:00)
- **Screen:** Browser tabs showing Prometheus (`http://localhost:9090/targets`) and Grafana (`http://localhost:3001`).
- **Spoken Narration:**
  > "Observability is a core pillar of the TaskBoard architecture. Here in Prometheus, we can verify that our scrape targets—including `taskboard-backend` at port 8000, `kubernetes-pods`, and `prometheus` itself—are all in the UP state, continuously harvesting metrics every 15 seconds. In Grafana, our auto-provisioned overview dashboard renders real-time data across six essential panels: HTTP Request Volume rate, 95th and 99th percentile latency histograms, 5xx error rates, in-progress HTTP requests, backend process CPU usage, and resident memory consumption in megabytes. Every panel is backed by live PromQL queries."

---

### Segment 7: Terraform & AWS Readiness (9:00 – 10:30)
- **Screen:** VS Code displaying [`terraform/`](file:///c:/Users/Shivansh/Desktop/devops_project/terraform) directory.
- **Commands to Run:**
  ```powershell
  terraform fmt -check -recursive terraform
  terraform -chdir=terraform validate
  ```
- **Spoken Narration:**
  > "For cloud infrastructure, we have authored a modular Infrastructure as Code solution in Terraform targeting Amazon Web Services. The configuration defines a high-availability VPC across two availability zones, public and private subnet tiers, NAT routing, strict least-privilege security groups, an EKS control plane running Kubernetes 1.35, managed worker node groups in private subnets with IMDSv2 enforced, and an IAM OIDC role for the AWS EBS CSI driver using IRSA. In accordance with project instructions and my ₹0 budget constraint, AWS resources were configured and statically validated—exiting with 'Success! The configuration is valid'—without incurring cloud costs through real provisioning."

---

### Segment 8: GitOps & Conclusion (10:30 – 11:30)
- **Screen:** VS Code showing [`k8s/argocd/application.yaml`](file:///c:/Users/Shivansh/Desktop/devops_project/k8s/argocd/application.yaml) and [`docs/FINAL_AUDIT.md`](file:///c:/Users/Shivansh/Desktop/devops_project/docs/FINAL_AUDIT.md).
- **Spoken Narration:**
  > "Finally, for continuous reconciliation, we have architected a complete GitOps workflow with ArgoCD. Our `Application` manifest enforces automated self-healing while explicitly setting `prune: false` to ensure persistent storage is never deleted during Git synchronizations. In summary, every requirement in the capstone rubric—from application development to DevSecOps, Kubernetes, and monitoring—has been implemented and verified. Thank you for evaluating the TaskBoard DevOps Capstone."
