# ===========================================================================
# Environment composition. Both stage/prod roots call this with literal values;
# per-env divergence (sizing, NAT, retention, protection) is passed in.
# ===========================================================================

data "aws_caller_identity" "current" {}

# Account-global resources from the shared stack.
data "terraform_remote_state" "shared" {
  backend = "s3"
  config = {
    bucket = "contracthubs-tfstate"
    key    = "shared/terraform.tfstate"
    region = "eu-west-2"
  }
}

locals {
  zone_id = data.terraform_remote_state.shared.outputs.route53_zone_id

  api_public = "api.${var.subdomain_base}"
  web_public = "platform.${var.subdomain_base}"
  api_origin = "api-origin.${var.subdomain_base}"
  web_origin = "platform-origin.${var.subdomain_base}"

  api_image = "${data.terraform_remote_state.shared.outputs.ecr_repository_urls["api"]}:bootstrap"
  web_image = "${data.terraform_remote_state.shared.outputs.ecr_repository_urls["web"]}:bootstrap"

  api_port = 3000
  web_port = 8080
}

# --- Per-env KMS CMK (INF-40) ----------------------------------------------
data "aws_iam_policy_document" "kms" {
  statement {
    sid       = "Root"
    effect    = "Allow"
    actions   = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }

  # CloudWatch Logs must be allowed to use the key to encrypt this env's groups.
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*",
      "kms:GenerateDataKey*", "kms:DescribeKey",
    ]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["logs.${var.region}.amazonaws.com"]
    }
    condition {
      test     = "ArnLike"
      variable = "kms:EncryptionContext:aws:logs:arn"
      values   = ["arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/${var.project}/${var.env}/*"]
    }
  }
}

resource "aws_kms_key" "main" {
  description             = "${var.project}-${var.env} app/data CMK"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy                  = data.aws_iam_policy_document.kms.json
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.project}-${var.env}"
  target_key_id = aws_kms_key.main.key_id
}

# --- App secrets (INF-36): JWT signing key + SMS-OTP provider key ----------
resource "random_password" "jwt" {
  length           = 64
  special          = true
  override_special = "-_"
}

resource "aws_secretsmanager_secret" "jwt" {
  name                    = "/${var.project}/${var.env}/app/jwt-signing-key"
  kms_key_id              = aws_kms_key.main.arn
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id     = aws_secretsmanager_secret.jwt.id
  secret_string = random_password.jwt.result
}

# Populated out-of-band once the SMS provider is chosen (TRD O3).
resource "aws_secretsmanager_secret" "sms" {
  name                    = "/${var.project}/${var.env}/app/sms-otp-key"
  kms_key_id              = aws_kms_key.main.arn
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "sms" {
  secret_id     = aws_secretsmanager_secret.sms.id
  secret_string = "REPLACE_ME"

  lifecycle {
    ignore_changes = [secret_string] # set manually; don't let TF reset it
  }
}

# CloudFront <-> ALB shared secret header (INF-26). Alnum so it's a valid header.
resource "random_password" "origin_secret" {
  length  = 40
  special = false
}

# --- Modules ---------------------------------------------------------------
module "network" {
  source             = "../../modules/network"
  project            = var.project
  env                = var.env
  region             = var.region
  vpc_cidr           = var.vpc_cidr
  az_count           = 2
  single_nat_gateway = var.single_nat_gateway
}

module "database" {
  source                = "../../modules/database"
  project               = var.project
  env                   = var.env
  isolated_subnet_ids   = module.network.isolated_subnet_ids
  db_security_group_id  = module.network.db_security_group_id
  kms_key_arn           = aws_kms_key.main.arn
  instance_class        = var.db_instance_class
  reader_count          = var.db_reader_count
  backup_retention_days = var.db_backup_retention_days
  deletion_protection   = var.db_deletion_protection
}

module "iam" {
  source      = "../../modules/iam"
  project     = var.project
  env         = var.env
  kms_key_arn = aws_kms_key.main.arn
  secret_arns = concat(
    module.database.secret_arns,
    [aws_secretsmanager_secret.jwt.arn, aws_secretsmanager_secret.sms.arn],
  )
}

module "cluster" {
  source  = "../../modules/ecs-cluster"
  project = var.project
  env     = var.env
}

module "alb" {
  source                = "../../modules/alb"
  project               = var.project
  env                   = var.env
  public_subnet_ids     = module.network.public_subnet_ids
  alb_security_group_id = module.network.alb_security_group_id
  zone_id               = local.zone_id
  origin_domains        = [local.api_origin, local.web_origin]
}
