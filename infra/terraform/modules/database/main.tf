# ===========================================================================
# Aurora PostgreSQL 16, provisioned (INF-29..41).
#   - Managed master password (native rotation, INF-41) — break-glass + migrations.
#   - Dedicated app user (INF-39) — runtime DML. Its DATABASE_URL is published as
#     a secret here; the Postgres role itself is created by a one-time bootstrap
#     migration (see modules/database/README.md) because the DB is in isolated
#     subnets and Terraform cannot reach it to run SQL.
# ===========================================================================

locals {
  name = "${var.project}-${var.env}"
}

resource "aws_db_subnet_group" "this" {
  name       = "${local.name}-aurora"
  subnet_ids = var.isolated_subnet_ids
  tags       = { Name = "${local.name}-aurora" }
}

resource "aws_rds_cluster" "this" {
  cluster_identifier = "${local.name}-aurora"
  engine             = "aurora-postgresql"
  engine_version     = var.engine_version
  database_name      = var.db_name

  master_username               = var.master_username
  manage_master_user_password   = true # RDS-managed secret + native rotation (INF-41)
  master_user_secret_kms_key_id = var.kms_key_arn

  db_subnet_group_name   = aws_db_subnet_group.this.name
  vpc_security_group_ids = [var.db_security_group_id]

  storage_encrypted = true
  kms_key_id        = var.kms_key_arn

  backup_retention_period      = var.backup_retention_days
  preferred_backup_window      = "02:00-03:00"
  preferred_maintenance_window = "sun:03:30-sun:04:30"

  deletion_protection       = var.deletion_protection
  skip_final_snapshot       = !var.deletion_protection
  final_snapshot_identifier = var.deletion_protection ? "${local.name}-aurora-final" : null

  apply_immediately = false
}

resource "aws_rds_cluster_instance" "this" {
  count              = 1 + var.reader_count # 1 writer + N readers
  identifier         = "${local.name}-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.this.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.this.engine
  engine_version     = aws_rds_cluster.this.engine_version

  performance_insights_enabled    = true
  performance_insights_kms_key_id = var.kms_key_arn
  auto_minor_version_upgrade      = true
}

# --- App-user runtime credentials (INF-36/39) ------------------------------
# URL-safe charset so no percent-encoding is needed in the connection string.
resource "random_password" "app" {
  length           = 32
  special          = true
  override_special = "-_"
}

locals {
  app_database_url = "postgresql://${var.app_username}:${random_password.app.result}@${aws_rds_cluster.this.endpoint}:${aws_rds_cluster.this.port}/${var.db_name}?schema=public&sslmode=require"
}

resource "aws_secretsmanager_secret" "app_db_url" {
  name                    = "/${var.project}/${var.env}/app/database-url"
  kms_key_id              = var.kms_key_arn
  recovery_window_in_days = 0 # ease re-apply; raise for prod hardening
}

resource "aws_secretsmanager_secret_version" "app_db_url" {
  secret_id     = aws_secretsmanager_secret.app_db_url.id
  secret_string = local.app_database_url
}
