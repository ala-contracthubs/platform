# Contract Hubs — Platform Architecture

This is the canonical layering + bounded-context + boundary-rules guide for the `platform`
monorepo. It pairs with [`CONTEXT.md`](./CONTEXT.md) (ubiquitous language — the source of truth
for terms) and the PRDs in [`prd/`](./prd). The folder tree was derived directly from the PRDs;
this document explains _why_ it is shaped the way it is and which rules are mechanically enforced.

> Structure only. No domain/application/infrastructure logic ships yet — every leaf is a
> `.gitkeep` or a README. Follow TDD (red → green → refactor) when filling it in (see `CLAUDE.md`).

## 1. The big picture

- **NestJS modular monolith**, one deployable: `apps/api`. It contains the **backbone (Module 0)**
  under `src/core/` and the **first Module (POA)** under `src/modules/poa/`.
- **Web**: `apps/web` — Vite + React SPA (TanStack Router + Query), static files on S3 + CloudFront.
- **Mobile**: `apps/mobile` — Expo managed workflow, EAS dev builds from day one.
- **Shared packages**: `packages/{types,validation,api-client,ui-tokens,config}`.
- pnpm workspaces + Turborepo. Region: AWS `me-central-1`, Multi-AZ. Aurora PostgreSQL, Redis,
  SQS/EventBridge, Stripe, S3 + KMS, UAE Pass OIDC.

## 2. Hexagonal layering (every bounded context, same shape)

```
<context>/
  domain/          entities · value-objects · aggregates · events · services · ports · errors
  application/     commands · queries · ports · dto · mappers
  infrastructure/  http · persistence · adapters · config · <context>.module.ts
```

**Dependencies point inward.** `domain` knows nothing; `application` depends only on `domain`;
`infrastructure` depends on the inner layers and wires NestJS.

### The single port-placement rule

- `domain/ports` holds **repository ports only** (`XRepository` interfaces).
- **All** external-service / I/O / scheduler / clock / publisher / subscriber / query ports live
  in `application/ports` (`PaymentProvider`, `IdentityProvider`, `DocumentStore`, OCR/LLM
  providers, `SchedulerPort`, `ClockPort`, every `*Publisher`/`*Subscriber`/`*Query`).
- `domain/**` may import **only** the shared **kernel** — never NestJS, an ORM, an AWS SDK,
  `shared/platform`, or `shared/audit`.
- **Aggregates record domain events** via the kernel `AggregateRoot`; they never _publish_.
  `DomainEventPublisher`/`OutboxRepository`/`AuditLogPublisher` are application/infrastructure
  ports — audit writes are an event-handler responsibility.
- **Read models / projections** (e.g. wallet balance, `MyPoas`, dashboards) live in
  `application/queries` + `infrastructure/persistence` — they are **not** aggregates.

## 3. Backbone bounded contexts (`apps/api/src/core`)

| Context | Owns |
| --- | --- |
| `identity` | Authentication only — the `Individual` aggregate, mobile+OTP / UAE Pass registration, sessions, Canonical Identifier. |
| `verification` | The `Verification Status` state machine + the `requireVerified()` Transaction gate, passport OCR, manual review. |
| `roles-and-access` | Authorization — Roles, grants, the `Active Role Context`, the `PolicyEvaluator`, Platform-Admin exclusivity. |
| `businesses-and-memberships` | The `Business` aggregate, provisioning, `Membership` by invite+acceptance, the **Clean-state Gate**. |
| `case-lifecycle` | The `Case` aggregate + the platform-owned **Global Status** machine, single-Partner assignment, the declarative module-workflow seam. |
| `documents` | A **generic** document primitive (the only S3+KMS store): versioned, encrypted, pre-signed, generic `markImmutable()`. Knows nothing of POA. |
| `finance` | The whole financial backbone — see §5. |
| `sla` | The `SLA Timer` primitive: business-hours accrual, pause on `Awaiting Client`, breach escalation. |
| `notifications` | The notification backbone — trigger registry, Notification Center, the **sole** delivery cascade, preferences, storage quota. |
| `case-thread` | The per-Case conversation; owns only the **urgent flag** + acknowledgement, never the delivery cascade. |
| `module-registry` | The module framework — registers each **Module Manifest**, two-level enable/disable, the declarative workflow contract, contract tests. |
| `zoho-sync` | One-way Case sync to Zoho (CH is the System of Record). |
| `platform-admin` | A thin HTTP surface owning only `AdminActionLog`; invokes other contexts' **published use-cases**, not bespoke internal ports. |

