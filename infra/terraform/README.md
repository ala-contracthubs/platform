# Contract Hubs — Infrastructure (Terraform)

Implements `docs/ContractHubs_V1_Infrastructure_TRD.md`. AWS, region **`eu-west-2` (London)**,
**single account**, two environments (**`stage`**, **`prod`**), all on **ECS Fargate** behind
**CloudFront + WAF**, with **Aurora PostgreSQL** and a **shared ALB** per env.

## Layout

```
infra/terraform/
  bootstrap/        ONE-TIME, local state — creates the S3 state bucket + DynamoDB lock table.
  shared/           Account-global — ECR repos, GitHub OIDC provider + CI roles, Route 53 zone lookup.
  modules/          Reusable building blocks (see below).
  environments/
    stage/          Stage root — calls the modules with stage.tfvars.
    prod/           Prod root  — calls the modules with prod.tfvars.
```

### Modules

| Module | Responsibility |
|--------|----------------|
| `network` | VPC, public/private/isolated subnets ×2 AZ, NAT, IGW, VPC endpoints, security-group chain |
| `iam` | ECS task execution role + task role (per-env, secret-scoped) |
| `ecs-cluster` | Fargate cluster + Container Insights |
| `database` | Aurora PostgreSQL 16 (provisioned), customer-managed KMS, Secrets Manager creds |
| `alb` | Shared internet-facing ALB, regional ACM cert, HTTPS listener, origin DNS records |
| `ecs-service` | **Generic** Fargate service (used for both `api` and `web`): task def, service, target group, ALB rule, autoscaling |
| `edge` | CloudFront ×2 (web + api), WAF web ACL, public ACM cert (us-east-1), public DNS records |
| `observability` | Log groups, CloudWatch alarms, dashboard, SNS → email |

> **DNS note:** records live with the resource they alias — origin records in `alb`, public
> records in `edge` — so there is no standalone `dns` module (a small deviation from the TRD's
> module list, for a cleaner dependency seam).

## Bring-up order (first time)

```bash
# 0. One-time: create the remote-state backend (uses LOCAL state).
cd infra/terraform/bootstrap
terraform init && terraform apply           # creates contracthubs-tfstate bucket + contracthubs-tflock table

# 1. Account-global resources (ECR, OIDC, roles).
cd ../shared
terraform init && terraform apply

# 2. Per environment.
cd ../environments/stage
terraform init && terraform apply -var-file=stage.tfvars

cd ../prod
terraform init && terraform apply -var-file=prod.tfvars
```

After bootstrap, everything runs through GitHub Actions (`.github/workflows/infra.yml`) via OIDC —
`plan` on PR, `apply` to stage on merge to `main`, prod behind a manual environment gate.

## Conventions

- Resources are named `contracthubs-<env>-<thing>` and tagged
  `Project=contracthubs`, `Env=<env>`, `ManagedBy=terraform`, `App=<api|web|shared>`.
- Region `eu-west-2`; CloudFront ACM cert + WAF are created in `us-east-1` via an aliased provider.
- State: one S3 bucket + one DynamoDB lock table, isolated per stack by key
  (`shared/…`, `env/stage/…`, `env/prod/…`).
- `*.tfvars` are committed and contain **no secrets** (secrets live in Secrets Manager).

## Fill-in values (see TRD §17 open items)

`environments/*/` tfvars carry per-env knobs. Confirm these before a real apply:
`alert_email`, the SMS-OTP provider secret (seeded empty, populated out-of-band), and the
`github_repo` (defaulted to `ala-contracthubs/platform`).
