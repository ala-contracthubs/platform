# `finance/wallet`

Wallet aggregate. `Available + Pending` is DERIVED from postings via a BalanceProjection read model. Suspend/freeze; cash-out eligibility. Publishes `WalletBalanceQuery` — the strongly-consistent Clean-state-Gate read contract.

---
Part of the `finance` bounded context. ESLint enforces the sub-boundaries (see `docs/ARCHITECTURE.md`).

