# Contract Hubs — Engineering Context (for coding agents)

Project brief for the `platform` monorepo. Pair with `CONTEXT.md` (ubiquitous language —
source of truth for terms) and the PRDs / ADRs listed below.

## What we're building

A platform where **Module 0 (the backbone)** owns identity, Cases, documents, payments,
Wallets, the ledger, SLAs, dashboards and notifications **once**. Each service (POA first,
then Golden Visa, Legal, …) plugs in as a **Module** via a **Manifest**. The backbone never
depends on a Module; a Module only talks to the backbone through its declared Manifest contract.

## Start here — every task, before writing code

1. **Read the relevant PRD(s) end to end.** Don't skim. Sources of truth:
   - `ContractHubs_V1_Platform_PRD.md` — platform scope
   - `ContractHubs_POA_Module_PRD.md` — POA module (first Module)
   - `ContractHubs_Wallet_Finance_PRD.md` — Wallet / ledger / fees
   - `ContractHubs_Messaging_Notification_PRD_v0.4.md` — messaging & notifications
   - `POA-client-protoype.md` — client flows
2. **Understand the current domain model and the change you're making.** Re-read the affected
   parts of `CONTEXT.md`; use its exact terms. If the task changes the model or language,
   flag it and update `CONTEXT.md` + add an ADR in `docs/adr/` rather than inventing terms.
3. **Extract requirements, acceptance criteria, test cases and user flows** from the PRD for
   the slice you're building. List them explicitly before coding.
4. **Write the failing tests first (TDD).** Turn each requirement, edge case and user-flow
   step into a test using the ubiquitous language in its name and assertions. Only then write
   code to make them pass, then refactor.

Do not start implementation until steps 1–4 are done. If a PRD is silent or contradictory,
raise it as an open question — don't guess.

## Engineering principles (non-negotiable)

### Test-Driven Development
- **Red → green → refactor.** Failing test first for all domain and application logic.
- **Test pyramid:** many fast domain unit tests (no I/O, no framework); fewer use-case tests
  (mock the ports); few integration tests (real DB/adapters); minimal e2e.
- **Test first, exhaustively:** the double-entry ledger (every posting balances; idempotency
  on money-moving commands and the Stripe webhook), Fee Model math (Base Fee split, Top-up
  Cap, Settlement Mode), Case state machine (Global/Sub-status transitions, Principal-Only
  Actions), SLA Timer (pause on `Awaiting Client`), and the Clean-state Gate.
- **Module Manifests get contract tests** so a Module can't register an invalid contract.

### Domain-Driven Design
- **`CONTEXT.md` is the ubiquitous language.** Use those exact terms in code, types, tests,
  APIs (`Individual`, `Case`, `Wallet`, `Partner Share`, `Active Role Context`). Never use a
  term from an "Avoid" list (no `User`, `Account`, `Vendor`, `Markup`, …).
- **Bounded contexts** = backbone core domains + each Module. A Module integrates only through
  its Manifest contract and domain events — never by reaching into another Module's internals.
- **Aggregates guard invariants.** `Case`, `Wallet`, `Business`, `Notary office` are aggregate
  roots; all changes go through the root (e.g. a Wallet's `Available + Pending` always
  reconciles to its ledger postings; one Partner per Case).
- **Rich domain model.** Rules live in entities/value objects/domain services, not controllers.
  Money/AED amounts, Top-up Caps, SLA durations etc. are value objects, not raw numbers.
- **Domain events** (`CasePaid`, `DraftApproved`, `SessionCompleted`, …) are first-class and
  drive cross-context reactions via the outbox + EventBridge.

### Clean / Hexagonal Architecture
- **Dependencies point inward.** `domain` knows nothing. `application` (use cases) depends
  only on `domain`. `infrastructure` (controllers, repositories, Stripe/UAE Pass/S3 adapters)
  depends on inner layers. The domain must not import NestJS, the ORM, or AWS SDKs.
- **Ports & adapters.** Inner layers declare ports (`WalletRepository`, `PaymentProvider`,
  `IdentityProvider`, `DocumentStore`); infrastructure provides swappable adapters.
- **Per-Module layering.** Every NestJS module is internally `domain / application /
  infrastructure`, same folder structure throughout.
- **Use cases are the unit of application logic** — one class per command/query; thin
  controllers translate HTTP ↔ use case.

## Stack (agreed decisions, compressed)

- **Backend:** Node 20 LTS, TypeScript strict, **NestJS** modular monolith — one deployable,
  strict Module boundaries enforced by ESLint import rules. Ledger stays a single strongly
  consistent store; never distribute money across services.
- **Web:** Vite + React SPA (TanStack Router + Query), built to static files on S3 + CloudFront.
  All role dashboards. No SSR.
- **Mobile:** Expo managed workflow, EAS dev builds from day one (UAE Pass + KYC need native).
- **Shared (not UI):** TS domain types, OpenAPI-generated client, zod schemas, design tokens.
- **DB:** Aurora PostgreSQL (Multi-AZ). Append-only double-entry ledger; balances derived from
  postings; idempotency keys on every money-moving command and the Stripe webhook.
- **Cache:** ElastiCache Redis (sessions, hot config, rate limits, Slot booking locks).
- **Messaging:** SQS (+ DLQ), EventBridge (domain events) + Scheduler (SLA, no-show). Outbox pattern.
- **Identity/KYC:** custom in-house NestJS Auth (no Cognito) on audited libs (Passport, argon2,
  `jose`, vetted OIDC client). UAE Pass (OIDC → Emirates ID) + mobile OTP; passport IDV vendor
  for KYC. Auth backend behind an `IdentityProvider` port. Authorization lives in the domain.
- **Payments:** Stripe as PSP only; Wallet/ledger/settlement in-house. Local acquirer behind a
  payment-provider interface as fallback.
- **Storage:** S3 + KMS for POA Drafts (versioned) and immutable Final POAs; pre-signed URLs
  gated on Active Role Context.
- **Region:** AWS me-central-1, Multi-AZ. **IaC:** separate `infra` repo (Terraform/CDK).

## Repository layout (`platform`)

pnpm workspaces + Turborepo.

```
apps/      api/ (NestJS: core backbone + modules/poa)  web/ (Vite SPA)  mobile/ (Expo)
packages/  types/  api-client/  validation/  ui-tokens/  config/ (tsconfig + ESLint boundaries)
```

## Conventions

- Lowercase-hyphen names. Org `contracthubs` → repos `contracthubs/platform`, `contracthubs/infra`.
- REST + OpenAPI; generate the TS client into `packages/api-client`.
- Module boundary rule: a Module imports backbone interfaces only — never another Module.
  Enforced by ESLint import boundaries in `packages/config`.

## ADRs (`docs/adr/`)

0001 generalised fee models · 0002 partner credit in cash-out · 0003 no platform wallet
bookkeeping accounts · 0004 POA video stack (Microsoft Teams). Read the relevant ADR before
touching fees, payouts, or video.
