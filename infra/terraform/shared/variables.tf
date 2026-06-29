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

variable "github_repo" {
  type        = string
  default     = "ala-contracthubs/platform"
  description = "owner/repo allowed to assume the CI roles via GitHub OIDC."
}

variable "root_domain" {
  type        = string
  default     = "contracthubs.com"
  description = "Existing Route 53 public hosted zone (looked up, not created)."
}

variable "dev_image_retention_days" {
  type        = number
  default     = 30
  description = "Days to keep dev/staging (sha-*) images before expiry (INF-16/INF-57)."
}
