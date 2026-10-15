# Day 6, Stage 1: Terraform Infrastructure & AWS EKS Architecture

This document details the design, configuration, cost analysis, and Kubernetes integration plan for migrating TaskBoard from local Minikube to an enterprise Amazon Elastic Kubernetes Service (EKS) cluster on AWS.

---

## 1. Cloud Architecture Overview

The TaskBoard AWS architecture implements defense-in-depth across networking, compute, identity, and application delivery:

```
                            [ Internet Users & Clients ]
                                         |
                                         | HTTPS (Port 443) / HTTP (Port 80)
                                         v
                      +-------------------------------------+
                      |   AWS Application Load Balancer     |
                      |   (Managed by AWS LB Controller)    |
                      +------------------+------------------+
                                         |
                       Public Subnets    | Route to Target Groups (IP mode)
                 - - - - - - - - - - - - | - - - - - - - - - - - - - - -
                       Private Subnets   v
                      +-------------------------------------+
                      |         Amazon EKS Cluster          |
                      |      Kubernetes Version 1.35        |
                      |                                     |
                      |  +-------------------------------+  |
                      |  |     Frontend Deployment       |  |
                      |  |     (React SPA + Nginx)       |  |
                      |  +---------------+---------------+  |
                      |                  | Internal Service |
                      |                  v Route (/api)     |
                      |  +-------------------------------+  |
                      |  |     Backend Deployment        |  |
                      |  |     (FastAPI Replicas)        |  |
                      |  |     Auto-scaled by HPA        |  |
                      |  +---------------+---------------+  |
                      |                  |                  |
                      +------------------|------------------+
                                         |
                                         v
                      +-------------------------------------+
                      |       Durable Data Storage          |
                      |                                     |
                      |  Option A: EBS CSI gp3 Volume       |
                      |  (StatefulSet in Private Subnet)    |
                      |                  OR                 |
                      |  Option B: Amazon RDS PostgreSQL    |
                      |  (Multi-AZ Managed Database)        |
                      +-------------------------------------+
```

---

## 2. Infrastructure as Code Structure

The Terraform codebase in `terraform/` is modular and validated:

