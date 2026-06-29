variable "project" { type = string }
variable "env" { type = string }

variable "public_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "zone_id" {
  type        = string
  description = "Route 53 hosted zone for origin records + ACM validation."
}

variable "origin_domains" {
  type        = list(string)
  description = "Internal origin hostnames CloudFront connects to (e.g. api-origin.<env>, platform-origin.<env>). The ALB cert covers these and host-routes on them."
}
