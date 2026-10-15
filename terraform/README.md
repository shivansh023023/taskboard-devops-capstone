# TaskBoard AWS Infrastructure — Terraform & Amazon EKS

This directory contains the production-grade Terraform configuration for deploying TaskBoard's cloud infrastructure on Amazon Web Services (AWS), featuring a custom Virtual Private Cloud (VPC) and an Amazon Elastic Kubernetes Service (EKS) managed cluster.

---

## 1. Architecture Overview

```
                                  AWS CLOUD (us-east-1)
 +-----------------------------------------------------------------------------------------+
 |                                  TaskBoard VPC (10.0.0.0/16)                             |
 |                                                                                         |
 |   +---------------------------------------+   +-------------------------------------+   |
 |   |          Availability Zone A          |   |         Availability Zone B         |   |
 |   |                                       |   |                                     |   |
 |   |  +---------------------------------+  |   |  +-------------------------------+  |   |
 |   |  |     Public Subnet (10.0.1.0/24) |  |   |  |   Public Subnet (10.0.2.0/24) |  |   |
 |   |  |     - Internet Gateway Route    |  |   |  |   - Internet Gateway Route    |  |   |
 |   |  |     - NAT Gateway (Elastic IP)  |  |   |  |   - Tag: k8s.io/role/elb = 1  |  |   |
 |   |  |     - Tag: k8s.io/role/elb = 1  |  |   |  +-------------------------------+  |   |
 |   |  +------------------+--------------+  |   |                 ^                   |   |
 |   +---------------------|-----------------+   +-----------------|-------------------+   |
 |                         |                                       |                       |
 |                         v (Egress via NAT)                      |                       |
 |   +---------------------------------------+   +-----------------|-------------------+   |
 |   |  +---------------------------------+  |   |  +--------------+----------------+  |   |
 |   |  |    Private Subnet (10.0.10.0/24)|  |   |  |  Private Subnet (10.0.20.0/24)|  |   |
 |   |  |    - EKS Managed Node (t3.med)  |  |   |  |  - EKS Managed Node (t3.med)  |  |   |
 |   |  |    - Internal Workloads         |  |   |  |  - Internal Workloads         |  |   |
 |   |  |    - Tag: role/internal-elb = 1 |  |   |  |  - Tag: role/internal-elb = 1 |  |   |
 |   |  +---------------------------------+  |   |  +-------------------------------+  |   |
 |   |                                       |   |                                     |   |
 |   +---------------------------------------+   +-------------------------------------+   |
 |                                                                                         |
 |   +---------------------------------------------------------------------------------+   |
 |   |                           Amazon EKS Control Plane                              |   |
 |   |   - Kubernetes v1.35 Managed Master (API, etcd, Controller Manager, Scheduler)  |   |
 |   |   - IAM Role: AmazonEKSClusterPolicy + AmazonEKSVPCResourceController           |   |
 |   |   - OIDC Provider enabled for IAM Roles for Service Accounts (IRSA)             |   |
 |   |   - Security Group: Port 443 strictly controlled                                |   |
 |   +---------------------------------------------------------------------------------+   |
 +-----------------------------------------------------------------------------------------+
```

### Component Details
1. **Virtual Private Cloud (VPC):** `10.0.0.0/16` with DNS hostnames and DNS support enabled.
2. **Subnet Topology:**
   - **Public Subnets:** 2 subnets across 2 Availability Zones (`10.0.1.0/24`, `10.0.2.0/24`) tagged with `kubernetes.io/role/elb = 1` for AWS Application Load Balancers.
   - **Private Subnets:** 2 subnets across 2 Availability Zones (`10.0.10.0/24`, `10.0.20.0/24`) tagged with `kubernetes.io/role/internal-elb = 1` for internal Kubernetes workloads and nodes.
3. **NAT Gateway:** Configurable (`single_nat_gateway = true` by default) to optimize costs while enabling outbound internet access for private nodes (e.g. pulling GHCR container images).
4. **EKS Cluster:** Kubernetes version 1.35 control plane with control plane logging enabled (`api`, `audit`, `authenticator`, `controllerManager`, `scheduler`).
5. **Managed Node Group:** Deployed strictly in private subnets with on-demand `t3.medium` instances (min: 1, desired: 2, max: 4), launch template with IMDSv2 enforcement, and 30 GiB encrypted gp3 root EBS storage.
6. **IAM & Security:**
   - EKS Cluster IAM Role with `AmazonEKSClusterPolicy`.
   - Node Group IAM Role with `AmazonEKSWorkerNodePolicy`, `AmazonEKS_CNI_Policy`, and `AmazonEC2ContainerRegistryReadOnly`.
   - Dedicated IRSA IAM Role for Amazon EBS CSI Driver with `AmazonEBSCSIDriverPolicy` scoped strictly to `system:serviceaccount:kube-system:ebs-csi-controller-sa` (least privilege).
   - IAM OpenID Connect (OIDC) provider for IRSA (IAM Roles for Service Accounts).
   - Dedicated security groups isolating control plane and node traffic.

---

## 2. Estimated AWS Operational Costs

### 2.1 Detailed Cost Breakdown (Dev/Test Environment)

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

### 2.2 Cost Assumptions and Excluded Items
- **Public IPv4 Charges Included:** AWS charges $0.005/hr for all public IPv4 addresses since February 1, 2024. This applies to the NAT Gateway Elastic IP and the ALB's public subnet ENIs.
- **Excluded / Variable Costs:** High-volume ingress/egress (>100 GB/month), route 53 hosted zones ($0.50/domain), custom ACM certificate private CAs, and third-party observability SaaS tools.

