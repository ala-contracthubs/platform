output "service_name" {
  value = aws_ecs_service.this.name
}

output "target_group_arn_suffix" {
  value       = aws_lb_target_group.this.arn_suffix
  description = "For CloudWatch ALB/target metric dimensions."
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.this.name
}

output "task_family" {
  value = aws_ecs_task_definition.this.family
}
