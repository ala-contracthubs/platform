# Generalised Fee Models in the Module Manifest

The original Wallet & Finance PRD assumed every Module charged a single fixed AED Base Fee per Case, with the only variability being an Agent Top-up on top. The eight V1 Modules do not fit that shape: POA and Golden Visa are fixed AED but with an embedded Partner Share (notary / government cost); Legal, Conveyancing, and Shipping are tiered with a Module-declared price list; FX is a percentage of a per-Case notional with deferred settlement; Off-Plan and Tenancy are subscription-based.

We chose to generalise the Manifest with a `Fee Model` field — `Fixed`, `Tiered`, or `Percentage` in V1 (Subscription deferred) — and let the Wallet & Finance backbone own the math, postings, and cash flow for all three shapes. The alternative was to keep the Wallet PRD hardcoded to fixed AED bases and push divergent pricing into each Module's own code, which would have re-invented the commission engine five times and broken the Goal of "Modules don't ship payment code."

## Consequences

- The Module Manifest contract grows by several fields (Fee Model, per-Model parameters, Partner Share formula, Top-up enable flag, Settlement Mode).
- Adding a new pricing shape later (e.g., Subscription) requires extending the enum and the Wallet & Finance posting rules — not changing every Module.
- Per-Agency override behavior is now Fee-Model-dependent rather than uniform (see PRD WF1.2).
