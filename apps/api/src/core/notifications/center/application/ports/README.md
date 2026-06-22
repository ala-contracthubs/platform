# application/ports

**All driven I/O ports live here** (ports & adapters):
`PaymentProvider`, `IdentityProvider`, `DocumentStore`, OCR/LLM providers, `SchedulerPort`,
`ClockPort`, every `*Publisher` / `*Subscriber` / `*Query` / projection port, and any
cross-core *consumed-event-state* read-model ports.

Infrastructure adapters in [`../../infrastructure/adapters`](../../infrastructure/adapters)
implement these. `application` depends only on `domain`. See `docs/ARCHITECTURE.md`.

