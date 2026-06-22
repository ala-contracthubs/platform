# modules/poa — the POA Module (first plug-in Module)

Plugs into the backbone **only** through its Module Manifest contract and backbone ports — it
never reaches into another Module, and never writes backbone state directly.

- `PoaCase` references the backbone `Case` by `CaseId` (id reference, never object reference)
  and drives Global Status + Notary-office (Partner) assignment **only** through the
  case-lifecycle port (`BackboneCasePort`).
- All document bytes (Drafts, Final POA) go through the backbone `DocumentStore` port —
  `modules/poa` holds **zero** AWS-SDK imports. POA decides *when* to `markImmutable()`.
- `NotaryOfficePoaProfile` is a separate POA aggregate keyed by `BusinessId`; it reads
  `Business` via `BusinessLookupPort` and never writes the backbone Wallet (Partner Share
  lands via the finance `CasePaid` reaction).
- The POA sub-status transition table lives in `poa-case-workflow/domain`; module side-effects
  run here via `PoaWorkflowStateMachineAdapter` implementing the backbone `ModuleWorkflowEffectPort`.

## Subdomains
- [`poa-case-workflow/`](./poa-case-workflow) — The heart of the POA module and its aggregate root (PoaCase).
- [`poa-intake/`](./poa-intake) — The capture flow before the Notary touches the Case: who-is-the-Principal (Myself / a Company + add co-Principal up to 5), Basic Information (read-only name + residency read via verification's published state, Emirates ID/passport, per-Principal Passport-Based Notarisation toggle), Attorney(s) section + Attorney Authority Mode, and POA Details (Property vs General field sets) with the English Translation Add-on intent captured so the assignment filter can route to a translation-capable Notary office.
- [`poa-documents/`](./poa-documents) — Generates the dynamic document checklist from POA Type + per-Principal type/residency + per-Attorney type + Purpose + per-Principal passport_notarisation and tracks per-document required/upload_status/review_status.
- [`poa-drafting/`](./poa-drafting) — Produces the bilingual POA Draft (Arabic + English): deterministic template-merge from the Manifest-declared template iterating principals[]/attorneys[] and rendering Authority Mode clauses with LOCKED vs POLISH_ALLOWED zones, plus a per-language LLM-polish pass (60s combined budget, fallback to raw template output per language on failure/timeout, audit-logged).
- [`notary-office/`](./notary-office) — POA-specific extensions to the notary_office Business sub-type and its fulfilment.
- [`notary-scheduling/`](./notary-scheduling) — Notary office capacity + booking.
- [`poa-video-session/`](./poa-video-session) — Partner-hosted Video Session relay (the explicit ADR-0004 exception - the platform does NOT create/host/record the meeting).
- [`session-completion/`](./session-completion) — Session-Completion Checklist + Final POA issuance.
- [`no-show-reschedule/`](./no-show-reschedule) — Reschedule + No-Show Categorisation + dispute.
- [`notary-rejection/`](./notary-rejection) — Notary rejection of a Case: Operator rejects with reason (BoundedText(50,500), declared locally) in two windows - pre-payment (#6/#9) and post-payment (#12-#14) - requiring Notary Admin countersignature <=24h (pending_rejection marker, office-visible only, holds the Case).
- [`poa-payment-addons/`](./poa-payment-addons) — POA-side payment orchestration and add-on logic at #10 (distinct from the backbone finance ledger which owns the postings).
- [`notary-internal-notes/`](./notary-internal-notes) — Notary internal notes: an append-only list of timestamped notes (author + body, InternalNote = BoundedText(0,4000) declared locally) on a POA Case, visible only to the assigned Notary office's Members (and Platform Admin for audit/compliance), never to Client or Agent, never in the case thread, never firing notifications.
- [`poa-dashboards-metrics/`](./poa-dashboards-metrics) — POA CQRS read-model subdomain (NO write authority; lives in application/queries + infrastructure/persistence, NOT domain).

## Module-level aggregates
- PoaCase
- Principal
- Attorney
- DocumentChecklist
- PoaDraft
- FinalPoa
- NotaryOfficePoaProfile (keyed by BusinessId; separate from backbone Business)
- OperatorAssignment
- OfficeCapacityBlock
- Slot
- OfficeClosureDay
- Booking
- VideoSession
- SessionCompletionChecklist
- NoShowRecord
- NoShowDispute
- Rejection
- PoaPaymentIntent
- NotaryInternalNotesLog

## Module-level ports
- domain/ports: PoaCaseRepository, DocumentChecklistRepository, PoaDraftRepository, NotaryOfficeProfileRepository, CapacityBlockRepository, SlotRepository, OfficeClosureRepository, BookingRepository, VideoSessionRepository, ChecklistRepository, NoShowEventRepository, DisputeRepository, RejectionRepository, NotaryInternalNotesRepository
- application/ports (backbone contracts + I/O): BackboneCasePort (CaseLifecyclePort via Manifest — the only way to mutate Global Status / Partner slot / audit), VerificationGate (requireVerified, POA threshold), VerificationStatePort (read residency/name from verification's published state), PrincipalVerificationGatewayPort (invite-to-verify), ManifestSnapshotPort, DocumentStorePort (backbone documents — ALL bytes; no POA S3 adapter), TemplateMergeEngine, LlmPolishProvider, BusinessLookupPort (read Business identity/status; never import Business aggregate), AssignmentPolicyPort, InFlightLoadQueryPort, SlotReservationLock, VideoLinkValidator, SchedulerPort, NotificationEmitPort (outbox -> notifications), ShippingCaseCreationPort (backbone Case-creation contract), RefundOrchestrationPort (backbone finance), PaymentIntentPort (backbone finance), AddonPricingPort (Manifest snapshot), TranslationCapabilityQueryPort, ClockPort (Asia/Dubai)
- application/queries (read models, NOT domain): MyPoasReadModel, PoaMetricsReadModel
- domain service: PoaCasePolicyService (Principal-Only Action authorisation; pure)

See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

