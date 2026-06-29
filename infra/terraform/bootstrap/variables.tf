variable "project" {
  type        = string
  default     = "contracthubs"
  description = "Project slug used in resource names/tags."
}

variable "region" {
  type        = string
  default     = "eu-west-2"
  description = "Primary AWS region (London)."
}

variable "state_bucket_name" {
  type        = string
  default     = "contracthubs-tfstate"
  description = "S3 bucket that stores all Terraform state (keyed per stack)."
}

variable "lock_table_name" {
  type        = string
  default     = "contracthubs-tflock"
  description = "DynamoDB table used for Terraform state locking."
}
