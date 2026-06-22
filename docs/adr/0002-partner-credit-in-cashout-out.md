# Partner Businesses credited at payment; cash-out deferred to V1.1

The original Wallet & Finance PRD deferred all Partner Business commission flows to V1.1. That is incompatible with V1's launch Modules: Legal needs a 70/30 split to the law firm at the moment the Client pays, FX requires a revenue share with the FX broker, and Shipping requires the courier cost to flow to the courier — all three Modules cannot ship without partner-side postings.

We chose to bring **partner credit** into V1 while keeping **partner self-serve cash-out** deferred to V1.1: at Case payment, the Partner Business's Wallet is credited with its Partner Share via the same ledger plumbing as Agency Wallets, and the Partner can see the balance in their Wallet view. Cash-out is handled by Finance off-platform per existing partner agreements, with Platform Admin posting manual debits to reconcile the Wallet. The rejected alternative — keeping partner-owed money entirely off-ledger and reconciling in a side spreadsheet — would have broken the audit invariant in PRD WF1.10 (every transaction is a double-entry ledger posting) and left partner-bound funds untracked on the platform.

## Consequences

- Partner Businesses get auto-provisioned Wallets at Business creation (parallels Agency Wallets).
- A new manual-debit reconciliation flow is needed for Platform Admin to record off-platform Finance payouts to Partners.
- Self-service Partner cash-out is a V1.1 scope item, parallel to Agency cash-out today.
- Refund clawback (PRD WF1.11) has to reach into the Partner Wallet, which is why refunds are gated on payout status of all affected Wallets.
