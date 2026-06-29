# Per-env golden-signals dashboard (INF-62).
resource "aws_cloudwatch_dashboard" "this" {
  dashboard_name = local.name

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ALB requests & 5xx"
          region = var.region
          view   = "timeSeries"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum" }],
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum" }],
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ALB latency (p50/p99)"
          region = var.region
          view   = "timeSeries"
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, { stat = "p50" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, { stat = "p99" }],
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "ECS CPU/Memory utilization"
          region = var.region
          view   = "timeSeries"
          # concat (NOT flatten — flatten recurses and breaks each metric line):
          # one metric-array per service per metric.
          metrics = concat(
            [for k, s in var.services : ["AWS/ECS", "CPUUtilization", "ClusterName", var.cluster_name, "ServiceName", s.service_name, { stat = "Average" }]],
            [for k, s in var.services : ["AWS/ECS", "MemoryUtilization", "ClusterName", var.cluster_name, "ServiceName", s.service_name, { stat = "Average" }]],
          )
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Aurora CPU & connections"
          region = var.region
          view   = "timeSeries"
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBClusterIdentifier", var.db_cluster_identifier, { stat = "Average" }],
            ["AWS/RDS", "DatabaseConnections", "DBClusterIdentifier", var.db_cluster_identifier, { stat = "Average" }],
          ]
        }
      },
    ]
  })
}
