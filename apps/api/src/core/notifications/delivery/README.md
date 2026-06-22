# `notifications/delivery`

Multi-channel pipeline (in_app / push / email / sms) with critical override. SOLE OWNER of the delivery escalation cascade (in_app→push@N→sms@M), throttle-with-auto-batch, retry + DLQ, idempotency/dedup, no-PII-in-outbound-bodies.

---
Part of the `notifications` bounded context. ESLint enforces the sub-boundaries (see `docs/ARCHITECTURE.md`).

