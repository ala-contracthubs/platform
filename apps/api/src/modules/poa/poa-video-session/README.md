# `poa/poa-video-session`

Partner-hosted Video Session relay (the explicit ADR-0004 exception - the platform does NOT create/host/record the meeting). Captures the Partner-Provided Video Link (validated well-formed URL only) + instructions on the Case and relays them to Client and Agent by EMITTING triggers into the notifications context (outbox), never shipping delivery code. Value objects: PartnerProvidedVideoLink, VideoInstructions (BoundedText(0,1000), declared locally), ReminderSchedule(24h|2h|15min), SessionState. Fires the video-link required/escalation reminder chain and the appointment reminders. Drives the Operator Start session (#12->#13) and End session (#13->#14). Multi-Principal: all Principals must personally attend and sign.

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

