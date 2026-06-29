# --- CloudFront + WAF (INF-27/65) ------------------------------------------
module "edge" {
  source = "../../modules/edge"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project = var.project
  env     = var.env
  zone_id = local.zone_id

  api_public_domain = local.api_public
  web_public_domain = local.web_public
  api_origin_domain = local.api_origin
  web_origin_domain = local.web_origin

  origin_secret        = random_password.origin_secret.result
  count_common_ruleset = var.count_common_ruleset
  log_retention_days   = var.log_retention_days
}

# --- Observability (INF-62/63) ---------------------------------------------
module "observability" {
  source = "../../modules/observability"

  project = var.project
  env     = var.env
  region  = var.region
  is_prod = var.is_prod

  alert_email           = var.alert_email
  alb_arn_suffix        = module.alb.alb_arn_suffix
  cluster_name          = module.cluster.cluster_name
  db_cluster_identifier = module.database.cluster_identifier

  services = {
    api = {
      service_name  = module.api.service_name
      tg_arn_suffix = module.api.target_group_arn_suffix
    }
    web = {
      service_name  = module.web.service_name
      tg_arn_suffix = module.web.target_group_arn_suffix
    }
  }
}
