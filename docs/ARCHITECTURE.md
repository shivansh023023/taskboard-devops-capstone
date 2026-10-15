# TaskBoard DevOps Capstone — System Architecture

This document details the architectural design, network topology, container specifications, Kubernetes deployment model, CI/CD pipeline, and observability infrastructure of the TaskBoard platform.

---

## 1. High-Level Application Architecture

```mermaid
flowchart TD
    Client(["User Browser / Client"])

    subgraph EdgeLayer["Edge / Routing Layer"]
        IngressController["NGINX Ingress Controller\n(Host: taskboard.local)"]
    end

    subgraph WebTier["Frontend Tier (Web)"]
        FrontendService["Service: frontend:80"]
        FrontendPod1["Frontend Pod 1\n(Nginx Alpine :8080\nUID 101 non-root)"]
        FrontendPod2["Frontend Pod 2\n(Nginx Alpine :8080\nUID 101 non-root)"]
    end

    subgraph APITier["Application API Tier"]
        BackendService["Service: backend:8000"]
        BackendPod1["Backend Pod 1\n(FastAPI / Uvicorn :8000\nUID 1000 non-root)"]
        BackendPod2["Backend Pod 2\n(FastAPI / Uvicorn :8000\nUID 1000 non-root)"]
        HPA["Horizontal Pod Autoscaler\n(HPA v2: 2-5 Replicas\nTarget: 60% CPU)"]
    end

    subgraph DataTier["Persistence Tier"]
        PostgresService["Service: postgres:5432"]
        PostgresPod["PostgreSQL StatefulSet\n(PostgreSQL 16 Alpine\nUID 70)"]
        PVC[("PersistentVolumeClaim\n1Gi standard RWO\n(Preserved)")]
    end

    Client -->|HTTP 80/443| IngressController
    IngressController -->|/ or /assets| FrontendService
    IngressController -->|/api or /health| BackendService

    FrontendService --> FrontendPod1
    FrontendService --> FrontendPod2

    FrontendPod1 -.->|Reverse Proxy /api| BackendService
    FrontendPod2 -.->|Reverse Proxy /api| BackendService

    BackendService --> BackendPod1
    BackendService --> BackendPod2

    BackendPod1 --> PostgresService
    BackendPod2 --> PostgresService

    PostgresService --> PostgresPod
    PostgresPod --> PVC

    HPA -.->|Scales Deployment| BackendPod1
    HPA -.->|Scales Deployment| BackendPod2
```

---

## 2. DevSecOps CI/CD Pipeline Architecture

```mermaid
flowchart LR
    subgraph Trigger["Git Event"]
        Push["Push to main"]
        PR["Pull Request to main"]
    end

    subgraph CI["GitHub Actions Workflow (.github/workflows/ci-cd.yml)"]
        direction TB
        subgraph Stage1["Quality Gate"]
            BackendTests["Job: backend-tests\n(PostgreSQL service,\nAlembic migrations, Pytest)"]
            FrontendBuild["Job: frontend-build\n(Node.js 22, npm ci,\nVite production build)"]
        end

        subgraph Stage2["Container & Security Gate"]
            DockerBuild["Job: docker-build-and-scan\n(Buildx multi-stage,\nSHA-pinned actions)"]
            TrivyScan["Trivy Vulnerability Scan\n(Enforce HIGH/CRITICAL = 0,\nignore-unfixed: true)"]
        end

        subgraph Stage3["Publish Gate (main push only)"]
            GHCRPublish["Job: publish-ghcr\n(Tag with ${{ github.sha }},\n'main', and 'latest')"]
        end

        subgraph Stage4["Reporting"]
            Summary["Job: pipeline-summary\n(Markdown Step Summary)"]
        end
    end

    subgraph Registry["GitHub Container Registry (GHCR)"]
        GHCRBackend["ghcr.io/...-backend:sha"]
        GHCRFrontend["ghcr.io/...-frontend:sha"]
    end

    Push --> BackendTests
    Push --> FrontendBuild
    PR --> BackendTests
    PR --> FrontendBuild

    BackendTests --> DockerBuild
    FrontendBuild --> DockerBuild
    DockerBuild --> TrivyScan
    TrivyScan -->|Passed & Event == push| GHCRPublish
    TrivyScan --> Summary
    GHCRPublish --> GHCRBackend
    GHCRPublish --> GHCRFrontend
    GHCRPublish --> Summary
```

