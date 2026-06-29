# ===========================================================================
# Account-global resources shared by every environment.
# ===========================================================================

locals {
  apps = ["api", "web"]
}

# ---------------------------------------------------------------------------
# ECR repositories (INF-53..57). One per app, shared across envs so the exact
# digest built+tested on staging is the one promoted to prod.
# ---------------------------------------------------------------------------
resource "aws_ecr_repository" "app" {
  for_each = toset(local.apps)

  name                 = "${var.project}/${each.key}"
  image_tag_mutability = "IMMUTABLE" # INF-54: finance audit trail

  image_scanning_configuration {
    scan_on_push = true # INF-56: basic scan
  }

  encryption_configuration {
    encryption_type = "AES256"
  }
}

# Lifecycle (INF-57): expire sha-* (dev) after N days, untagged after 1 day.
# v* (release) images match no rule and are therefore kept forever (INF-16).
resource "aws_ecr_lifecycle_policy" "app" {
  for_each   = aws_ecr_repository.app
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire dev/staging (sha-*) images after ${var.dev_image_retention_days} days"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["sha-"]
          countType     = "sinceImagePushed"
          countUnit     = "days"
          countNumber   = var.dev_image_retention_days
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Expire untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = { type = "expire" }
      },
    ]
  })
}

# ---------------------------------------------------------------------------
# GitHub OIDC provider + CI roles (INF-47, INF-52). No long-lived AWS keys.
# ---------------------------------------------------------------------------
data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[0].sha1_fingerprint]
}

# Trust policy: any ref in our repo may assume (gating is done at the workflow
# level via GitHub Environment protection). Tighten to `:environment:production`
# to enforce per-env separation at the trust boundary (see TRD §16).
data "aws_iam_policy_document" "gha_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }
  }
}

# Infra pipeline role — broad, because Terraform manages everything. Prod
# applies are gated behind a GitHub Environment approval (INF-47).
# AdministratorAccess is intentionally broad; tighten per TRD §16 hardening.
resource "aws_iam_role" "gha_infra" {
  name               = "${var.project}-gha-infra"
  assume_role_policy = data.aws_iam_policy_document.gha_assume.json
}

resource "aws_iam_role_policy_attachment" "gha_infra_admin" {
  role       = aws_iam_role.gha_infra.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

# App-deploy pipeline role — narrow (INF-52). ECR push + ECS deploy + PassRole
# for the task roles only. Cannot touch networking or the database.
resource "aws_iam_role" "gha_app_deploy" {
  name               = "${var.project}-gha-app-deploy"
  assume_role_policy = data.aws_iam_policy_document.gha_assume.json
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "gha_app_deploy" {
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "EcrPushPull"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:DescribeImages",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
    ]
    resources = [for r in aws_ecr_repository.app : r.arn]
  }

  statement {
    sid    = "EcsDeploy"
    effect = "Allow"
    actions = [
      "ecs:RegisterTaskDefinition",
      "ecs:DeregisterTaskDefinition",
      "ecs:DescribeTaskDefinition",
      "ecs:UpdateService",
      "ecs:DescribeServices",
      "ecs:DescribeTasks",
      "ecs:ListTasks",
      "ecs:RunTask",
    ]
    resources = ["*"] # ECS register/describe are not resource-scopable; run/update are cluster-bound at runtime.
  }

  # Read deploy metadata (cluster, subnets, sg, migrate family) written per-env.
  statement {
    sid       = "ReadDeployParams"
    effect    = "Allow"
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = ["arn:aws:ssm:*:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/*/deploy/*"]
  }

  # Pass only the ECS task roles to ECS (INF-52). Scoped by name pattern.
  statement {
    sid       = "PassEcsRoles"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.project}-*-ecs-*"]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "gha_app_deploy" {
  name   = "deploy"
  role   = aws_iam_role.gha_app_deploy.id
  policy = data.aws_iam_policy_document.gha_app_deploy.json
}

# ---------------------------------------------------------------------------
# Route 53 hosted zone — already exists; referenced, never created (INF-58).
# ---------------------------------------------------------------------------
data "aws_route53_zone" "root" {
  name         = "${var.root_domain}."
  private_zone = false
}
