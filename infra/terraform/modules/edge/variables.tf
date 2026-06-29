variable "project" { type = string }
variable "env" { type = string }

variable "zone_id" { type = string }

variable "api_public_domain" { type = string }
variable "web_public_domain" { type = string }
variable "api_origin_domain" {
  type        = string
  description = "ALB origin hostname for the API (CloudFront origin)."
}
variable "web_origin_domain" {
  type        = string
  description = "ALB origin hostname for the web app (CloudFront origin)."
}

variable "origin_secret" {
  type        = string
  sensitive   = true
  description = "X-Origin-Verify header value CloudFront injects (INF-26)."
}

variable "rate_limit" {
  type        = number
  default     = 2000
  description = "General per-IP WAF rate limit per 5 min (INF-67)."
}

variable "otp_rate_limit" {
  type        = number
  default     = 100
  description = "Tighter per-IP limit on /auth* (OTP abuse) (INF-67)."
}

variable "count_common_ruleset" {
  type        = bool
  default     = true
  description = "Run AWS CommonRuleSet in Count mode first (INF-68)."
}

variable "log_retention_days" { type = number }
