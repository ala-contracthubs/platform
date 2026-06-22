# No Platform Wallet; named Bookkeeping Accounts instead

The platform is not an entity — it is the system on which Individuals and Businesses transact. Modelling "the Platform" as a Wallet-holding entity would imply ownership, cash-out, role-based visibility, and an Admin who can act on the Platform's behalf, none of which apply. But every double-entry posting still needs a counterparty on the Platform side, otherwise the audit invariant (`Σ debits = Σ credits`) does not close.

We chose to introduce a small, named set of **Bookkeeping Accounts** — internal ledger accounts owned by no entity, not user-facing, no cash-out — that absorb the Platform-side of every posting. V1 declares exactly four: `Platform Revenue` (Platform margin on Fixed/Tiered Cases), `Pending FX Revenue` (accrual for FX revenue owed by FX Partners), `Refunds Issued` (refund outflow, kept separate from Revenue), and `Platform Credits Issued` (source for goodwill / referral credits posted to Client Wallets). The rejected alternatives were a single Platform Wallet (mis-modelled the Platform as an entity) and a per-Module Platform Wallet (redundant — per-Module revenue is already derivable from the ledger).

## Consequences

- The audit invariant is restated: every Ledger Entry has one debit and one credit, each posting against either a Wallet or a Bookkeeping Account.
- Adding a new platform-side accounting concern (e.g., VAT collected, when introduced post-V1) means adding a new named Bookkeeping Account — not a new entity.
- The Platform Admin financial dashboard reads from the Bookkeeping Accounts; Wallet users never see them.
