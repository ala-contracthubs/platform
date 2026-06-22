# `zoho-sync` — backbone context (Module 0)

One-way Case sync Contract Hubs -> Zoho on create and on every status change (CH is the System of Record; Zoho downstream). Field mapping comes from each Module Manifest's Zoho mapping; Company-as-Principal maps to a Zoho company-contact object. Bidirectional contact matching when a contact match is found. Reacts to Case domain events via the outbox; never the inverse. Surfaces sync failures in the Platform Admin dashboard with retry. SCOPE CLARIFICATION: zoho-sync owns ONLY the one-way Case sync domain and its one-way idempotent-on-Case-events invariant. The finance cash-out->Finance handoff CONTRACT and payload are owned by finance/settlement (FinanceHandoffPort); zoho-sync merely PROVIDES the Zoho transport adapter that satisfies that finance port (shared infrastructure). finance does not import zoho-sync; the composition root wires them. PORT PLACEMENT: domain/ports holds the sync-job repository; ZohoCrmClient, ZohoFieldMappingReader, DomainEventSubscriber and RetryQueuePort are application/ports.

## Aggregates
- ZohoSyncJob
- ContactMatch

## Value objects
- SyncStatus (Pending | Synced | Failed)
- ZohoCasePayload
- ZohoFieldMapping (per module)
- ContactMatchResult
- RetryCount
- SyncDirection

## Domain events
- CaseSyncQueued
- CaseSyncedToZoho
- CaseSyncFailed
- ContactMatched

## Ports
- domain/ports: ZohoSyncJobRepository
- application/ports: ZohoCrmClient, ZohoFieldMappingReader, DomainEventSubscriber, RetryQueuePort

## Adapters (infrastructure)
- ZohoCrmHttpAdapter
- PostgresSyncJobRepository
- SqsRetryQueueAdapter
- OutboxConsumerAdapter
- PlatformAdminSyncDashboardController
- ZohoCashOutHandoffAdapter (satisfies finance's FinanceHandoffPort; the contract is owned by finance, only this adapter lives here)

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

