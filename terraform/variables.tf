# ==============================================================================
# TaskBoard Terraform Infrastructure — Input Variables
# ==============================================================================

variable "aws_region" {
  description = "Target AWS region for deploying the VPC and EKS infrastructure."
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]{1}$", var.aws_region))
    error_message = "The aws_region variable must follow standard AWS region naming (e.g., us-east-1, eu-west-1)."
  }
}

variable "environment" {
  description = "Deployment lifecycle environment name (e.g., dev, staging, prod)."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project identifier prefix applied to resources and resource names."
  type        = string
  default     = "taskboard"
}

variable "cluster_name" {
  description = "Unique name identifier for the Amazon EKS Kubernetes cluster."
  type        = string
  default     = "taskboard-eks"
}

variable "cluster_version" {
  description = "Target Kubernetes control plane version for the Amazon EKS cluster."
  type        = string
  default     = "1.35"
}

variable "vpc_cidr" {
  description = "Base IPv4 CIDR block allocation for the dedicated TaskBoard VPC."
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "The vpc_cidr must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "List of AWS Availability Zones for spreading subnets across multi-AZ topology."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]

  validation {
    condition     = length(var.availability_zones) >= 2
    error_message = "EKS requires subnets across at least 2 Availability Zones for high availability."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR block allocations for public subnets (Internet Gateway access)."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR block allocations for private subnets (EKS nodes and internal workloads)."
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "single_nat_gateway" {
  description = "Deploy a single NAT Gateway shared across private subnets to minimize AWS operational costs (~$32/mo vs ~$64/mo for 2 AZs). Set to false for multi-AZ production redundancy."
  type        = bool
  default     = true
}

variable "node_instance_types" {
  description = "EC2 instance types for the EKS managed node group worker instances."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired number of worker nodes running in the managed node group."
  type        = number
  default     = 2

  validation {
    condition     = var.node_desired_size >= 1
    error_message = "Desired node count must be at least 1."
  }
}

variable "node_min_size" {
  description = "Minimum number of worker nodes permitted in the autoscaling group."
  type        = number
  default     = 1
}

variable "node_max_size" {
  description = "Maximum number of worker nodes permitted in the autoscaling group."
  type        = number
  default     = 4

  validation {
    condition     = var.node_max_size >= var.node_desired_size
    error_message = "Maximum node count must be greater than or equal to desired node count."
  }
}

variable "node_disk_size" {
  description = "Root EBS storage volume capacity (in GiB) for each worker node instance."
  type        = number
  default     = 30
}

variable "cluster_endpoint_public_access" {
  description = "Enable public API server endpoint access for kubectl administration."
  type        = bool
  default     = true
}

variable "cluster_endpoint_private_access" {
  description = "Enable private API server endpoint access within the VPC."
  type        = bool
  default     = true
}

variable "cluster_endpoint_public_access_cidrs" {
  description = "Explicit CIDR blocks permitted to communicate with the EKS public API endpoint. Defaults to empty list for private-only endpoint access. Specify trusted administrator CIDRs (e.g., ['203.0.113.50/32']) to enable public access."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional resource tags to merge into all infrastructure components."
  type        = map(string)
  default     = {}
}
