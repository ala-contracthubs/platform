# ===========================================================================
# WAF web ACL (INF-65..70). CLOUDFRONT scope => must live in us-east-1.
# Associated to both distributions via their web_acl_id.
# ===========================================================================

locals {
  name = "${var.project}-${var.env}"
}

resource "aws_wafv2_web_acl" "this" {
  provider = aws.us_east_1
  name     = "${local.name}-edge"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # --- AWS managed groups (INF-66): block on high-confidence groups ---------
  rule {
    name     = "AmazonIpReputationList"
    priority = 1
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-ip-reputation"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "KnownBadInputs"
    priority = 2
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-known-bad-inputs"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "SQLi"
    priority = 3
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-sqli"
      sampled_requests_enabled   = true
    }
  }

  # CommonRuleSet — Count first (INF-68), flip to Block by setting
  # count_common_ruleset = false once false positives are reviewed.
  rule {
    name     = "CommonRuleSet"
    priority = 4
    override_action {
      dynamic "count" {
        for_each = var.count_common_ruleset ? [1] : []
        content {}
      }
      dynamic "none" {
        for_each = var.count_common_ruleset ? [] : [1]
        content {}
      }
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-common"
      sampled_requests_enabled   = true
    }
  }

  # --- Rate-based rules (INF-67) --------------------------------------------
  rule {
    name     = "RateLimitGeneral"
    priority = 5
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-rate-general"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitAuth"
    priority = 6
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = var.otp_rate_limit
        aggregate_key_type = "IP"
        scope_down_statement {
          byte_match_statement {
            search_string         = "/auth"
            positional_constraint = "STARTS_WITH"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
          }
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-rate-auth"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name}-edge"
    sampled_requests_enabled   = true
  }
}

# WAF logging -> CloudWatch (INF-70). Group name MUST start with aws-waf-logs-.
resource "aws_cloudwatch_log_group" "waf" {
  provider          = aws.us_east_1
  name              = "aws-waf-logs-${local.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_wafv2_web_acl_logging_configuration" "this" {
  provider                = aws.us_east_1
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]
  resource_arn            = aws_wafv2_web_acl.this.arn
}
