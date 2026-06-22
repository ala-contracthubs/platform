# core/ — the Backbone (Module 0)

The platform owns identity, cases, documents, payments, wallets, the ledger, SLAs,
dashboards, notifications, the module framework and Zoho sync **once**. Each folder here is a
bounded context with internal hexagonal layering (`domain / application / infrastructure`).

## Bounded contexts
- [`identity/`](./identity) — Authentication only.
- [`verification/`](./verification) — Owns the per-Individual Verification Status state machine and the requireVerified() Transaction gate.
- [`roles-and-access/`](./roles-and-access) — The authorization domain.
- [`businesses-and-memberships/`](./businesses-and-memberships) — Owns the Business aggregate, Platform-Admin-only provisioning, suspend/freeze, the at-least-one-Admin invariant, the Business audit log, and Membership created only by invite + explicit acceptance.
- [`case-lifecycle/`](./case-lifecycle) — Owns the Case aggregate root and the hybrid status model: the platform-owned Global Status machine (its transition TABLE lives here in case-lifecycle/domain) layered with a Module-declared Sub-status, single-Partner-at-a-time assignment, ownership/attribution, the per-Case audit log, and the Case thread scaffolding hook.
- [`documents/`](./documents) — GENERIC documents-as-a-platform-primitive — knows NOTHING of POA.
- [`finance/`](./finance) — The whole financial backbone built once so Modules ship no payment code.
- [`sla/`](./sla) — SLA Timer as a platform primitive: every Case carries exactly one SLA Timer.
- [`notifications/`](./notifications) — The notification backbone built once.
- [`case-thread/`](./case-thread) — The per-Case human-to-human conversation: exactly one thread per Case with participants derived from the Case and auto-updated; Agency Admin is a read-only non-participant viewer.
- [`module-registry/`](./module-registry) — The module framework.
- [`zoho-sync/`](./zoho-sync) — One-way Case sync Contract Hubs -> Zoho on create and on every status change (CH is the System of Record; Zoho downstream).
- [`platform-admin/`](./platform-admin) — Thin operational HTTP surface for the exclusive Platform Admin role.

## Boundary rules (ESLint-enforced)
- `core/**` **never** imports `modules/**`.
- Cross-core integration is **event-driven by default**; the only sanctioned synchronous
  cross-core seam is the two published query contracts `WalletBalanceQuery` (finance) and
  `OpenCaseCountQuery` (case-lifecycle) for the Clean-state Gate.
- `domain/**` imports nothing but the shared **kernel**.

See [`docs/ARCHITECTURE.md`](../../../../docs/ARCHITECTURE.md).

