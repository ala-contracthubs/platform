# --- API + web services (INF-5/18/19) --------------------------------------
module "api" {
  source = "../../modules/ecs-service"

  project = var.project
  env     = var.env
  region  = var.region
  app     = "api"

  cluster_arn  = module.cluster.cluster_arn
  cluster_name = module.cluster.cluster_name
  image        = local.api_image

  container_port = local.api_port
  cpu            = var.api_cpu
  memory         = var.api_memory

  desired_count       = var.api_desired_count
  autoscaling_enabled = var.api_autoscaling
  min_count           = var.api_min_count
  max_count           = var.api_max_count

  execution_role_arn = module.iam.execution_role_arn
  task_role_arn      = module.iam.task_role_arn

  vpc_id                = module.network.vpc_id
  private_subnet_ids    = module.network.private_subnet_ids
  ecs_security_group_id = module.network.ecs_security_group_id

  https_listener_arn     = module.alb.https_listener_arn
  listener_rule_priority = 10
  origin_host            = local.api_origin
  origin_secret          = random_password.origin_secret.result
  health_check_path      = "/health"

  log_retention_days = var.log_retention_days
  kms_key_arn        = aws_kms_key.main.arn

  environment = {
    NODE_ENV   = "production"
    PORT       = tostring(local.api_port)
    AWS_REGION = var.region
    LOG_LEVEL  = "info"
  }

  secrets = {
    DATABASE_URL    = module.database.app_db_url_secret_arn
    JWT_SIGNING_KEY = aws_secretsmanager_secret.jwt.arn
    SMS_OTP_KEY     = aws_secretsmanager_secret.sms.arn
  }
}

module "web" {
  source = "../../modules/ecs-service"

  project = var.project
  env     = var.env
  region  = var.region
  app     = "web"

  cluster_arn  = module.cluster.cluster_arn
  cluster_name = module.cluster.cluster_name
  image        = local.web_image

  container_port = local.web_port
  cpu            = var.web_cpu
  memory         = var.web_memory

  desired_count       = var.web_desired_count
  autoscaling_enabled = var.web_autoscaling
  min_count           = var.web_min_count
  max_count           = var.web_max_count

  execution_role_arn = module.iam.execution_role_arn
  task_role_arn      = module.iam.task_role_arn

  vpc_id                = module.network.vpc_id
  private_subnet_ids    = module.network.private_subnet_ids
  ecs_security_group_id = module.network.ecs_security_group_id

  https_listener_arn     = module.alb.https_listener_arn
  listener_rule_priority = 20
  origin_host            = local.web_origin
  origin_secret          = random_password.origin_secret.result
  health_check_path      = "/"

  log_retention_days = var.log_retention_days
  kms_key_arn        = aws_kms_key.main.arn

  environment = {}
  secrets     = {}
}

# --- Migration task (INF-42) -----------------------------------------------
# Runs `prisma migrate deploy` as the MASTER user (DDL). The deploy pipeline
# registers a new revision with the freshly built image, then run-tasks it
# before rolling the api service. TF owns the baseline; ignore_changes lets the
# pipeline own the image (INF-50).
resource "aws_cloudwatch_log_group" "migrate" {
  name              = "/${var.project}/${var.env}/migrate"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.main.arn
}

resource "aws_ecs_task_definition" "migrate" {
  family                   = "${var.project}-${var.env}-migrate"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = module.iam.execution_role_arn
  task_role_arn            = module.iam.task_role_arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "migrate"
      image     = local.api_image
      essential = true
      command = [
        "sh", "-lc",
        "export DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require\" && ./node_modules/.bin/prisma migrate deploy",
      ]
      environment = [
        { name = "DB_HOST", value = module.database.cluster_endpoint },
        { name = "DB_PORT", value = tostring(module.database.port) },
        { name = "DB_NAME", value = module.database.db_name },
      ]
      secrets = [
        { name = "DB_USER", valueFrom = "${module.database.master_secret_arn}:username::" },
        { name = "DB_PASSWORD", valueFrom = "${module.database.master_secret_arn}:password::" },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.migrate.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "migrate"
        }
      }
    }
  ])

  lifecycle {
    ignore_changes = [container_definitions]
  }
}

# --- Deploy metadata for the pipeline (read via SSM by gha-app-deploy) ------
resource "aws_ssm_parameter" "deploy" {
  for_each = {
    cluster             = module.cluster.cluster_name
    private_subnets     = join(",", module.network.private_subnet_ids)
    ecs_security_group  = module.network.ecs_security_group_id
    migrate_task_family = aws_ecs_task_definition.migrate.family
    api_service         = module.api.service_name
    web_service         = module.web.service_name
  }

  name  = "/${var.project}/${var.env}/deploy/${each.key}"
  type  = "String"
  value = each.value
}
