terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  # NOTE: Local state is used by default for offline validation.
  # For remote multi-developer production workflows, configure an S3 backend with DynamoDB locking:
  # backend "s3" {
  #   bucket         = "taskboard-terraform-state-<account-id>"
  #   key            = "eks/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "taskboard-terraform-locks"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(
      {
        Project     = var.project_name
        Environment = var.environment
        ManagedBy   = "Terraform"
        Component   = "Infrastructure"
      },
      var.tags
    )
  }
}
