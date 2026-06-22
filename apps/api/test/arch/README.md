# Architecture edge tests

Executable assertions of the boundary rules (run in CI):
- `core/case-lifecycle` has **zero** imports into `modules/`.
- only `finance/ledger` imports the postings persistence adapter; finance non-ledger
  subdomains never import `finance/ledger/domain/aggregates`.
- `domain/**` never imports NestJS / ORM / AWS SDK / `shared/platform` / `shared/audit`.
- every `PostingBatch` balances (Σ debits = Σ credits) and is idempotent on its `IdempotencyKey`.

