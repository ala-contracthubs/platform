terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  backend "s3" {
    bucket         = "contracthubs-tfstate"
    key            = "env/prod/terraform.tfstate"
    region         = "eu-west-2"
    dynamodb_table = "contracthubs-tflock"
    encrypt        = true
  }
}