Each context folder carries a README with its aggregates, value objects, domain events, ports,
and adapters (generated from the PRDs).

## 4. The POA Module (`apps/api/src/modules/poa`)

13 subdomains: `poa-case-workflow` (aggregate root `PoaCase` + the 17-step Sub-status table),
`poa-intake`, `poa-documents`, `poa-drafting`, `notary-office`, `notary-scheduling`,
`poa-video-session`, `session-completion`, `no-show-reschedule`, `notary-rejection`,
`poa-payment-addons`, `notary-internal-notes`, and the read-model `poa-dashboards-metrics`.

The Module talks to the backbone **only** through ports / the Manifest contract:

- `PoaCase` references the backbone `Case` by **`CaseId`** (id, never object reference) and drives
  Global Status + Notary-office (Partner) assignment **only** through the case-lifecycle port.
- All document bytes (Drafts, Final POA) go through the backbone `DocumentStore` port — POA holds
  **zero** AWS-SDK imports and decides _when_ to `markImmutable()`.
- `NotaryOfficePoaProfile` is a **separate** POA aggregate keyed by `BusinessId`; it reads the
  `Business` via `BusinessLookupPort` and never writes the backbone Wallet (Partner Share lands via
  the finance `CasePaid` reaction).
- The POA Sub-status transition table lives in `poa-case-workflow/domain`; module side-effects run
  in the module via `PoaWorkflowStateMachineAdapter` implementing the backbone
  `ModuleWorkflowEffectPort` (wired at the composition root).

## 5. Finance — one context, seven anti-corruption-bounded subdomains

`core/finance` is one bounded context with one `finance.module.ts`, but its subdomains are true
internal contexts with hard sub-boundaries:

- **`ledger`** — the single strongly-consistent **append-only double-entry** store + the four named
  Bookkeeping Accounts. The **only** posting writer and the **only** importer of the postings
  persistence adapter. Exposes `LedgerWritePort.commit(balancedBatch, idempotencyKey)` (idempotent).
- **`wallet`** — the `Wallet` aggregate; `Available + Pending` is **derived** from postings via a
  balance read model. Publishes `WalletBalanceQuery`.
- **`fee-model`** — Fixed/Tiered/Percentage Fee Models, Settlement Mode, Base Fee split, Top-up + Cap.
- **`payments`** — Stripe-as-PSP behind `PaymentProvider`, idempotent webhook, refunds, client credit.
- **`fx-settlement`** — deferred Settlement Mode (records only the accrual at payment; the full cash
  batch posts at the FX-Partner Settlement Event; real funds move off-platform).
- **`settlement`** — cash-out lifecycle, Agency settlement, Partner reconciliation; owns the
  cash-out→Finance handoff **contract** (`FinanceHandoffPort`); the transport adapter lives in `zoho-sync`.
- **`reconciliation`** — daily invariant checks, drift queue, financial dashboard read model.

`payments`/`fx-settlement`/`settlement`/`reconciliation` are **clients** of `LedgerWritePort` and may
**not** import `LedgerEntry`/`PostingBatch`/`BookkeepingAccount`. Money is never distributed across
services — the ledger is one store.

## 6. Cross-context integration

- **Event-driven by default.** A context consumes another context's domain events (via the
  transactional **outbox** + EventBridge) into its own local read model.
- **The only sanctioned synchronous cross-core seam** is two published query contracts, used for the
  Clean-state Gate's strongly-consistent reads: `WalletBalanceQuery` (finance) and
  `OpenCaseCountQuery` (case-lifecycle). They are allow-listed **by name** in ESLint; everything else
  crossing a core boundary must be an event.
