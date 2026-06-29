variable "project" { type = string }
variable "env" { type = string }
variable "region" { type = string }

variable "app" {
  type        = string
  description = "Service name (api|web)."
}

variable "cluster_arn" { type = string }
variable "cluster_name" { type = string }

variable "image" {
  type        = string
  description = "Initial container image. The running image is owned by the deploy pipeline thereafter (INF-50)."
}

variable "container_port" { type = number }

variable "cpu" {
  type        = string
  description = "Fargate task CPU units (e.g. \"512\")."
}

variable "memory" {
  type        = string
  description = "Fargate task memory MiB (e.g. \"1024\")."
}

variable "desired_count" { type = number }

variable "autoscaling_enabled" { type = bool }
variable "min_count" { type = number }
variable "max_count" { type = number }
variable "cpu_target" {
  type    = number
  default = 65
}

variable "execution_role_arn" { type = string }
variable "task_role_arn" { type = string }

variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "ecs_security_group_id" { type = string }

variable "https_listener_arn" { type = string }
variable "listener_rule_priority" { type = number }

variable "origin_host" {
  type        = string
  description = "Origin hostname the ALB host-routes this service on."
}

variable "origin_secret" {
  type        = string
  sensitive   = true
  description = "X-Origin-Verify value CloudFront injects; ALB requires it (INF-26)."
}

variable "health_check_path" { type = string }

variable "log_retention_days" { type = number }
variable "kms_key_arn" { type = string }

variable "environment" {
  type        = map(string)
  default     = {}
  description = "Plain (non-secret) env vars (INF-37)."
}

variable "secrets" {
  type        = map(string)
  default     = {}
  description = "Secret env vars: name -> Secrets Manager valueFrom ARN (INF-36/38)."
}