> [!TIP]
> **Cost-Saving Tip:** When not actively testing the cloud infrastructure, run the documented teardown procedure to eliminate the EKS cluster, worker nodes, ALB, and NAT Gateway charges.

---

## 3. Security Hardening

- **Private-by-Default API Endpoint Access:** Public API access is disabled by default unless an explicit administrator CIDR list is configured (`cluster_endpoint_public_access_cidrs`). The cluster never exposes `0.0.0.0/0` to the internet.
- **Cluster Administration Network Requirements:**
  - *Private Endpoint Access (Default):* Enabled within the VPC. Administration requires executing `kubectl` from an EC2 bastion / AWS SSM Session inside the VPC, or connecting via AWS Client VPN / Site-to-Site VPN routed to the private subnets.
  - *Public Endpoint Access (Optional):* Enabled only when explicit trusted CIDRs are populated in `cluster_endpoint_public_access_cidrs` (e.g. `["203.0.113.50/32"]`).
- **Private Subnet Placement:** All worker nodes and application workloads run in private subnets with no public IPv4 addresses, preventing direct unauthorized internet exposure.
- **IMDSv2 Enforcement & Node Hardening:** The worker node launch template mandates HTTP tokens (`http_tokens = "required"`), limits metadata hop count to 2, and enforces EBS gp3 volume encryption.
- **Least-Privilege IRSA for Addons:** The AWS EBS CSI Driver uses a dedicated IAM role bound to `system:serviceaccount:kube-system:ebs-csi-controller-sa` via OpenID Connect federation, eliminating wide EBS permissions from the worker node role.
- **Add-on Compatibility Resolution:** The Terraform configuration leaves `addon_version` unpinned for `aws_eks_addon.ebs_csi`, allowing Amazon EKS to automatically select the default compatible build for Kubernetes 1.35 at creation time. During deployment, compatible versions can be inspected via:
  ```powershell
  aws eks describe-addon-versions --kubernetes-version 1.35 --addon-name aws-ebs-csi-driver
  ```
- **Least-Privilege Security Groups:** Control plane and worker node security group rules explicitly decouple ingress to ports 443 and 10250, eliminating circular dependencies.
- **Zero Committed Credentials:** No AWS credentials, account IDs, or private secrets exist in the repository. All secrets are passed dynamically via environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) or IAM identity federation.
- **Git Ignore Safeguards:** `.gitignore` blocks `.terraform/`, `*.tfstate*`, and `*.tfvars` files.

---

## 4. Deployment Prerequisites (When AWS Account is Ready)

1. **AWS CLI v2** installed: `aws --version`
2. **Terraform** >= 1.5.0 installed: `terraform version`
3. **kubectl** installed: `kubectl version --client`
4. **AWS Credentials** configured:
   ```powershell
   aws configure
   # Verify authentication
   aws sts get-caller-identity
   ```

---

## 5. Step-by-Step Deployment Workflow

### Step 1: Initialize Terraform
```powershell
cd terraform
terraform init
```

### Step 2: Validate & Review Plan
```powershell
# Copy the example variables
Copy-Item terraform.tfvars.example terraform.tfvars

# Review execution plan
terraform plan
```

### Step 3: Provision Infrastructure (When Approved)
```powershell
terraform apply
```
*Note: EKS cluster provisioning typically takes 10–15 minutes.*

### Step 4: Configure kubectl
```powershell
aws eks update-kubeconfig --region us-east-1 --name taskboard-eks
kubectl get nodes
```

### Step 5: Deploy TaskBoard via Helm
```powershell
# 1. Create namespace & secret
kubectl create namespace taskboard
kubectl create secret generic taskboard-secrets \
  --namespace taskboard \
  --from-literal=POSTGRES_PASSWORD=your_secure_password \
  --from-literal=DATABASE_URL=postgresql+psycopg://taskboard:your_secure_password@postgres:5432/taskboard

# 2. Deploy using production AWS values
helm upgrade --install taskboard ../helm/taskboard \
  --namespace taskboard \
  -f ../helm/taskboard/values-aws.yaml \
  --set postgresql.auth.existingSecret=taskboard-secrets
```

---

## 6. Destruction & Cleanup Sequence

> [!WARNING]
> **Strict Destruction Ordering Required:**
> Kubernetes provisions AWS cloud resources (such as Application Load Balancers, Target Groups, Security Groups, and EBS gp3 volumes) dynamically at runtime. These resources exist outside of Terraform's state file.
> If `terraform destroy` is executed before deleting Kubernetes workloads, AWS will fail to delete subnets and the VPC due to `DependencyViolation` (active ENIs and attached security groups).

Follow this exact sequence to cleanly tear down all billable cloud resources:

```powershell
# Step 1: Uninstall the Helm release (triggers AWS Load Balancer Controller to delete ALB)
helm uninstall taskboard -n taskboard

# Step 2: Delete PersistentVolumeClaims (releases dynamic EBS gp3 storage volumes)
kubectl delete pvc --all -n taskboard

# Step 3: Verify that Ingress and Service load balancers are completely removed
kubectl get ingress -n taskboard
kubectl get svc -n taskboard

# Step 4: Delete the taskboard namespace
kubectl delete namespace taskboard

# Step 5: If AWS Load Balancer Controller was installed via Helm, uninstall it
helm uninstall aws-load-balancer-controller -n kube-system

# Step 6: Destroy all Terraform-managed infrastructure (EKS, nodes, NAT GW, EIP, VPC)
cd terraform
terraform destroy -auto-approve
```
