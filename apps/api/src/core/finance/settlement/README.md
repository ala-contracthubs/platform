# `finance/settlement`

Solo-Agent cash-out lifecycle, monthly Agency settlement, continuous Partner reconciliation. OWNS the cash-out→Finance handoff CONTRACT (`FinanceHandoffPort`); its transport adapter lives in `zoho-sync`. CLIENT of `LedgerWritePort`.

---
Part of the `finance` bounded context. ESLint enforces the sub-boundaries (see `docs/ARCHITECTURE.md`).

