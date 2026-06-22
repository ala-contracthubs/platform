# `finance/payments`

Stripe-as-PSP behind a `PaymentProvider` port + local-acquirer fallback, idempotent webhook, immediate-settlement case billing, refunds, client-credit issuance. A CLIENT of `LedgerWritePort` — must not import ledger aggregates.

---
Part of the `finance` bounded context. ESLint enforces the sub-boundaries (see `docs/ARCHITECTURE.md`).

