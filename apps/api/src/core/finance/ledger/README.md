# `finance/ledger`

Single strongly-consistent append-only double-entry store + the four named Bookkeeping Accounts (Platform Revenue, Pending FX Revenue, Refunds Issued, Platform Credits Issued). The ONLY posting writer and the ONLY importer of the postings persistence adapter. Exposes `LedgerWritePort.commit(balancedBatch, idempotencyKey)` — idempotent on the key (replay returns the original LedgerEntries, never double-posts).

---
Part of the `finance` bounded context. ESLint enforces the sub-boundaries (see `docs/ARCHITECTURE.md`).

