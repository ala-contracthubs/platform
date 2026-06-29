variable "project" {
  type        = string
  description = "Project slug."
}

variable "env" {
  type        = string
  description = "Environment name (stage|prod)."
}

variable "region" {
  type        = string
  description = "AWS region (for VPC-endpoint service names)."
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block (e.g. 10.0.0.0/16)."
}

variable "az_count" {
  type        = number
  default     = 2
  description = "Number of AZs to spread across (INF-12)."
}

variable "single_nat_gateway" {
  type        = bool
  description = "true = one shared NAT (stage); false = one NAT per AZ (prod) (INF-14)."
}
