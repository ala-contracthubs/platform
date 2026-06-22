# `platform-admin` — backbone context (Module 0)

Thin operational HTTP surface for the exclusive Platform Admin role. Owns ONLY the AdminActionLog aggregate (admin-action audit) and its controllers; it does NOT own bespoke admin-only ports reaching into other contexts' internals. Each admin action INVOKES the target context's PUBLISHED application use-case — the same use-case that context's own controllers call: the manual verification review queue calls verification's ManuallyApproveVerification/ManuallyRejectVerification/ManuallyUnverify; business provisioning/suspension calls businesses-and-memberships' ProvisionBusiness/SuspendBusiness; module enable/disable calls module-registry's toggle use-cases; refund/dispute review calls finance's refund use-cases; the Zoho sync-failure retry calls zoho-sync's retry use-case. This keeps a single dependency graph rather than a parallel hidden one. PORT PLACEMENT: domain/ports holds AdminActionLogRepository; the published-use-case clients are application-level dependencies, not bespoke internal ports.

## Aggregates
- AdminActionLog

## Value objects
- AdminActorRef
- AdminActionType
- BeforeAfterSnapshot
- ManualReviewDecision (approve | reject)

## Domain events
- AdminActionPerformed
- ManualVerificationReviewed
- ModuleToggledByAdmin

## Ports
- domain/ports: AdminActionLogRepository
- application: invokes other contexts' PUBLISHED use-cases (verification.ManuallyApproveVerification, businesses.ProvisionBusiness/SuspendBusiness, module-registry toggle use-cases, finance refund use-cases, zoho-sync retry use-case) — no bespoke admin-only internal ports

## Adapters (infrastructure)
- PlatformAdminDashboardController
- ManualReviewQueueController (calls verification use-cases)
- PostgresAdminActionLogRepository

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

