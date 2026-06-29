# Production environment (D-table: Multi-AZ, autoscaled, NAT-per-AZ, protected).
module "env" {
  source = "../_env"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  env            = "prod"
  is_prod        = true
  subdomain_base = "contracthubs.com"

  # Networking
  vpc_cidr           = "10.0.0.0/16"
  single_nat_gateway = false # one NAT per AZ (INF-14)

  # Aurora (INF-30/31/33/34) — writer + reader Multi-AZ, protected
  db_instance_class        = "db.t4g.large"
  db_reader_count          = 1
  db_backup_retention_days = 14
  db_deletion_protection   = true

  # ECS sizing (INF-19/21) — min 2 per service, CPU-target autoscaling
  api_cpu           = "1024"
  api_memory        = "2048"
  api_desired_count = 2
  api_autoscaling   = true
  api_min_count     = 2
  api_max_count     = 6

  web_cpu           = "256"
  web_memory        = "512"
  web_desired_count = 2
  web_autoscaling   = true
  web_min_count     = 2
  web_max_count     = 4

  # Edge / observability
  count_common_ruleset = true # CommonRuleSet in Count first (INF-68)
  log_retention_days   = 90
  alert_email          = "ala@contracthubs.com" # TRD O1 — point at a distribution list
}

output "web_url" { value = module.env.web_url }
output "api_url" { value = module.env.api_url }
output "alb_dns_name" { value = module.env.alb_dns_name }
