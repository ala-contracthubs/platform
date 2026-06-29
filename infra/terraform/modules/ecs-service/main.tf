# ===========================================================================
# Generic Fargate service (INF-5) — instantiated once for `api`, once for `web`.
# Rolling deploy + circuit-breaker rollback (INF-22/23). The running image is
# owned by the deploy pipeline (INF-50): the service ignores task_definition and
# desired_count so `aws ecs update-service` and autoscaling are not reverted.
# ===========================================================================

locals {
  name = "${var.project}-${var.env}-${var.app}"
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/${var.project}/${var.env}/${var.app}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_arn
}

resource "aws_ecs_task_definition" "this" {
  family                   = local.name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  runtime_platform {
    operating_system_family = "LINUX"
    # x86_64 to match images built on amd64 GitHub runners. (arm64/Graviton is a
    # later optimization — needs buildx --platform linux/arm64 in CI.)
    cpu_architecture = "X86_64"
  }

  container_definitions = jsonencode([
    {
      name      = var.app
      image     = var.image
      essential = true
      portMappings = [{
        containerPort = var.container_port
        protocol      = "tcp"
      }]
      environment = [for k, v in var.environment : { name = k, value = v }]
      secrets     = [for k, v in var.secrets : { name = k, valueFrom = v }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.this.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = var.app
        }
      }
    }
  ])
}

resource "aws_lb_target_group" "this" {
  name                 = local.name
  port                 = var.container_port
  protocol             = "HTTP"
  vpc_id               = var.vpc_id
  target_type          = "ip"
  deregistration_delay = 30

  health_check {
    path                = var.health_check_path
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

# Host-routes on the origin hostname AND requires the CloudFront secret header.
resource "aws_lb_listener_rule" "this" {
  listener_arn = var.https_listener_arn
  priority     = var.listener_rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }

  condition {
    host_header {
      values = [var.origin_host]
    }
  }

  condition {
    http_header {
      http_header_name = "X-Origin-Verify"
      values           = [var.origin_secret]
    }
  }
}

resource "aws_ecs_service" "this" {
  name            = local.name
  cluster         = var.cluster_arn
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  health_check_grace_period_seconds = 60

  deployment_minimum_healthy_percent = 100 # INF-22
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true # INF-23
    rollback = true
  }

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.this.arn
    container_name   = var.app
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener_rule.this]

  lifecycle {
    # The deploy pipeline owns the running image; autoscaling owns the count.
    ignore_changes = [task_definition, desired_count]
  }
}

# --- Autoscaling (INF-20) --------------------------------------------------
resource "aws_appautoscaling_target" "this" {
  count              = var.autoscaling_enabled ? 1 : 0
  max_capacity       = var.max_count
  min_capacity       = var.min_count
  resource_id        = "service/${var.cluster_name}/${aws_ecs_service.this.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  count              = var.autoscaling_enabled ? 1 : 0
  name               = "${local.name}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.this[0].resource_id
  scalable_dimension = aws_appautoscaling_target.this[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.this[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.cpu_target
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
