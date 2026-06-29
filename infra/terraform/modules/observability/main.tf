# ===========================================================================
# Alarms + dashboard (INF-62/63). Log groups live with each service
# (modules/ecs-service). This module is the alerting + dashboard layer.
# ===========================================================================

locals {
  name        = "${var.project}-${var.env}"
  prod_count  = var.is_prod ? 1 : 0
  prod_alarms = var.is_prod ? var.services : {}
}

# --- SNS topic -> email (INF-63) -------------------------------------------
resource "aws_sns_topic" "alerts" {
  name = "${local.name}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Allow EventBridge + RDS to publish to the topic.
data "aws_iam_policy_document" "sns" {
  statement {
    sid       = "AllowServicePublish"
    effect    = "Allow"
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.alerts.arn]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com", "rds.amazonaws.com", "cloudwatch.amazonaws.com"]
    }
  }
}

resource "aws_sns_topic_policy" "alerts" {
  arn    = aws_sns_topic.alerts.arn
  policy = data.aws_iam_policy_document.sns.json
}

# --- Always-on alarms (both envs) ------------------------------------------
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name}-alb-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  period              = 300
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  statistic           = "Sum"
  threshold           = 10
  dimensions          = { LoadBalancer = var.alb_arn_suffix }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "${local.name}-aurora-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  period              = 300
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  statistic           = "Average"
  threshold           = 80
  dimensions          = { DBClusterIdentifier = var.db_cluster_identifier }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

# ECS running task count == 0 (service down). Container Insights metric.
resource "aws_cloudwatch_metric_alarm" "ecs_running" {
  for_each            = var.services
  alarm_name          = "${local.name}-${each.key}-tasks-down"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  period              = 60
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  statistic           = "Average"
  threshold           = 1
  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = each.value.service_name
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "breaching"
}

# --- Prod-only alarms ------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  count               = local.prod_count
  alarm_name          = "${local.name}-alb-p99-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  period              = 300
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  extended_statistic  = "p99"
  threshold           = var.latency_p99_threshold
  dimensions          = { LoadBalancer = var.alb_arn_suffix }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "healthy_hosts" {
  for_each            = local.prod_alarms
  alarm_name          = "${local.name}-${each.key}-healthy-hosts"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  period              = 60
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  statistic           = "Minimum"
  threshold           = 1
  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = each.value.tg_arn_suffix
  }
  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "breaching"
}

resource "aws_cloudwatch_metric_alarm" "db_memory" {
  count               = local.prod_count
  alarm_name          = "${local.name}-aurora-freeable-memory"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  period              = 300
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  statistic           = "Average"
  threshold           = 536870912 # 512 MiB
  dimensions          = { DBClusterIdentifier = var.db_cluster_identifier }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "db_connections" {
  count               = local.prod_count
  alarm_name          = "${local.name}-aurora-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  period              = 300
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  statistic           = "Average"
  threshold           = 180
  dimensions          = { DBClusterIdentifier = var.db_cluster_identifier }
  alarm_actions       = [aws_sns_topic.alerts.arn]
  treat_missing_data  = "notBreaching"
}

# Deployment circuit-breaker rollback -> SNS (INF-63).
resource "aws_cloudwatch_event_rule" "deploy_failed" {
  name        = "${local.name}-ecs-deploy-failed"
  description = "ECS deployment failed (circuit-breaker rollback)"
  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Deployment State Change"]
    detail = {
      eventName = ["SERVICE_DEPLOYMENT_FAILED"]
    }
  })
}

resource "aws_cloudwatch_event_target" "deploy_failed_sns" {
  rule      = aws_cloudwatch_event_rule.deploy_failed.name
  target_id = "sns"
  arn       = aws_sns_topic.alerts.arn
}

# Aurora failover / failure events -> SNS (prod).
resource "aws_db_event_subscription" "aurora" {
  count            = local.prod_count
  name             = "${local.name}-aurora-events"
  sns_topic        = aws_sns_topic.alerts.arn
  source_type      = "db-cluster"
  source_ids       = [var.db_cluster_identifier]
  event_categories = ["failover", "failure", "maintenance"]
}
