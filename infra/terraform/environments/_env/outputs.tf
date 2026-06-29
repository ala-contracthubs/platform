output "web_url" {
  value = module.edge.web_url
}

output "api_url" {
  value = module.edge.api_url
}

output "alb_dns_name" {
  value = module.alb.alb_dns_name
}

output "cluster_name" {
  value = module.cluster.cluster_name
}

output "db_writer_endpoint" {
  value = module.database.cluster_endpoint
}

output "kms_key_arn" {
  value = aws_kms_key.main.arn
}

output "alerts_topic_arn" {
  value = module.observability.sns_topic_arn
}
