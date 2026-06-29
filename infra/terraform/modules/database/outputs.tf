output "cluster_identifier" {
  value = aws_rds_cluster.this.cluster_identifier
}

output "cluster_endpoint" {
  value       = aws_rds_cluster.this.endpoint
  description = "Writer endpoint."
}

output "reader_endpoint" {
  value       = aws_rds_cluster.this.reader_endpoint
  description = "Reader endpoint (== writer if no readers)."
}

output "port" {
  value = aws_rds_cluster.this.port
}

output "db_name" {
  value = var.db_name
}

output "master_secret_arn" {
  value       = aws_rds_cluster.this.master_user_secret[0].secret_arn
  description = "RDS-managed master secret (JSON username/password) — used by the migration RunTask (INF-42)."
}

output "app_db_url_secret_arn" {
  value       = aws_secretsmanager_secret.app_db_url.arn
  description = "Full app-user DATABASE_URL — injected into the api task as DATABASE_URL (INF-36)."
}

# Convenience: the secret ARNs this env's execution role must be allowed to read.
output "secret_arns" {
  value = [
    aws_rds_cluster.this.master_user_secret[0].secret_arn,
    aws_secretsmanager_secret.app_db_url.arn,
  ]
}
