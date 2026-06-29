variable "project" {
  type    = string
  default = "contracthubs"
}

variable "env" {
  type        = string
  description = "stage|prod."
}

variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "is_prod" {
  type = bool
}

variable "subdomain_base" {
  type        = string
  description = "prod: contracthubs.com ; stage: stage.contracthubs.com. Public + origin hostnames are derived from this."
}

# --- Networking ------------------------------------------------------------
variable "vpc_cidr" { type = string }
variable "single_nat_gateway" { type = bool }

# --- Aurora ----------------------------------------------------------------
variable "db_instance_class" { type = string }
variable "db_reader_count" { type = number }
variable "db_backup_retention_days" { type = number }
variable "db_deletion_protection" { type = bool }

# --- ECS sizing (INF-19) ---------------------------------------------------
variable "api_cpu" { type = string }
variable "api_memory" { type = string }
variable "api_desired_count" { type = number }
variable "api_autoscaling" { type = bool }
variable "api_min_count" { type = number }
variable "api_max_count" { type = number }

variable "web_cpu" { type = string }
variable "web_memory" { type = string }
variable "web_desired_count" { type = number }
variable "web_autoscaling" { type = bool }
variable "web_min_count" { type = number }
variable "web_max_count" { type = number }

# --- Edge / observability --------------------------------------------------
variable "count_common_ruleset" {
  type    = bool
  default = true
}
variable "log_retention_days" { type = number }
variable "alert_email" { type = string }
