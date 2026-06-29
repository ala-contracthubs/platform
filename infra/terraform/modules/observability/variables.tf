variable "project" { type = string }
variable "env" { type = string }
variable "region" { type = string }

variable "is_prod" {
  type        = bool
  description = "Prod gets the full alarm set; stage a trimmed subset (INF-63)."
}

variable "alert_email" {
  type        = string
  description = "SNS email subscription target (INF-63 / TRD O1)."
}

variable "alb_arn_suffix" { type = string }
variable "cluster_name" { type = string }
variable "db_cluster_identifier" { type = string }

variable "services" {
  type = map(object({
    service_name  = string
    tg_arn_suffix = string
  }))
  description = "Map app -> { service_name, tg_arn_suffix } for per-service alarms."
}

variable "latency_p99_threshold" {
  type    = number
  default = 1.5
}
