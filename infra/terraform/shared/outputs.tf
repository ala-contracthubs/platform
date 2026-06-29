output "ecr_repository_urls" {
  value       = { for k, r in aws_ecr_repository.app : k => r.repository_url }
  description = "Map app -> ECR repository URL (e.g. api -> <acct>.dkr.ecr.eu-west-2.amazonaws.com/contracthubs/api)."
}

output "ecr_repository_arns" {
  value       = { for k, r in aws_ecr_repository.app : k => r.arn }
  description = "Map app -> ECR repository ARN."
}

output "github_oidc_provider_arn" {
  value       = aws_iam_openid_connect_provider.github.arn
  description = "GitHub Actions OIDC provider ARN."
}

output "gha_infra_role_arn" {
  value       = aws_iam_role.gha_infra.arn
  description = "Role assumed by the infra (Terraform) pipeline."
}

output "gha_app_deploy_role_arn" {
  value       = aws_iam_role.gha_app_deploy.arn
  description = "Role assumed by the app-deploy pipeline."
}

output "route53_zone_id" {
  value       = data.aws_route53_zone.root.zone_id
  description = "Hosted zone ID for the root domain."
}

output "route53_zone_name" {
  value       = data.aws_route53_zone.root.name
  description = "Hosted zone name (with trailing dot)."
}
