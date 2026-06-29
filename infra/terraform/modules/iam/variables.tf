variable "project" {
  type = string
}

variable "env" {
  type = string
}

variable "secret_arns" {
  type        = list(string)
  default     = []
  description = "Secrets Manager ARNs the task execution role may read (INF-38)."
}

variable "kms_key_arn" {
  type        = string
  description = "Customer-managed KMS key used to decrypt the secrets (INF-40)."
}
