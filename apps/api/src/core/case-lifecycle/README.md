# `case-lifecycle` — backbone context (Module 0)

Owns the Case aggregate root and the hybrid status model: the platform-owned Global Status machine (its transition TABLE lives here in case-lifecycle/domain) layered with a Module-declared Sub-status, single-Partner-at-a-time assignment, ownership/attribution, the per-Case audit log, and the Case thread scaffolding hook. AUTHORITATIVE OWNERSHIP: backbone Case is authoritative for Global Status, the one-Partner slot, ownership/attribution and the platform audit log; a Module drives Global Status and Partner assignment ONLY by requesting transitions through the case-lifecycle port; PoaCase references the Case by CaseId, never by object reference. MODULE-WORKFLOW SEAM IS DECLARATIVE: modules register a workflow contract (transition table + guard/effect IDENTIFIERS, not code) via module-registry; the WorkflowStateMachineEngine operates only on that data and NEVER imports a module package — module side-effects run inside modules/poa via a backbone-owned port the module implements (wired at the composition root) and/or by subscribing to GlobalStatusChanged/SubStatusChanged; an ESLint edge test asserts core/case-lifecycle has zero imports into modules/. Publishes OpenCaseCountQuery for the Clean-state Gate. PORT PLACEMENT: domain/ports holds repositories + the pure transition validator; ModuleWorkflowRegistry/ModuleManifestReader/VerificationGate/DomainEventPublisher/AuditLogPublisher/SlaTimerPort/ZohoSyncPort are application/ports.

## Aggregates
- Case
- PartnerAssignment

## Value objects
- GlobalStatus (table owned here)
- SubStatus (module-declared key)
- CaseId
- ModuleKey
- CaseOwnership
- PartnerRef (Business or Solo Individual)
- TransitionGuardResult
- CaseAuditEntry
- TerminalReason

## Domain events
- CaseCreated
- GlobalStatusChanged
- SubStatusChanged
- PartnerAssigned
- PartnerReassigned
- CaseCompleted
- CaseCancelled
- CaseAttributionFrozen

## Ports
- domain/ports: CaseRepository; domain service: GlobalStatusTransitionTable (pure, data-only)
- application/ports: ModuleWorkflowRegistry, ModuleManifestReader, VerificationGate, ModuleWorkflowEffectPort (implemented by modules at runtime), DomainEventPublisher, AuditLogPublisher, SlaTimerPort, ZohoSyncPort
- published query contract: OpenCaseCountQuery (open-host read API for the Clean-state Gate)

## Adapters (infrastructure)
- PostgresCaseRepository
- CaseHttpController
- CaseDetailViewComposer (read-model query side; application/queries + infrastructure/persistence, not domain)
- WorkflowStateMachineEngine (operates only on Manifest data; never imports a module)
- OutboxPublisherAdapter
- EventBridgeCaseSyncTrigger

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

