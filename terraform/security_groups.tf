# ==============================================================================
# TaskBoard Security Groups Configuration
# ==============================================================================

# Security Group for EKS Cluster Control Plane
resource "aws_security_group" "eks_cluster" {
  name        = "${var.project_name}-${var.environment}-eks-cluster-sg"
  description = "Security group for the EKS control plane communication with worker nodes"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound traffic from control plane"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-eks-cluster-sg"
  }
}

# Security Group for EKS Worker Nodes
resource "aws_security_group" "eks_nodes" {
  name        = "${var.project_name}-${var.environment}-eks-nodes-sg"
  description = "Security group for all worker nodes in the EKS cluster"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Allow all outbound traffic from worker nodes"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name                                        = "${var.project_name}-${var.environment}-eks-nodes-sg"
    "kubernetes.io/cluster/${var.cluster_name}" = "owned"
  }
}

# ------------------------------------------------------------------------------
# Security Group Ingress Rules (Separated to prevent circular dependencies)
# ------------------------------------------------------------------------------

# Allow control plane to communicate with kubelet and pods (ports 443, 10250)
resource "aws_security_group_rule" "cluster_to_node_https" {
  description              = "Allow control plane to manage worker nodes over HTTPS"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_cluster.id
}

resource "aws_security_group_rule" "cluster_to_node_kubelet" {
  description              = "Allow control plane to query kubelet API on worker nodes"
  type                     = "ingress"
  from_port                = 10250
  to_port                  = 10250
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_cluster.id
}

# Allow worker nodes to communicate with control plane API server (port 443)
resource "aws_security_group_rule" "node_to_cluster_https" {
  description              = "Allow worker nodes to communicate with EKS control plane API"
  type                     = "ingress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.eks_cluster.id
  source_security_group_id = aws_security_group.eks_nodes.id
}

# Allow worker nodes to communicate with each other internally
resource "aws_security_group_rule" "node_to_node_internal" {
  description              = "Allow nodes to communicate with each other on all ports"
  type                     = "ingress"
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  security_group_id        = aws_security_group.eks_nodes.id
  source_security_group_id = aws_security_group.eks_nodes.id
}
