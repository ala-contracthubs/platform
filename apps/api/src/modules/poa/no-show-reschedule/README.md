# `poa/no-show-reschedule`

Reschedule + No-Show Categorisation + dispute. Free reschedule outside the 4h clock-hour cutoff (#12->#11, Slot freed); late reschedule within cutoff (Slot freed, late_reschedule_pending_categorisation marker, Operator categorises <=48h default-excused); auto-assigned same-day first-reschedule exemption. No-Show Categorisation enum (excused_technical_issue | excused_communication_issue | unexcused) + reason (BoundedText(50,500), declared locally); Mark Missed Appointment from #12 (Slot+15min) or #13; Excused -> free reschedule #11 no penalty; Unexcused -> #16 with 7-day dispute window, payment stands, no refund/credit. Client dispute (counter-explanation BoundedText(50,500)) -> Platform Admin uphold (T4) / overturn (revive #11); Notary Admin <=24h internal override. Value objects: NoShowCategory, DisputeWindow(7d), GamingMitigationThreshold(30d). Append-only no_show_events[], category immutable post-submit; 30-day gaming-mitigation threshold. No automatic money movement.

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

