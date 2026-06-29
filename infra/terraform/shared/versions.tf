terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket         = "contracthubs-tfstate"
    key            = "shared/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "contracthubs-tflock"
    encrypt        = true
  }
}
