variable "project" { type = string }
variable "env" { type = string }

variable "isolated_subnet_ids" {
  type        = list(string)
  description = "Isolated subnets for the DB subnet group (INF-35)."
}

variable "db_security_group_id" {
  type = string
}

variable "kms_key_arn" {
  type        = string
  description = "Customer-managed KMS key for storage, PI, and the managed master secret (INF-32/40)."
}

variable "engine_version" {
  type        = string
  default     = "16.4"
  description = "Aurora PostgreSQL version. Confirm availability in eu-west-2 with `aws rds describe-db-engine-versions --engine aurora-postgresql`."
}

variable "instance_class" {
  type        = string
  description = "DB instance class (e.g. db.t4g.medium / db.t4g.large) (INF-30)."
}

variable "reader_count" {
  type        = number
  description = "Number of reader instances (0 = stage, 1 = prod Multi-AZ) (INF-31)."
}

variable "backup_retention_days" {
  type        = number
  description = "PITR retention window (INF-33)."
}

variable "deletion_protection" {
  type        = bool
  description = "prod true (+final snapshot), stage false (disposable) (INF-34)."
}

variable "db_name" {
  type    = string
  default = "contracthubs"
}

variable "master_username" {
  type    = string
  default = "chadmin"
}

variable "app_username" {
  type        = string
  default     = "app"
  description = "Least-privilege runtime DB user (INF-39). Created out-of-band — see module README."
}
