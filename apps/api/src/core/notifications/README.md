# `notifications` — backbone context (subdomain-structured)

The notification backbone built once. Internal subdomains: trigger-registry (declarative typed triggers via Module Manifests; locale-keyed versioned templates; contract-tested), center (the canonical in-app Notification Center inbox + read-state system of record with distinct seen/read/archived timestamps, grouping, urgent pinning, badge counts, deeplink resolution scoped to Active Role Context), delivery (multi-channel pipeline in_app/push/email/sms with critical override; SOLE OWNER of the delivery escalation cascade in_app->push@N->sms@M, throttle-with-auto-batch, retry+DLQ, idempotency/dedup, no-PII-in-outbound-bodies — case-thread owns only the urgent FLAG, never this cascade), preferences (per-Individual per-trigger channel toggles, timezone-aware Quiet Hours with critical bypass, digest frequency), storage-quota (per-Individual cross-Case byte quota that blocks media at the limit but never text). Subscribes to domain events from every context VIA THE OUTBOX (DomainEventSubscriber) and fans them out; modules and case-thread emit triggers by WRITING AN OUTBOX EVENT consumed here, never by a synchronous call into notifications internals. PORT PLACEMENT: domain/ports holds the repositories; renderers, providers, dedup store, DLQ, timezone source, role-context resolver and all subscriber/publisher ports are application/ports.

## Aggregates
- TriggerDefinition
- NotificationTemplate
- Notification
- NotificationInbox
- NotificationDispatch
- NotificationPreferenceProfile
- StorageQuota

## Value objects
- TriggerKey (dotted, e.g. poa.* / case.thread.*)
- TemplateLocale (en; Arabic-ready)
- TemplateVersion
- TriggerCategory
- DeliveryMode
- Channel (in_app | push | email | sms)
- NotificationPriority (normal | critical | urgent)
- NotificationState (seen/read/archived timestamps)
- Deeplink
- BadgeCount
- DedupKey
- ProviderCollapseKey
- EscalationCascade
- QuietHoursWindow
- DigestFrequency
- QuotaLimit (default 500MB)
- UsedBytes

## Domain events
- TriggerRegistered
- TriggerEnabledGlobally
- NotificationTemplateVersionPublished
- NotificationCreated
- NotificationSeen
- NotificationRead
- NotificationArchived
- NotificationDispatched
- ChannelAttemptSucceeded
- ChannelAttemptFailed
- DeliveryEscalated
- DispatchDeadLettered
- DispatchDeduplicated
- OutboundThrottled
- NotificationPreferenceChanged
- QuietHoursConfigured
- StorageQuotaThresholdReached
- StorageQuotaExceeded

## Ports
- domain/ports: TriggerDefinitionRepository, NotificationTemplateRepository, NotificationRepository, NotificationDispatchRepository, PreferenceRepository, StorageQuotaRepository
- application/ports: ManifestTriggerContractValidator, TemplateRenderer, InboxQueryPort, BadgeCountPort, ReadStateBroadcaster, DeeplinkPermissionChecker, RoleContextResolver, OutboxRepository, DedupStore, PushProvider, EmailProvider, SmsProvider, DeadLetterQueuePort, TriggerEligibilityPort, TimezoneSource, StoredBytesAccountingPort, DomainEventSubscriber

## Adapters (infrastructure)
- TriggerDefinitionOrmRepository
- NotificationTemplateOrmRepository
- ManifestTriggerRegistrationController
- PlatformAdminTriggerController
- HandlebarsLikeTemplateRendererAdapter
- NotificationCenterController
- WebSocketReadStateGateway
- OsAppIconBadgeAdapter
- DeferredDeepLinkAdapter
- RedisDedupStoreAdapter
- ApnsFcmPushAdapter
- EmailSenderAdapter (SES)
- TdraCompliantSmsAdapter
- SqsDlqAdapter
- EventBridgeSubscriberAdapter
- PreferenceSettingsController
- StorageQuotaController
- MediaBytesAccountingAdapter

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

## Internal subdomains
Each is a true internal context with its own `domain/application/infrastructure`; one `notifications.module.ts` composes them.
- `trigger-registry/`
- `center/`
- `delivery/`
- `preferences/`
- `storage-quota/`

