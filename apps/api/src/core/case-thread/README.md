# `case-thread` — backbone context (Module 0)

The per-Case human-to-human conversation: exactly one thread per Case with participants derived from the Case and auto-updated; Agency Admin is a read-only non-participant viewer. Message types: text (MessageBody = BoundedText(0,4000) declared locally), attachments (linking into documents), voice messages (waveform), system messages, drafts. Owns the 5-minute author-delete window + tombstone, active-viewer suppression (~30s presence), per-thread mute (urgent pierces), catch-up unread divider, in-thread/cross-case search. URGENT OWNERSHIP SPLIT: case-thread owns ONLY the urgent FLAG + AcknowledgementLedger + fallback policy (flag Urgent -> writes the case.thread.urgent_message trigger event to the OUTBOX, per-recipient Acknowledge tracking, escalation to a configurable fallback on non-acknowledgement, per-sender rate limit, confirmation step, full audit). It NEVER calls a Push/Sms/Email provider and NEVER duplicates the delivery escalation cascade — the in_app+push+SMS multi-channel cascade bypassing quiet hours/mute/opt-outs is executed SOLELY by notifications/delivery. NotificationEmitPort is an OUTBOX WRITE consumed by notifications' DomainEventSubscriber, not a synchronous call. PORT PLACEMENT: domain/ports holds repositories; media store, scanner, search index, storage-quota, notification emit/outbox, presence, escalation timer, fallback resolver and audit are application/ports.

## Aggregates
- CaseThread
- ThreadMessage
- ThreadParticipant
- MessageDraft
- UrgentDispatch
- AcknowledgementLedger

## Value objects
- ThreadParticipantSet (derived)
- ParticipationPeriod (joined_at, removed_at - frozen visibility)
- MessageBody (BoundedText(0,4000), declared locally)
- Attachment
- VoiceMessage (waveform)
- SystemMessage
- MessageTombstone
- DeleteWindow (5 min)
- UrgentFlag
- AcknowledgementState (per recipient)
- AcknowledgementWindow (~10 min)
- PerSenderRateLimit
- FallbackPolicy
- ActiveViewerPresence
- ThreadMuteState
- UnreadDivider

## Domain events
- CaseThreadCreated
- ThreadParticipantAdded
- ThreadParticipantRemoved
- ThreadMessagePosted
- VoiceMessagePosted
- AttachmentPosted
- SystemMessageEmitted
- ThreadMessageDeleted
- MessageDraftSaved
- ThreadMuted
- UrgentMessageFlagged (case.thread.urgent_message)
- UrgentMessageAcknowledged
- UrgentEscalatedToFallback
- UrgentRateLimited
- NewThreadMessageNotified (case.thread.new_message)

## Ports
- domain/ports: CaseThreadRepository, ThreadMessageRepository, MessageDraftRepository, UrgentDispatchRepository, AcknowledgementRepository
- application/ports: CaseParticipantsPort, AgencyAdminViewerPort, MalwareScannerPort, MediaStorePort (backbone documents), ThreadSearchIndexPort, StorageQuotaPort, NotificationEmitPort (outbox write consumed by notifications), PresencePort, EscalationTimerPort, FallbackResolverPort, AuditPort

## Adapters (infrastructure)
- CaseThreadOrmRepository
- ThreadMessageOrmRepository
- MessageDraftOrmRepository
- CaseThreadController
- MediaStoreViaBackboneDocumentsAdapter (no own S3/KMS)
- MalwareScanAdapter
- WaveformThumbnailAdapter
- OpenSearchThreadSearchAdapter
- ThreadSseGateway
- CaseParticipantsEventConsumer
- UrgentMessageController
- EventBridgeSchedulerEscalationAdapter (acknowledgement/fallback timers only; not delivery)

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

