# `poa/notary-scheduling`

Notary office capacity + booking. Supply side (Notary Admin is the sole source of truth): Office Capacity Blocks (N concurrent Slots; one-off / weekly / open-ended weekly; per-occurrence overrides) materialised into Slots (default 30 min, per-office configurable), individual Slot blocking, Office-closure days (override all Blocks; UAE holidays pre-seeded, editable), 14-day publish horizon. Demand side (Client reserves): future-day self-select (tomorrow..14d, positive-only, dual timezone), same-day auto-assign (earliest Slot >= now + prep buffer, behind 16:00 Asia/Dubai cutoff), atomic reserve(slot_id) with Redis lock + race handling, no-slots empty state, Notary-Admin-only cancel of a booked appointment, Session Operator assignment per Slot. Value objects: RecurrenceRule, ConcurrentSlotCount, SlotStatus(available|blocked|reserved|booked), PrepBuffer, SameDayCutoff(16:00 Asia/Dubai), RescheduleCutoff(4h clock hours), AutoAssignExemption. Drives #11 -> #12; a no-show re-enters awaiting_booking with was_rescheduled=true.

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

