# ===========================================================================
# Public ACM cert (us-east-1, INF-59) + 2 CloudFront distributions (INF-27)
# + public DNS records (INF-60).
#
# Host-header note: the API uses the managed "AllViewerExceptHostHeader" origin
# request policy so it forwards Authorization/cookies/query strings but lets
# CloudFront send Host = origin hostname — which is exactly what the ALB
# host-routes on. CachingOptimized (web) forwards no headers, same effect.
# ===========================================================================

resource "aws_acm_certificate" "public" {
  provider                  = aws.us_east_1
  domain_name               = var.api_public_domain
  subject_alternative_names = [var.web_public_domain]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.public.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = var.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "public" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.public.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# --- Managed cache / origin-request policies -------------------------------
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_no_host" {
  name = "Managed-AllViewerExceptHostHeader"
}

locals {
  viewer_cert_arn = aws_acm_certificate_validation.public.certificate_arn
}

# --- web distribution (INF-27) ---------------------------------------------
resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project}-${var.env}-web"
  aliases             = [var.web_public_domain]
  default_root_object = "index.html"
  web_acl_id          = aws_wafv2_web_acl.this.arn
  price_class         = "PriceClass_100"

  origin {
    domain_name = var.web_origin_domain
    origin_id   = "alb-web"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Origin-Verify"
      value = var.origin_secret
    }
  }

  default_cache_behavior {
    target_origin_id       = "alb-web"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
  }

  # index.html must not be cached so deploys are picked up immediately (INF-27).
  ordered_cache_behavior {
    path_pattern           = "/index.html"
    target_origin_id       = "alb-web"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.disabled.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none" # INF-69
    }
  }

  viewer_certificate {
    acm_certificate_arn      = local.viewer_cert_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# --- api distribution (INF-27) ---------------------------------------------
resource "aws_cloudfront_distribution" "api" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.project}-${var.env}-api"
  aliases         = [var.api_public_domain]
  web_acl_id      = aws_wafv2_web_acl.this.arn
  price_class     = "PriceClass_100"

  origin {
    domain_name = var.api_origin_domain
    origin_id   = "alb-api"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Origin-Verify"
      value = var.origin_secret
    }
  }

  default_cache_behavior {
    target_origin_id         = "alb-api"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    cache_policy_id          = data.aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_no_host.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = local.viewer_cert_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# --- Public DNS (alias -> CloudFront) (INF-60) -----------------------------
resource "aws_route53_record" "web" {
  for_each = toset(["A", "AAAA"])
  zone_id  = var.zone_id
  name     = var.web_public_domain
  type     = each.key

  alias {
    name                   = aws_cloudfront_distribution.web.domain_name
    zone_id                = aws_cloudfront_distribution.web.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "api" {
  for_each = toset(["A", "AAAA"])
  zone_id  = var.zone_id
  name     = var.api_public_domain
  type     = each.key

  alias {
    name                   = aws_cloudfront_distribution.api.domain_name
    zone_id                = aws_cloudfront_distribution.api.hosted_zone_id
    evaluate_target_health = false
  }
}
