# `sla` — backbone context (Module 0)

SLA Timer as a platform primitive: every Case carries exactly one SLA Timer. Defaults from the Module Manifest per sub-status with optional per-Business overrides; counts only In Progress + Awaiting Partner running time on business hours Sun-Thu 09:00-18:00 Asia/Dubai; pauses on Awaiting Client; breach triggers escalation notifications. Wall-clock-since-creation computed here alongside the hidden internal SLA. DISAMBIGUATION: BusinessHoursCalendar is a PURE value object in sla/domain (Asia/Dubai Sun-Thu 09:00-18:00 + holiday rule); the SLA accrual math lives in the SlaTimer aggregate / a domain service; ClockPort (kernel) supplies now; only externally-fetched office-closure days use a HolidayCalendarReader application port; the GlobalStatusChange reaction is an infrastructure event subscriber. Scheduling backed by EventBridge Scheduler (SchedulerPort, application).

## Aggregates
- SlaTimer

## Value objects
- SlaDuration (business hours)
- SlaDefault (per sub-status)
- SlaOverride (per Business)
- BusinessHoursCalendar (Asia/Dubai; pure VO in domain)
- TimerState (Running | Paused | Stopped)
- WallClockSinceCreation
- BreachThreshold
- EscalationPolicy

## Domain events
- SlaTimerStarted
- SlaTimerPaused
- SlaTimerResumed
- SlaTimerStopped
- SlaBreached
- SlaEscalationTriggered

## Ports
- domain/ports: SlaTimerRepository, SlaOverrideRepository
- application/ports: SlaDefaultsReader, HolidayCalendarReader (only external office-closure days), SchedulerPort, EscalationNotificationPublisher, ClockPort

## Adapters (infrastructure)
- PostgresSlaTimerRepository
- EventBridgeSchedulerAdapter
- SlaHttpController
- GlobalStatusChangeEventSubscriber
- HolidayCalendarAdapter

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

