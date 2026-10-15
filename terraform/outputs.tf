# ==============================================================================
# TaskBoard Terraform Infrastructure — Output Values
# ==============================================================================

output "cluster_name" {
  description = "Name identifier of the deployed Amazon EKS cluster."
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "API server endpoint URL for the Amazon EKS control plane."
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_version" {
  description = "Kubernetes platform version running on the EKS control plane."
  value       = aws_eks_cluster.main.version
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS control plane."
  value       = aws_security_group.eks_cluster.id
}

output "node_security_group_id" {
  description = "Security group ID attached to the EKS worker nodes."
  value       = aws_security_group.eks_nodes.id
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster."
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "node_group_name" {
  description = "Name of the managed node group running worker instances."
  value       = aws_eks_node_group.main.node_group_name
}

output "node_group_arn" {
  description = "Amazon Resource Name (ARN) of the managed node group."
  value       = aws_eks_node_group.main.arn
}

output "vpc_id" {
  description = "ID of the dedicated TaskBoard VPC."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of IDs for the public subnets."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of IDs for the private subnets."
  value       = aws_subnet.private[*].id
}

output "oidc_provider_arn" {
  description = "ARN of the OIDC Provider for IAM Roles for Service Accounts (IRSA)."
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "oidc_provider_url" {
  description = "URL of the OIDC Provider issuer."
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

output "ebs_csi_role_arn" {
  description = "IAM Role ARN utilized by the Amazon EBS CSI Driver addon via IRSA."
  value       = aws_iam_role.ebs_csi_irsa.arn
}

output "configure_kubectl" {
  description = "CLI command to update local kubeconfig and connect kubectl to the EKS cluster."
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${var.cluster_name}"
}
