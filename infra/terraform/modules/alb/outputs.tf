output "alb_arn" {
  value = aws_lb.this.arn
}

output "alb_arn_suffix" {
  value       = aws_lb.this.arn_suffix
  description = "For CloudWatch ALB metric dimensions."
}

output "alb_dns_name" {
  value = aws_lb.this.dns_name
}

output "https_listener_arn" {
  value = aws_lb_listener.https.arn
}
