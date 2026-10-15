# TaskBoard — AWS EKS Deployment Guide & Prerequisites

> [!IMPORTANT]
> **Project State:** The Terraform configuration in `terraform/` and Helm values in `helm/taskboard/values-aws.yaml` have been **statically validated only** via `terraform validate` and `helm lint`. In accordance with user constraints and a ₹0 cloud budget, no active cloud resources have been provisioned. This document outlines the prerequisites and execution runbook for deploying to an active AWS account in the future.

---

## 1. Prerequisites for Real AWS Provisioning

### A. AWS Account & IAM Permissions
To execute `terraform apply`, the engineer must have:
1. An active AWS Account with billing enabled.
2. An IAM User or Role with permissions to manage:
   - Amazon VPC, Subnets, Route Tables, Internet Gateways, NAT Gateways
   - Amazon EKS Clusters and Managed Node Groups
   - AWS IAM Roles, Policies, and OpenID Connect (OIDC) Providers
   - Amazon EC2 Security Groups and Key Pairs
   - AWS KMS Keys and Aliases
   - Amazon CloudWatch Log Groups

### B. Local Tooling
- **AWS CLI v2**: Installed and configured (`aws configure`).
- **Terraform v1.16+**: Initialized in `terraform/`.
- **kubectl v1.35+**: For cluster interaction.
- **Helm v3.14+**: For chart deployments.

---

## 2. Estimated Cost Breakdown

Running this infrastructure on AWS incurs real hourly charges:

| Resource | Specification | Estimated Monthly Cost (us-east-1) |
| :--- | :--- | :---: |
| **Amazon EKS Control Plane** | 1 Cluster ($0.10/hour) | ~$73.00 |
| **EC2 Worker Nodes** | 2x `t3.medium` On-Demand ($0.0416/hr each) | ~$60.00 |
| **NAT Gateway** | 1 NAT Gateway ($0.045/hr + data processing) | ~$33.00 |
| **EBS gp3 Storage** | 2x 30GB Root Volumes + 1x 10GB Data Volume | ~$6.00 |
| **AWS Application Load Balancer** | 1 ALB ($0.0225/hr + LCU charges) | ~$20.00 |
| **Estimated Total** | | **~$192.00 / month** |

*Recommendation for evaluation:* Provision only for short demonstration windows (e.g., 2 hours = ~$0.60) and destroy immediately afterward.

---

## 3. Step-by-Step Deployment Runbook

### Step 1: Configure Variables
Copy `terraform.tfvars.example` to `terraform.tfvars`:
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```
Edit `terraform.tfvars` with:
- `aws_region = "us-east-1"`
- `cluster_name = "taskboard-eks"`
- `environment = "production"`
- `trusted_api_cidrs = ["YOUR_OFFICE_OR_HOME_PUBLIC_IP/32"]` # Strict access control

### Step 2: Initialize & Review Plan
```bash
terraform init
terraform plan -out=tfplan
```
Review the proposed resource creations (VPC, Subnets, EKS, Node Groups, IRSA).

### Step 3: Apply Infrastructure (Explicit Authorization Required)
```bash
terraform apply tfplan
```
*Wait 12–15 minutes for EKS control plane and managed node groups to transition to `Active`.*

### Step 4: Configure kubectl Context
```bash
aws eks update-kubeconfig --region us-east-1 --name taskboard-eks
kubectl get nodes
```

### Step 5: Install AWS Load Balancer Controller
The AWS Load Balancer Controller manages ALBs for Kubernetes Ingress:
```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=taskboard-eks \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Step 6: Deploy TaskBoard Helm Chart with AWS Values
Create the required namespace and secret:
```bash
kubectl create namespace taskboard
kubectl create secret generic taskboard-secrets \
  --namespace taskboard \
  --from-literal=POSTGRES_PASSWORD="YourStrongSecretPassword123!"

# Deploy using values-aws.yaml
helm install taskboard ./helm/taskboard \
  --namespace taskboard \
  -f ./helm/taskboard/values-aws.yaml \
  --set postgresql.auth.password="YourStrongSecretPassword123!"
```

---

## 4. Teardown & Resource Cleanup

To prevent ongoing billing after demonstration:

```bash
# 1. Uninstall Helm releases and wait for ALB deletion
helm uninstall taskboard -n taskboard
helm uninstall aws-load-balancer-controller -n kube-system

# 2. Destroy all AWS cloud resources via Terraform
cd terraform
terraform destroy -auto-approve
```
