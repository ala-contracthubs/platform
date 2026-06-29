output "web_distribution_id" {
  value = aws_cloudfront_distribution.web.id
}

output "api_distribution_id" {
  value = aws_cloudfront_distribution.api.id
}

output "web_url" {
  value = "https://${var.web_public_domain}"
}

output "api_url" {
  value = "https://${var.api_public_domain}"
}

output "web_acl_arn" {
  value = aws_wafv2_web_acl.this.arn
}
