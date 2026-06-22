# `finance/fx-settlement`

Deferred Settlement Mode. At payment the ledger records ONLY the accrual (Pending FX Revenue credit + Originator Commission held pending); real funds move off-platform Client→FX Partner. The full balanced cash batch posts only at the FX-Partner Settlement Event. Dispute machine. CLIENT of `LedgerWritePort`.

---
Part of the `finance` bounded context. ESLint enforces the sub-boundaries (see `docs/ARCHITECTURE.md`).

