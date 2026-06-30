# Contract Hubs — Platform Infrastructure (AWS) — V1 TRD

**Status:** Draft v0.1
**Owner:** Engineering (Ala)
**Last updated:** 2026-06-29
**Related:** `docs/ContractHubs_V1_Platform_PRD.md` (product scope) · `CLAUDE.md` (monorepo conventions)

**Scope of this TRD:** the AWS infrastructure that runs the Contract Hubs `platform` monorepo —
the `api` (NestJS) and `web` (React/Vite) apps — across two environments, plus the Terraform,
networking, data, edge, CI/CD, and observability that surround them. This is a *technical*
requirements document: it specifies **what** the infrastructure must be, not the product
behaviour (that lives in the Platform PRD).

**Out of scope of this TRD:** the `mobile` app deployment (Expo/EAS, separate pipeline), the
application-level logic of any module, and the Wallet/Messaging/Cases domains (their own PRDs).
Items deliberately deferred are listed in [§16 Future / Deferred](#16-future--deferred).

---

## 1. Summary of locked decisions

Every row below was decided explicitly. This table is the quick-reference; the numbered
sections expand each one.

| # | Area | Decision |
|---|------|----------|
| D1 | Region | **`eu-west-2` (London)**. CloudFront ACM certs + WAF live in `us-east-1` (AWS constraint). |
| D2 | Account model | **Single AWS account**, two environments isolated by VPC + naming + Terraform state. |
| D3 | Environments | **`stage`** and **`prod`**. |
| D4 | IaC tool & location | **Terraform**, in this monorepo at **`infra/terraform/`**. |
| D5 | Remote state | **S3 backend + DynamoDB lock**, one bucket + one table, isolated per env by state key. |
| D6 | Compute | **ECS on Fargate** for **both** `api` and `web` (web = nginx serving the Vite build). |
| D7 | Edge | **CloudFront + AWS WAF** in front of both apps, both envs. |
| D8 | Load balancing | **One shared ALB per env**, host-based routing, locked to CloudFront. |
| D9 | Database | **Aurora PostgreSQL 16 (provisioned)** — Multi-AZ writer+reader in prod, single instance in stage. |
| D10 | Secrets | **Secrets Manager** for secrets + plain task env for config; **dedicated least-priv app DB user**; **customer-managed KMS per env**. |
| D11 | Migrations | **One-off ECS `RunTask`** (`prisma migrate deploy`) before each rollout; **backward-compatible-migrations rule**; roll-forward + PITR rollback. |
| D12 | Deploy mechanism | **ECS rolling update**, `100%/200%`, **deployment circuit breaker with auto-rollback**. |
| D13 | CI/CD | **Two GitHub Actions pipelines** (infra Terraform; app deploy), both via **OIDC**, no static keys. |
| D14 | Release model | **Trunk-based**: short-lived branches → PR → merge to **`main`**. Push to **`main` → auto-deploy staging**; stable **`vX.Y.Z` tag on `main` → prod**, deploying the **already-tested digest** (no rebuild). |
| D15 | Images / ECR | Per-app repos, **immutable tags**, `turbo prune` Dockerfiles, **basic scan-on-push**. |
| D16 | Image retention | **Release (`v*`) kept forever**; **dev (`sha-*`) expire 30 days**; untagged expire 1 day. |
| D17 | DNS / TLS | Existing **Route 53** zone (referenced); **per-env explicit-SAN ACM certs**. |
| D18 | Observability | CloudWatch logs (**30d stage / 90d prod**), Container Insights, per-env dashboard, alarms → **SNS email**. Tracing deferred. |
| D19 | WAF | AWS managed groups + **rate-based rules** (OTP abuse); **CommonRuleSet in Count first**, then Block; **no geo restriction**. |

---

## 2. Architecture overview

```
                         Route 53  (contracthubs.com — existing hosted zone)
        ┌──────────────────────────┴──────────────────────────┐
 platform[.stage].contracthubs.com                  api[.stage].contracthubs.com
        │                                                      │
   CloudFront ── WAF (web ACL, per env, us-east-1 scope) ── CloudFront
   (cache hashed assets,                                (caching disabled,
    no-cache index.html)                                 forward auth/cookies)
        └──────────────────────────┬──────────────────────────┘
                                    │  secret origin header (X-Origin-Verify)
                                    │  + CloudFront managed prefix list on ALB SG
                              Shared ALB  (internet-facing, HTTPS:443, host-based rules)
                       ┌────────────┴────────────┐
              platform.* → web target group  api.* → api target group
                    │                            │
          ECS Fargate: web (nginx)     ECS Fargate: api (NestJS)
          private subnets · 0.25/0.5    private subnets · CPU-target autoscale
                                                 │
                                    Aurora PostgreSQL 16 (provisioned)
                                    isolated subnets · writer (+reader in prod)
                                    customer-managed KMS · Secrets Manager
```

Per environment: 1 VPC, 1 shared ALB, 2 CloudFront distributions (web + api), 1 WAF web ACL
(associated to both distributions), 1 ACM SAN cert, 2 ECS services, 1 Aurora cluster.

---

## 3. Region & accounts (D1, D2, D3)

- **INF-1** All data-bearing and compute resources run in **`eu-west-2` (London)**.
- **INF-2** CloudFront distributions, their **ACM certificates, and the WAF web ACLs are created
  in `us-east-1`** — a hard AWS requirement for edge resources. This does not change the data
  region; compute and the database stay in `eu-west-2`.
- **INF-3** A **single AWS account** hosts both environments. Isolation is enforced by separate
  VPCs, resource naming/tagging (`env = stage|prod`), separate Terraform state, and per-env IAM
  roles — **not** by account boundaries. (Account-per-env is the documented future hardening, §16.)
- **INF-4** Every resource is tagged: `Project=contracthubs`, `Env={stage|prod}`,
  `ManagedBy=terraform`, `App={api|web|shared}`.

> **Compliance note (non-blocking):** London hosting a UAE-facing contracts/finance product is
> acceptable unless a specific UAE data-residency obligation applies. To be confirmed with
> whoever owns compliance; it does not block this design.

---

## 4. Repository & Terraform layout (D4)

Terraform lives in-monorepo at `infra/terraform/`. Reusable modules + one root per environment,
plus a one-time `bootstrap/` and an account-global `shared/` stack.

```
infra/terraform/
  bootstrap/              # ONE-TIME, local state: S3 state bucket + DynamoDB lock table
  shared/                 # account-global: ECR repos, GitHub OIDC provider
                          #   (Route 53 zone referenced via data source, not created)
  modules/
    network/              # VPC, public/private/isolated subnets, NAT, IGW, endpoints, SGs
    ecs-cluster/          # Fargate cluster + Container Insights + shared logging
    ecs-service/          # GENERIC Fargate service — reused for api AND web
    database/             # Aurora provisioned cluster + instances + Secrets Manager + KMS
    edge/                 # CloudFront + WAF + ACM (us-east-1 provider alias)
    dns/                  # Route 53 alias records (zone via data source)
    observability/        # log groups, alarms, dashboard, SNS topic + email subscription
    iam/                  # task execution role, task role, app-deploy role, infra role
  environments/
    stage/                # backend.tf · main.tf · stage.tfvars
    prod/                 # backend.tf · main.tf · prod.tfvars
```

- **INF-5** The `ecs-service` module is **generic** and instantiated twice per env (`api`, `web`),
  parameterised by image, container port, CPU/memory, desired/min/max count, host header, and
  health-check path. This keeps the both-on-Fargate symmetry clean.
- **INF-6** Blast radius is contained within the monorepo via **CI path filters** (`infra/**`
  triggers the Terraform pipeline; app paths do not) plus required reviewers on `infra/**`.
- **INF-7** The `shared/` stack publishes outputs (ECR repo URLs, OIDC role ARNs, hosted-zone ID)
  consumed by the env stacks via `terraform_remote_state`.

---

## 5. Remote state (D5)

- **INF-8** Terraform state is stored in a single **S3 bucket** (`contracthubs-tfstate`),
  **versioned**, **KMS-encrypted**, public access blocked.
- **INF-9** State is isolated per stack by **key**: `env/stage/terraform.tfstate`,
  `env/prod/terraform.tfstate`, `shared/terraform.tfstate`.
- **INF-10** A single **DynamoDB table** (`contracthubs-tflock`, key `LockID`, pay-per-request)
  provides state locking, preventing concurrent `apply` corruption.
- **INF-11** The bucket and table are created **once, locally**, by the `bootstrap/` stack
  (chicken-and-egg: the backend must exist before it can be used). Documented as a manual
  one-time step; everything thereafter runs through CI.

---

## 6. Networking (D2)

Per environment, one VPC with three subnet tiers across **2 AZs**.

- **INF-12** Subnet tiers: **public** (ALB, NAT), **private** (Fargate tasks), **isolated**
  (Aurora — no route to the internet).
- **INF-13** CIDRs: **prod `10.0.0.0/16`**, **stage `10.1.0.0/16`** (non-overlapping, to allow
  future peering). Subnets carved as `/20`.
- **INF-14** NAT gateways: **prod = one per AZ (2)**; **stage = single (1)**.
- **INF-15** **S3 gateway endpoint** (free) + **interface VPC endpoints** for ECR (api + dkr),
  Secrets Manager, and CloudWatch Logs — so image pulls and secret reads bypass NAT and stay
  off the public internet.
- **INF-16** Security-group chain:
  - `alb-sg`: ingress 443 from the **CloudFront managed prefix list** only.
  - `ecs-service-sg`: ingress on the container port from `alb-sg` only.
  - `db-sg`: ingress 5432 from `ecs-service-sg` only.
  - `endpoints-sg`: ingress 443 from `ecs-service-sg`.

---

## 7. Compute — ECS / Fargate (D6, D12)

- **INF-17** One **ECS cluster per env**, Fargate launch type, **Container Insights** enabled.
- **INF-18** Two services per env (`api`, `web`), running in **private subnets**, registered to
  the shared ALB.
- **INF-19** Task sizing & scaling:

  | | stage | prod |
  |---|---|---|
  | **api** | 0.5 vCPU / 1 GB, 1 task | 1 vCPU / 2 GB, **min 2 / max 6** |
  | **web** | 0.25 vCPU / 0.5 GB, 1 task | 0.25 vCPU / 0.5 GB, min 2 / max 4 |

- **INF-20** Autoscaling: **target-tracking on CPU at 65%** for prod services. (Optional
  `ALBRequestCountPerTarget` policy on `api` only if traffic proves spiky — not enabled at launch.)
- **INF-21** **prod min = 2 tasks/service** (one per AZ) so an AZ loss or a task replacement
  never drops a service to zero. Stage runs a single task per service.
- **INF-22** Deployment: **rolling update**, `minimumHealthyPercent = 100`,
  `maximumPercent = 200` (new tasks go healthy before old drain — no capacity dip).
- **INF-23** **Deployment circuit breaker with `rollback = true`** — if new tasks fail the ALB
  health check, ECS auto-reverts to the last-good task definition.

---

## 8. Load balancing & edge (D7, D8)

- **INF-24** **One shared, internet-facing ALB per env**, HTTPS:443, **host-based listener rules**:
  `platform[.stage].contracthubs.com → web TG`, `api[.stage].contracthubs.com → api TG`.
- **INF-25** Health checks: target group for `api` checks **`/health`**; `web` checks **`/`**;
  deregistration delay ~30s.
- **INF-26** **The ALB is locked to CloudFront**: CloudFront injects a **secret origin header**
  (`X-Origin-Verify`), and the ALB rejects (403) any request lacking it. Combined with the
  CloudFront-prefix-list SG rule (INF-16), the WAF at the edge cannot be bypassed by hitting the
  ALB directly. (CloudFront **VPC origins** to make the ALB fully private is a documented future
  hardening, §16.)
- **INF-27** **Two CloudFront distributions per env** — one per subdomain:
  - **web (`platform.*`)**: caching **on**; hashed JS/CSS → 1-year immutable TTL; `index.html`
    → no-cache; Brotli/gzip on; methods GET/HEAD/OPTIONS. nginx's SPA fallback returns
    `index.html` (200), so no CloudFront custom-error mapping is required.
  - **api (`api.*`)**: managed **`CachingDisabled`** policy; forward `Authorization`, cookies,
    and query strings to origin; all HTTP methods allowed.
  - Both: **HTTP→HTTPS redirect, min TLS 1.2, HSTS**.
- **INF-28** Cross-origin: `api.` and `platform.` are distinct origins → the API must send
  **CORS** headers for the web origin, and any session/refresh cookie is scoped to
  `.contracthubs.com` with `Secure` + appropriate `SameSite`. (App-layer concern; flagged here
  because the subdomain split makes it mandatory.)

---

## 9. Database — Aurora PostgreSQL (D9)

- **INF-29** **Aurora PostgreSQL 16.x** (matches local Postgres 16), auto minor-version upgrades
  on, off-peak maintenance window.
- **INF-30** Instances (Graviton burstable to start):

  | | stage | prod |
  |---|---|---|
  | writer | 1× `db.t4g.medium` | 1× `db.t4g.large` |
  | reader | none | 1× `db.t4g.large` (2nd AZ) |

  Documented scale path: `t4g.large → r7g.large` (class change + brief failover) when sustained
  load justifies it.
- **INF-31** prod is **Multi-AZ** (reader in the second AZ is the failover target). Aurora storage
  is replicated across 3 AZs at the storage layer regardless — stage's single instance is durable,
  it just lacks fast failover.
- **INF-32** **Encryption at rest (customer-managed KMS) — on, both envs.** **Performance
  Insights — on** (7-day free retention).
- **INF-33** Backups: PITR retention **prod 14 days / stage 7 days**.
- **INF-34** **Deletion protection: prod on** (+ final snapshot on delete); **stage off**
  (disposable).
- **INF-35** Aurora sits in **isolated subnets**, reachable only from `ecs-service-sg`.

---

## 10. Secrets & configuration (D10)

- **INF-36** **Secrets Manager** holds the actual secrets: DB credentials, JWT/session signing
  key, SMS-OTP provider API key. Namespaced `/contracthubs/{env}/*`.
- **INF-37** Non-secret config (`NODE_ENV`, `APP_ENV`, `PORT`, `AWS_REGION`, `LOG_LEVEL`, public
  base URLs) is **plain task-definition env vars** from per-env tfvars. (Graduate to **SSM
  Parameter Store** only if config must change without a redeploy — not at launch.) `APP_ENV`
  (`stage`|`prod`, set from the env's `env` var) is the runtime stage/prod discriminator, since
  `NODE_ENV` is `production` in both; the **api** gates its `/docs` Swagger UI on it — served in
  **stage**, returned `404` in **prod**.
- **INF-38** ECS injects secrets via the task definition `secrets` block; the **task execution
  role** has `secretsmanager:GetSecretValue` + KMS decrypt scoped to **that env's secret ARNs
  only** (prod tasks cannot read stage secrets and vice-versa).
- **INF-39** **Dedicated least-privilege app DB user** for runtime (DML on the app schema only).
  The Aurora **master** (Secrets-Manager-managed, **native rotation**) is used only for admin and
  migrations. A leaked app credential cannot drop the schema.
- **INF-40** **Customer-managed KMS key per env**, used for Aurora, Secrets, and logs (audit
  control).
- **INF-41** Rotation: **native** for the DB master; signing key and SMS key are **manual**
  rotation for now (rotation Lambdas deferred).

---

## 11. Database migrations (D11)

- **INF-42** Migrations run as a **one-off ECS `RunTask`** using the same image with the command
  overridden to **`prisma migrate deploy`**, in private subnets, authenticated as the **master/DDL
  user**.
- **INF-43** Deploy sequence per env: (1) build & push image → (2) RunTask migrate → (3) **abort
  on non-zero exit, don't touch the service** → (4) `update-service` rolling deploy.
- **INF-44** **Backward-compatible-migrations rule (mandatory):** because migrate runs before the
  rollout and old tasks linger during the rolling deploy, every migration must keep the *previous*
  code working against the new schema. Destructive changes use **expand/contract**: add new →
  ship code that uses it → a later release removes the old. No "drop a column the running code
  still reads" in a single deploy.
- **INF-45** Rollback: **roll forward** with a corrective migration is primary; Aurora **PITR /
  snapshot** is the break-glass for catastrophic migrations (why retention is 14 days, INF-33).
- **INF-46** Seeding uses the same RunTask mechanism with a seed command, **stage only** — never
  auto-run on prod.

---

## 12. CI/CD & release model (D13, D14)

Two GitHub Actions pipelines, both authenticating to AWS via **OIDC** (no long-lived keys).

- **INF-47 — Infra pipeline** (trigger: `infra/terraform/**`): PR → `terraform plan` posted as a
  comment; merge to `main` → `apply` to **stage automatically**, **prod behind a manual approval
  gate** (GitHub Environment protection rule + required reviewers).
- **INF-48 — App-deploy pipeline** (trigger: `apps/**` / shared packages):
  - **Push to `main`** (i.e. a merged PR) → build image (tag `sha-<gitsha>`) → push ECR →
    migration RunTask (stage) → rolling deploy to **staging**. Continuous; no tag required.
  - **Release** → cut a **stable `vX.Y.Z` tag** on a `main` commit that has already been
    pushed (and thus built & staged).
  - **Stable `vX.Y.Z` tag** → prod pipeline deploys the **exact digest already built & validated
    for that commit** (no rebuild) → migration RunTask (prod) → rolling deploy to **prod**.
- **INF-49 — Same-digest guarantee:** the commit a `vX.Y.Z` tag points at is a `main` commit, and
  every push to `main` builds & stages its `sha-<gitsha>` image — so the tagged commit is by
  construction the same SHA that was built and tested on staging. (Tagging a commit that was never
  pushed to `main` finds no image and the prod promote fails fast.)
- **INF-50 — Image-tag ownership (the gotcha):** Terraform owns the ECS service/task-def *shape*
  and declares `lifecycle { ignore_changes = [<container image>] }`; the **app-deploy pipeline
  owns the image tag exclusively**. They never fight over the running image.
- **INF-51 — Trigger routing by tag *pattern*** (not "branch the tag is on"): stable `v*` →
  prod. (Pre-release `v*-rc*` tags are reserved for the future "deliberate staging release"
  option but are **not used at launch** — staging is push-driven, INF-48.)
- **INF-52 — Least-privilege roles:** the **infra role** is broad but gated behind prod approval;
  the **app-deploy role** is narrow — ECR push, `ecs run-task/update-service/register-task-
  definition`, `iam:PassRole` for task roles, read only the target env's secrets. It cannot touch
  networking or the database.

---

## 13. Images & ECR (D15, D16)

- **INF-53** One ECR repo per app — `contracthubs/api`, `contracthubs/web` — **shared across both
  envs** (this is what makes digest promotion possible).
- **INF-54** **Tag immutability on** (finance audit trail). Canonical tag = `sha-<gitsha>`;
  releases additionally tagged `v<semver>`.
- **INF-55** Dockerfiles use **`turbo prune --docker`** so each image carries only its app's slice
  of the monorepo. `api` runtime on **`node:24-slim`** (non-root); `web` build runs `vite build`,
  runtime is **`nginx:alpine`** serving `dist/` with `try_files … /index.html` (non-root).
- **INF-56** **Basic ECR scan-on-push** enabled. (Amazon Inspector enhanced scanning deferred, §16.)
- **INF-57** Lifecycle policy per repo:
  - **`v*` (release) images — kept forever** (full rollback + audit trail).
  - **`sha-*` (dev/staging) images — expire 30 days after push.**
  - **Untagged images — expire 1 day after push.**

---

## 14. DNS & TLS (D17)

- **INF-58** `contracthubs.com` is an **existing Route 53 hosted zone**; the `shared/` stack
  **references it via a data source** (does not create or import it). Per-env stacks create their
  own alias records.
- **INF-59** **Per-env ACM certificates in `us-east-1`** (CloudFront constraint), **DNS-validated**,
  explicit SANs:
  - prod cert → `platform.contracthubs.com`, `api.contracthubs.com`
  - stage cert → `platform.stage.contracthubs.com`, `api.stage.contracthubs.com`
- **INF-60** Route 53 **alias A/AAAA records** point each subdomain at its CloudFront distribution.

---

## 15. Observability (D18)

- **INF-61** ECS tasks log to **CloudWatch Logs** (one log group per service per env). NestJS
  emits **structured JSON**; nginx access logs alongside. Retention **30 days stage / 90 days
  prod** (app logs; long-lived audit logging is a separate future concern).
- **INF-62** **Container Insights** (ECS), plus ALB, Aurora, CloudFront, and WAF metrics. One
  **CloudWatch dashboard per env** for the golden signals.
- **INF-63** Alarms → **SNS topic → email** (address is a tfvar, default `ala@contracthubs.com`
  pending a distribution list). prod alarm set:
  - ALB 5xx rate elevated; ALB target p99 latency over threshold
  - ALB healthy-host count < service minimum
  - ECS running count < desired
  - Aurora CPU high / freeable memory low / connections near max / replica lag high
  - **Deployment circuit-breaker rollback fired** (EventBridge → notify)
  - Aurora failover / instance events
  - Stage gets a trimmed subset (5xx, task health, DB CPU).
- **INF-64** Distributed tracing (X-Ray / OpenTelemetry) is **deferred** (§16).

---

## 16. WAF (D19)

- **INF-65** **One WAF web ACL per env** (`us-east-1`, CLOUDFRONT scope), associated to **both**
  that env's CloudFront distributions.
- **INF-66** AWS managed rule groups: **CommonRuleSet**, **KnownBadInputs**,
  **AmazonIpReputationList**, **SQLi**. (PHP/Linux groups intentionally excluded — Node stack.)
- **INF-67** **Rate-based rules** — a general per-IP limit (~2000 req / 5 min) **plus** a tighter
  rate-based rule scoped to the **OTP/auth paths**, to blunt SMS-OTP toll-fraud / OTP-pumping.
  (Per-phone/per-IP throttling at the app layer is the complementary defence — app code, tracked
  in the relevant module, not here.)
- **INF-68** **Rollout mode:** block immediately on KnownBadInputs / IpReputation / SQLi + the
  rate limits; run **CommonRuleSet in Count mode for ~1 week** to catch false positives, then flip
  to Block.
- **INF-69** **No geo restriction** (avoids locking out legitimate roaming / expat / VPN traffic).
- **INF-70** **WAF logging → CloudWatch** for visibility into blocked requests.

---

## 17. Open items / TBDs

| # | Item | Needed before |
|---|------|---------------|
| O1 | Alert email / distribution list address (default `ala@contracthubs.com`) | First alarm wiring |
| O2 | UAE data-residency confirmation (London hosting) | Production go-live |
| O3 | SMS-OTP provider identity (drives the secret + WAF path scoping) | api deploy |
| O4 | Confirm budget ceiling / cost alarm threshold (optional) | Optional |

---

## 18. Future / Deferred

Explicitly *not* in V1 infra, with the trigger that would bring each in:

- **Account-per-environment** (AWS Organizations) — when IAM/blast-radius isolation must be at the
  account boundary (likely as the finance surface grows).
- **CodeDeploy blue/green (canary/linear shifts + alarm-based rollback)** — when canary releases
  are wanted; the backward-compatible-migration rule already covers the mixed-version window today.
- **CloudFront VPC origins** (fully private ALB) — hardening beyond the secret-header + prefix-list lock.
- **Pre-release (`v*-rc*`) staging tags** — if deliberate, tag-gated staging releases are ever
  wanted instead of push-driven continuous staging.
- **Amazon Inspector enhanced image scanning** — continuous CVE scanning beyond basic scan-on-push.
- **Distributed tracing (X-Ray / OTel)** — when request-level traces are needed.
- **Aurora `r7g` class upgrade** — when sustained load outgrows `t4g`.
- **Secrets rotation Lambdas** for the signing/SMS keys — beyond the manual rotation at launch.
- **`mobile` app delivery pipeline** (Expo/EAS) — separate from this web/api infra.
- **Long-lived audit logging** distinct from 30/90-day operational app logs.
```

