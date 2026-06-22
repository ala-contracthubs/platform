# shared/ — kernel, platform integration, audit, request-context

- `kernel/` — **mechanism only**, importable by `domain`: Money/AED, Result, AggregateRoot /
  Entity / DomainEvent bases, raw + typed ids, IdempotencyKey, Clock/Instant/Duration, format
  primitives, opaque `RoleContextHandle`, a context-free state-machine `TransitionTable`, and a
  `BoundedText(min,max)` factory. **No domain vocabulary lives here** (GlobalStatus →
  case-lifecycle, ActiveRoleContext → roles-and-access, VerificationStatus → verification).
- `platform/` — `outbox`, `eventbridge`, `idempotency-store` (infrastructure; **never** imported by `domain`).
- `audit/` — append-only tamper-evident audit log; audit writes are an application/event-handler
  responsibility (**domain never imports `shared/audit`**).
- `request-context/` — request-scoped RoleContextHandle propagation + correlation id.

## kernel modules
- `kernel/money`
- `kernel/result`
- `kernel/domain`
- `kernel/identifiers`
- `kernel/idempotency`
- `kernel/time`
- `kernel/contact`
- `kernel/state-machine`
- `kernel/role-context`
- `kernel/text`
- `platform/outbox`
- `platform/eventbridge`
- `platform/idempotency-store`
- `audit`
- `request-context`

