# Stage environment (D-table: cheaper, single-instance, single-NAT, disposable).
module "env" {
  source = "../_env"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  env            = "stage"
  is_prod        = false
  subdomain_base = "stage.contracthubs.com"

  # Networking
  vpc_cidr           = "10.1.0.0/16"
  single_nat_gateway = true

  # Aurora (INF-30/33/34)
  db_instance_class        = "db.t4g.medium"
  db_reader_count          = 0
  db_backup_retention_days = 7
  db_deletion_protection   = false

  # ECS sizing (INF-19) — single task, no autoscaling
  api_cpu           = "512"
  api_memory        = "1024"
  api_desired_count = 1
  api_autoscaling   = false
  api_min_count     = 1
  api_max_count     = 1

  web_cpu           = "256"
  web_memory        = "512"
  web_desired_count = 1
  web_autoscaling   = false
  web_min_count     = 1
  web_max_count     = 1

  # Edge / observability
  count_common_ruleset = true
  log_retention_days   = 30
  alert_email          = "ala@contracthubs.com" # TRD O1 — point at a distribution list
}

output "web_url" { value = module.env.web_url }
output "api_url" { value = module.env.api_url }
output "alb_dns_name" { value = module.env.alb_dns_name }