| File | Purpose | Key Resources |
| :--- | :--- | :--- |
| [versions.tf](file:///c:/Users/Shivansh/Desktop/devops_project/terraform/versions.tf) | Terraform & Provider constraints | Terraform `>= 1.5.0`, AWS provider `~> 5.0`, TLS `~> 4.0`, default tags |
| [variables.tf](file:///c:/Users/Shivansh/Desktop/devops_project/terraform/variables.tf) | Parameter definitions & validations | Region, CIDR blocks, AZs, instance types, node scaling limits, cost controls |
| [vpc.tf](file:///c:/Users/Shivansh/Desktop/devops_project/terraform/vpc.tf) | Network isolation & routing | `aws_vpc`, `aws_subnet` (public/private), `aws_nat_gateway`, `aws_route_table` |
| [security_groups.tf](file:///c:/Users/Shivansh/Desktop/devops_project/terraform/security_groups.tf) | Network firewall boundaries | Separate control plane & worker node security groups with least-privilege rules |
| [iam.tf](file:///c:/Users/Shivansh/Desktop/devops_project/terraform/iam.tf) | IAM roles & OIDC provider | `AmazonEKSClusterPolicy`, `AmazonEKSWorkerNodePolicy`, IRSA OIDC provider |
| [eks.tf](file:///c:/Users/Shivansh/Desktop/devops_project/terraform/eks.tf) | Compute orchestration | `aws_eks_cluster`, `aws_eks_node_group` in private subnets with logging |
| [outputs.tf](file:///c:/Users/Shivansh/Desktop/devops_project/terraform/outputs.tf) | Execution outputs & helpers | Cluster endpoint, ARNs, VPC IDs, copy-paste `aws eks update-kubeconfig` command |
| [terraform.tfvars.example](file:///c:/Users/Shivansh/Desktop/devops_project/terraform/terraform.tfvars.example) | Safe parameter template | Reusable default values with zero hardcoded credentials |

---

## 3. Subnet Tagging for Kubernetes Ingress & Load Balancing

AWS Load Balancer Controller and Kubernetes cloud-provider require specific subnet tags for automated discovery:

- **Public Subnets:**
  - `kubernetes.io/role/elb = "1"`: Instructs the controller to provision internet-facing Application and Network Load Balancers in these subnets.
  - `kubernetes.io/cluster/<cluster_name> = "shared"`: Associates subnets with the TaskBoard EKS cluster.
- **Private Subnets:**
  - `kubernetes.io/role/internal-elb = "1"`: Instructs Kubernetes to deploy internal load balancers exclusively into private subnets.
  - `kubernetes.io/cluster/<cluster_name> = "shared"`: Cluster membership tag.

---

## 4. TaskBoard Deployment Integration Plan for AWS EKS

### 4.1 Configuring kubectl Access
Once the EKS cluster is created, configure local `kubectl` using AWS CLI v2:
```powershell
aws eks update-kubeconfig --region us-east-1 --name taskboard-eks
kubectl get nodes -o wide
```

### 4.2 Pulling Existing Images from GitHub Container Registry (GHCR)
The application images are published to GHCR:
- `ghcr.io/shivansh023023/taskboard-devops-capstone-backend:main`
- `ghcr.io/shivansh023023/taskboard-devops-capstone-frontend:main`

Because GHCR packages may be private by default, create a Kubernetes `docker-registry` secret in the `taskboard` namespace:
```powershell
kubectl create namespace taskboard

kubectl create secret docker-registry ghcr-auth \
  --namespace taskboard \
  --docker-server=ghcr.io \
  --docker-username=shivansh023023 \
  --docker-password=<GITHUB_PERSONAL_ACCESS_TOKEN_WITH_READ_PACKAGES>
```

### 4.3 Secure Provisioning of Application Secrets
Never commit production passwords to Git. Pass credentials dynamically using `kubectl create secret`:
```powershell
kubectl create secret generic taskboard-secrets \
  --namespace taskboard \
  --from-literal=POSTGRES_PASSWORD=<STRONG_RANDOM_PASSWORD> \
  --from-literal=DATABASE_URL="postgresql+psycopg://taskboard:<STRONG_RANDOM_PASSWORD>@postgres:5432/taskboard"
```

### 4.4 Deploying TaskBoard via Helm with AWS Values
Use the new [helm/taskboard/values-aws.yaml](file:///c:/Users/Shivansh/Desktop/devops_project/helm/taskboard/values-aws.yaml) values file:
```powershell
helm upgrade --install taskboard ./helm/taskboard \
  --namespace taskboard \
  -f ./helm/taskboard/values-aws.yaml \
  --set postgresql.auth.existingSecret=taskboard-secrets \
  --set backend.image.tag=<IMMUTABLE_GIT_SHA> \
  --set frontend.image.tag=<IMMUTABLE_GIT_SHA>
```

### 4.5 Ingress & Ingress Controller Setup on AWS
On AWS EKS, two production Ingress options are supported:
1. **AWS Load Balancer Controller (Recommended for AWS native integration):**
   - Provisions an AWS Application Load Balancer (ALB).
   - Ingress class: `alb`.
   - Requires installing the `aws-load-balancer-controller` Helm chart using IRSA.
   - Annotations in `values-aws.yaml`: `alb.ingress.kubernetes.io/scheme: internet-facing`.
2. **NGINX Ingress Controller behind AWS Network Load Balancer (NLB):**
   - Deploy `ingress-nginx` via Helm with `service.beta.kubernetes.io/aws-load-balancer-type: "nlb"`.
   - Ingress class: `nginx`.
   - Completely preserves the identical NGINX Ingress configuration verified on Day 5 in Minikube.

---

## 5. Database Architecture Trade-offs: EBS StatefulSet vs. Amazon RDS

### 5.1 In-Cluster PostgreSQL Architectural Limitations on EKS
While running PostgreSQL as a StatefulSet backed by AWS EBS `gp3` functions for local testing and cost-constrained staging, it has critical architectural limitations that prevent it from being classified as production-ready:

1. **Single-AZ EBS Volume Affinity Conflict:**
   AWS EBS volumes are strictly constrained to a single Availability Zone (e.g., `us-east-1a`). Worker nodes in the managed node group are distributed across `us-east-1a` and `us-east-1b`. If the node running PostgreSQL in `us-east-1a` fails, Kubernetes cannot attach the existing EBS volume to a worker node in `us-east-1b`. The PostgreSQL pod will remain in `CrashLoopBackOff` or `FailedScheduling` until compute capacity in `us-east-1a` recovers.
2. **Standalone PersistentVolumeClaim Binding:**
   The Helm chart uses a standalone `PersistentVolumeClaim` resource rather than dynamic `volumeClaimTemplates`. While acceptable for a single-replica deployment (`replicas: 1`), this architecture prevents horizontal database scaling or standard leader-follower replication topologies.
3. **Absence of High Availability and Automated Failover:**
   The StatefulSet runs a single replica without streaming replication, Patroni consensus, or automated health failover. Any container failure, pod eviction, or node patching induces database downtime.
4. **Disaster Recovery and Data Lifecycle Isolation:**
   The database lifecycle is bound to the Kubernetes cluster. Unlike Amazon RDS, which offers continuous Point-in-Time Recovery (PITR) to Amazon S3 and automated cross-region snapshots, in-cluster PostgreSQL requires engineering teams to manually deploy, test, and maintain external backup tools (e.g., `pgBackRest` or `Velero`).

### 5.2 Comparative Architectural Analysis

| Architectural Dimension | Option A: In-Cluster PostgreSQL StatefulSet (gp3 EBS) | Option B: Amazon RDS PostgreSQL (Managed Service) |
| :--- | :--- | :--- |
| **Operational Overhead** | High. Engineering team must manage backups, replicas, failover, vacuuming, and disk resizing. | Minimal. AWS manages automatic minor upgrades, Multi-AZ failover, daily snapshots, and storage autoscaling. |
| **High Availability** | Node failure triggers Pod restart on another node (~1-2 minutes). EBS volume remount is single-AZ. | Multi-AZ synchronous replication with automatic failover in 60-120 seconds with zero data loss. |
| **Cost** | Low: 10 GiB gp3 EBS volume = **~$0.80 / month**. | Moderate: `db.t4g.micro` Multi-AZ = **~$29.00 / month**. |
| **Data Durability** | Protected by EBS volume snapshots, but vulnerable to accidental PVC deletion or namespace wipe. | Isolated outside the Kubernetes cluster lifecycle; immune to `helm uninstall` or cluster destruction. |
| **Production Recommendation** | Recommended for local development, staging, or cost-constrained prototypes. | **Strongly Recommended for Production Enterprise deployments.** |

---

## 6. Cost Estimation & Optimization Summary

### 6.1 Itemized Monthly Cost Breakdown (Dev/Test Environment)

| Service Component | Sizing & Configuration | Monthly Cost (Est. USD) |
| :--- | :--- | :--- |
| **Amazon EKS Cluster** | 1 control plane ($0.10 / hour) | ~$73.00 |
| **EC2 Worker Nodes** | 2 x `t3.medium` ($0.0416 / hr on-demand) | ~$60.74 |
| **Node Root EBS Storage** | 2 x 30 GiB gp3 root volumes ($0.08 / GB-mo) | ~$4.80 |
| **PostgreSQL EBS Volume** | 1 x 10 GiB gp3 persistent volume ($0.08 / GB-mo) | ~$0.80 |
| **NAT Gateway (Single)** | 1 NAT Gateway ($0.045 / hr) | ~$32.85 |
| **NAT Elastic IP (Public IPv4)** | 1 Elastic IP ($0.005 / hr per AWS IPv4 pricing) | ~$3.65 |
| **Application Load Balancer (ALB)** | 1 internet-facing ALB ($0.0225 / hr) | ~$16.43 |
| **ALB Public IPv4 Addresses** | 2 Public IPv4 IPs across 2 public subnets ($0.005 / hr each) | ~$7.30 |
| **CloudWatch Logs** | EKS control plane logging (~10 GB ingestion at $0.50/GB) | ~$5.00 |
| **Data Transfer & ALB LCUs** | Intra-AZ, NAT data processing & base LCUs | ~$3.00 |
| **Realistic Total (Dev/Test)** | **Single NAT GW, 2 x t3.medium, ALB, EBS gp3** | **~$207.57 / month (~$6.92 / day)** |
| *Multi-AZ Production with RDS* | *2 NAT GWs ($65.70), RDS Multi-AZ db.t4g.small ($58.00)* | *~$310.00 / month* |

### 6.2 Key Cost Assumptions & Excluded Items
- **Public IPv4 Charges:** Explicitly modeled at $0.005/hr per IPv4 address (mandatory AWS fee effective Feb 1, 2024). Worker nodes run in private subnets with zero public IPs.
- **Excluded Items:** Route 53 private/public hosted zones ($0.50/zone), data egress beyond the 100 GB/month AWS free tier, and commercial monitoring SaaS tools.

---

## 7. Teardown & Clean Destruction Sequence

> [!WARNING]
> **Avoid Stranded Cloud Resources:**
> Kubernetes provisions dynamic ALBs, Target Groups, ENIs, and EBS volumes directly in AWS. Running `terraform destroy` prior to un-deploying Kubernetes workloads causes AWS API errors (`DependencyViolation`) because the VPC cannot be destroyed while external ENIs remain attached.

Execute cleanup in this strict order:

```powershell
# 1. Uninstall Helm release (deletes AWS ALB and target groups)
helm uninstall taskboard -n taskboard

# 2. Delete PersistentVolumeClaims (releases dynamic EBS gp3 storage volumes)
kubectl delete pvc --all -n taskboard

# 3. Verify no lingering LoadBalancer services or ingresses exist
kubectl get ingress,svc -n taskboard

# 4. Remove namespace
kubectl delete namespace taskboard

# 5. Destroy Terraform-managed infrastructure
cd terraform
terraform destroy -auto-approve
```