---

## 3. Observability Architecture (Prometheus & Grafana)

```mermaid
flowchart TD
    subgraph ClusterWorkloads["Namespace: taskboard"]
        BackendPod1["Backend Pod 1\n(:8000/metrics)"]
        BackendPod2["Backend Pod 2\n(:8000/metrics)"]
    end

    subgraph MonitoringNamespace["Namespace: monitoring"]
        Prometheus["Prometheus Server\n(Prometheus v2.54.1\nScrape interval: 15s)"]
        Grafana["Grafana Server\n(Grafana v11.1.0\nPort: 3000)"]
        Datasource["Auto-Provisioned Datasource\n(http://prometheus:9090)"]
        Dashboard["TaskBoard Overview Dashboard\n(6 Real-time PromQL Panels)"]
    end

    subgraph MetricsDashboard["Dashboard Panels"]
        Panel1["HTTP Request Volume (Rate req/s)"]
        Panel2["Request Latency (p95 & p99 ms)"]
        Panel3["HTTP Error Rate (5xx Stat)"]
        Panel4["In-Progress Requests (Stat)"]
        Panel5["Process CPU Usage (%)"]
        Panel6["Resident Memory (MB)"]
    end

    Prometheus -->|Scrapes /metrics| BackendPod1
    Prometheus -->|Scrapes /metrics| BackendPod2
    Grafana --> Datasource
    Datasource --> Prometheus
    Dashboard --> Grafana
    Grafana --> Panel1
    Grafana --> Panel2
    Grafana --> Panel3
    Grafana --> Panel4
    Grafana --> Panel5
    Grafana --> Panel6
```

---

## 4. Terraform AWS EKS Target Architecture (Configured & Statically Validated)

> [!NOTE]
> This architecture is fully defined in [`terraform/`](file:///c:/Users/Shivansh/Desktop/devops_project/terraform) and validated via `terraform validate`, but **intentionally not deployed** due to user budget constraints.

```mermaid
flowchart TD
    subgraph AWSCloud["AWS Cloud (Region: us-east-1)"]
        subgraph VPC["TaskBoard VPC (10.0.0.0/16)"]
            subgraph PublicSubnets["Public Subnets (us-east-1a, us-east-1b)"]
                IGW["Internet Gateway"]
                NATGateway["NAT Gateway"]
                ALB["AWS Application Load Balancer\n(AWS Load Balancer Controller)"]
            end

            subgraph PrivateSubnets["Private Subnets (us-east-1a, us-east-1b)"]
                subgraph EKSCluster["Amazon EKS Cluster (Kubernetes v1.35)"]
                    ControlPlane["EKS Control Plane\n(Private endpoint enabled,\nPublic CIDR allowlisted)"]
                    NodeGroup["Managed Node Group\n(2x t3.medium EC2, IMDSv2 required,\nEncrypted 30GB EBS)"]
                end

                subgraph Storage["Persistent Storage"]
                    EBSVolume["Amazon EBS (gp3)\n(CSI Driver with dedicated IRSA role)"]
                end
            end
        end

        subgraph IAM["AWS IAM & Security"]
            NodeRole["Node IAM Role\n(Least privilege, NO EBS CSI policy)"]
            IRSARole["EBS CSI IRSA Role\n(Trusts OIDC Issuer with sts:AssumeRoleWithWebIdentity)"]
            KMSKey["AWS KMS\n(Envelope encryption for Secrets & EBS)"]
        end
    end

    ALB --> NodeGroup
    NodeGroup --> ControlPlane
    IRSARole --> EBSVolume
    ControlPlane --> KMSKey
    PublicSubnets --> IGW
    PrivateSubnets --> NATGateway
```