- `notifications/delivery` is the **sole** owner of the multi-channel delivery cascade
  (`in_app → push → sms`). `case-thread` and the POA video-link relay only **emit triggers** to the
  outbox; they never call a Push/SMS/Email provider.

## 7. Idempotency

`IdempotencyKey` is a **required** field on every money-moving command and on `PostingBatch`.
`LedgerWritePort.commit` is idempotent on it (replay returns the original `LedgerEntries`, never
double-posts). The authoritative dedup is the ledger **unique-key constraint** (migration); Redis is
a fast path. The Stripe webhook gets the same `WebhookVerifier` + idempotency-store + ledger-key
treatment.

## 8. Shared kernel — mechanism only (`apps/api/src/shared`)

`kernel/` is the only part of `shared/` that `domain` may import: `money` (AED), `result`, `domain`
(AggregateRoot/Entity/DomainEvent bases), `identifiers` (raw + typed ids), `idempotency`, `time`
(Clock/Instant/Duration), `contact` (E.164/email/url primitives), `state-machine` (a **context-free**
transition mechanism — no domain statuses/guards), `role-context` (an **opaque** handle only), and
`text` (a `BoundedText(min,max)` **factory**).

Domain vocabulary is **not** in the kernel: `GlobalStatus` lives in `case-lifecycle/domain`,
`ActiveRoleContext` in `roles-and-access/domain`, `VerificationStatus/Method/ResidencyStatus` in
`verification/domain`, and each context declares its own bounded-text bounds.

`shared/platform` (outbox, eventbridge, idempotency-store), `shared/audit`, and
`shared/request-context` are infrastructure and are **never** imported by `domain`.

## 9. Enforced boundary rules

ESLint (`packages/config/eslint`) mechanically enforces:

1. `core/**` never imports `modules/**`.
2. A Module never imports another Module.
3. A Module imports only backbone ports/contracts/events — never backbone infrastructure.
4. `domain/**` never imports NestJS / an ORM / an AWS SDK / `shared/platform` / `shared/audit`.

The architecture **edge tests** in `apps/api/test/arch` reinforce the finer rules that are awkward
to express in lint: `core/case-lifecycle` has zero module imports; only `finance/ledger` imports the
postings adapter (and no other finance subdomain imports the ledger aggregates); every
`PostingBatch` balances and is idempotent on its key; the cross-core synchronous-query allowlist.

**Naming discipline:** folder and type names use `CONTEXT.md` primary terms and never an _Avoid_-list
term (no `User`, `account`, `profile`, `organization`, `tenant`, `workspace`, `vendor`, `markup`,
`plugin`, `extension`). The web feature folder is `business`, not `business-workspace`.

## 10. Open questions / prerequisites flagged during design

These came out of mining the PRDs against `CONTEXT.md` and should be resolved with stakeholders
**before** the corresponding code is written (do not guess — per `CLAUDE.md`):

- **`CONTEXT.md` line 236 contradicts the POA PRD.** It says "A POA Case has exactly one Principal,"
  but the POA PRD specifies **1–5 Principals**, a **Principal Authority Mode** (`joint` /
  `several` / `joint_and_several`), per-Principal Principal-Only Actions, and a count-based
  per-Principal Passport-Based Notarisation add-on. Recommended prerequisite before any
  `poa-case-workflow` code: add **ADR 0005 (multi-Principal POA)** and update `CONTEXT.md`.
- Count-based per-Principal passport add-on line items with their own Partner Share — needs a
  Wallet-PRD amendment + Finance sign-off.
- LLM polish provider for `poa-drafting` is TBD (load the `claude-api` skill before wiring if
  Anthropic is chosen).
- FX-Partner settlement cadence + per-FX-Partner `partner_share_pct` overrides.
- Messaging escalation windows, urgent-sender authorization, storage-quota reclamation vs retention.
- New messaging terms (`Notification Center`, `Trigger`, `Channel`, `Quiet Hours`, `Urgent message`,
  `Acknowledgement`, `Storage quota`) should be added to `CONTEXT.md` so the notifications/case-thread
  vocabulary has a source-of-truth backing.
