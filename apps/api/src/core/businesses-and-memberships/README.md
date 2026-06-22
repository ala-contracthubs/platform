# `businesses-and-memberships` — backbone context (Module 0)

Owns the Business aggregate, Platform-Admin-only provisioning, suspend/freeze, the at-least-one-Admin invariant, the Business audit log, and Membership created only by invite + explicit acceptance. Enforces one-Business-at-a-time for member roles, the Clean-state Gate, invite expiry (14d), duplicate-invite block, immediate leave/remove. CLEAN-STATE GATE: its strongly-consistent reads use the two PUBLISHED cross-core query contracts (finance.WalletBalanceQuery and case-lifecycle.OpenCaseCountQuery) — the only sanctioned synchronous cross-core seam, ESLint-allowlisted by name. ProvisionBusiness/SuspendBusiness are this context's published command API, invoked by platform-admin. PORT PLACEMENT: domain/ports holds only repositories; the two cross-core queries, SubTypeCatalogReader, SmsInviteSender, AuditLogPublisher, SchedulerPort and ClockPort are application/ports.

## Aggregates
- Business
- Membership
- BusinessInvite

## Value objects
- BusinessSubType (Agency + module-declared)
- BusinessProfile (TradeName, TradeLicenseNumber, Jurisdiction)
- InviteStatus
- InviteExpiry (14d)
- MembershipRole
- CleanStateGateResult
- AdminAssignment
- SuspensionState

## Domain events
- BusinessProvisioned
- BusinessProfileChanged
- BusinessSuspended
- FirstAdminAssigned
- MemberInvited
- InviteAccepted
- InviteDeclined
- InviteExpired
- InviteCancelled
- MembershipCreated
- MembershipEndedByLeave
- MembershipEndedByRemoval
- CleanStateGateFailed
- LastAdminRemovalBlocked

## Ports
- domain/ports: BusinessRepository, MembershipRepository, InviteRepository
- application/ports: WalletBalanceQuery (consumed; published by finance), OpenCaseCountQuery (consumed; published by case-lifecycle), SubTypeCatalogReader, SmsInviteSender, AuditLogPublisher, SchedulerPort, ClockPort, DomainEventPublisher

## Adapters (infrastructure)
- PostgresBusinessRepository
- PostgresMembershipRepository
- PostgresInviteRepository
- SmsInviteAdapter
- BusinessAdminHttpController
- PlatformAdminBusinessController
- InviteExpirySchedulerAdapter

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

