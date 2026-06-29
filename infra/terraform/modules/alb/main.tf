# ===========================================================================
# Shared internet-facing ALB (INF-24/26). End-to-end TLS: CloudFront connects
# over HTTPS to internal *-origin hostnames that resolve to this ALB; the ALB
# host-routes on those origin hostnames (set by CloudFront by default, no Host
# forwarding needed) and requires the X-Origin-Verify secret header. Default
# action is 403 so anything else (incl. direct hits) is rejected.
# ===========================================================================

locals {
  name = "${var.project}-${var.env}"
}

resource "aws_lb" "this" {
  name               = "${local.name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids
  tags               = { Name = "${local.name}-alb" }
}

# --- Regional ACM cert for the ALB origin hostnames ------------------------
resource "aws_acm_certificate" "origin" {
  domain_name               = var.origin_domains[0]
  subject_alternative_names = slice(var.origin_domains, 1, length(var.origin_domains))
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.origin.domain_validation_options : dvo.domain_name => {
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

resource "aws_acm_certificate_validation" "origin" {
  certificate_arn         = aws_acm_certificate.origin.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# --- HTTPS listener (default 403; per-service rules added by ecs-service) ---
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.origin.certificate_arn

  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      message_body = "Forbidden"
      status_code  = "403"
    }
  }
}

# --- Origin DNS records (alias -> ALB) -------------------------------------
resource "aws_route53_record" "origin" {
  for_each = toset(var.origin_domains)
  zone_id  = var.zone_id
  name     = each.key
  type     = "A"

  alias {
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
    evaluate_target_health = true
  }
}
