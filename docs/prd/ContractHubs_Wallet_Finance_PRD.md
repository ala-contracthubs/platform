# Contract Hubs — Wallet & Finance PRD — V1

**Status:** Draft v0.2 (refactored against stakeholder pricing structure)
**Owner:** Product (Ala) + Finance co-author (TBD)
**Target launch:** 2026-10-03 (aligned with Module 0)

**Scope:** Wallets for every Individual, Agency, and Partner Business; the **Fee Model** framework (Fixed, Tiered, Percentage) that lets each Module declare its pricing shape in the Manifest; the commission and payout flows (platform Base Fee, agent Top-up, Originator Commission, Partner Share); per-Case ledger postings; monthly Agency settlement; Solo-Agent cash-out; Partner Wallet credit-in (cash-out deferred); Client Wallet credits (referrals / cashback); the four named Bookkeeping Accounts that absorb the Platform side of every double-entry posting; refund and clawback mechanics.

This PRD intentionally starts narrow — see *Non-Goals* — and will grow in later versions.

**Sibling PRDs:** Module 0 (identity, roles, Businesses, module manifest), Cases PRD, SLAs PRD, Messaging & Notification PRD, and per-Module PRDs (each Module declares its Fee Model and its parameters).

**Architectural decisions:** See `docs/adr/0001-generalised-fee-models.md`, `0002-partner-credit-in-cashout-out.md`, `0003-no-platform-wallet-bookkeeping-accounts.md` for the trade-offs behind the design.

---

## Problem Statement

Real estate agents in Dubai earn variable margins on every service they broker, and today that margin is a manual conversation between agent and client over WhatsApp, with the agency reconciling who owes what at month-end on a spreadsheet. As Contract Hubs takes ownership of eight service workflows in V1, we have to take ownership of the money too — how the platform charges, how agents capture their margin, how partner businesses get paid, how agencies reconcile their members' earnings, and how solo agents get paid.

The eight Modules do not share a single pricing shape. POA and Golden Visa are fixed AED with an embedded partner cost. Legal, Conveyancing, and Shipping are tiered with Module-declared price lists, each with different partner-share rules (Legal 70/30 with the law firm, Conveyancing 100% platform, Shipping passes courier cost through). FX is a percentage of a per-Case notional, paid by the Client to the FX provider directly, with the platform's revenue reconciled later. Off-Plan and Tenancy are subscription-based (deferred to a later iteration of this PRD).

Doing this commission and payout work once at the platform level — instead of per Module — is the only way the eight Modules can ship in V1 without each one re-inventing the commission engine.

## Goals

1. **One financial backbone, three Fee Models across all eight V1 Modules.** Each Module declares a Fee Model in its Manifest; this PRD owns the postings, payouts, and reconciliation for every Fee Model so Modules don't ship payment code.
2. **Agents capture their margin transparently.** Where the Fee Model supports it, Agents and Agencies set a Top-up over the platform's Base Fee (within a per-`(Module, Agency)` cap); the Client pays one bundled price; the Agent's earned amount is visible in their Wallet. Where Top-up is disabled (FX), Agents earn via Originator Commission — a slice of the Platform's revenue share paid out at FX-Partner settlement time.
3. **Solo Agents cash out on demand; Agency-affiliated Agents are paid by the Agency.** Cash-out is Solo-Agent-only in V1. Agency members' balances roll up to the Agency at month-end; the Agency pays its Agents off-platform per internal policy.
4. **Partner Businesses are credited on the platform at payment time.** The notary office, law firm, FX broker, and courier all have Wallets that accrue their Partner Share per Case. They cannot self-serve cash-out in V1 — Finance reconciles off-platform — but the platform Wallet ledger remains the source of truth for what is owed to them.
5. **Clients have a credit Wallet** for referrals and cashback, applicable to future Case payments — so growth and loyalty mechanics have a place to land without rewriting payments later.
6. **Auditable money trail.** Every Wallet posting is matched by a counter-posting against either another Wallet or a named Bookkeeping Account. The ledger is double-entry; every debit has a credit; daily reconciliation surfaces any drift in the Platform Admin queue.

## Non-Goals

1. **Cash-out for Agency-affiliated Agents.** They see their balance but only the Agency settles. Self-service in-month cash-out for Agency members is post-V1.
2. **Cash-out for Partner Businesses.** Partners' Wallets accrue Partner Share at Case payment, but self-service Partner cash-out is post-V1. Finance pays Partners off-platform per existing partner agreements; Platform Admin posts manual debits to reconcile the Partner Wallet.
3. **Client cash-out.** Client Wallets are credit-only — referrals and cashbacks apply to Case payments. No withdrawals to bank.
4. **Subscription-based modules.** Off-Plan and Tenancy use subscription / SaaS pricing rather than per-Case Base Fees. Their Fee Model and the subscription billing lifecycle are deferred to a later iteration of this PRD. V1 ships Fixed, Tiered, and Percentage Fee Models only.
5. **Per-Partner negotiated splits.** The Partner Share formula is declared in the Module Manifest and applies platform-wide for that Module — every law firm gets the same 70/30 split, every FX broker gets the same revenue share. Per-Partner negotiation is deferred to V1.1.
6. **Self-service refunds, chargebacks, and disputes.** Platform Admin handles refunds via a manual reversal flow (WF1.10). No self-service refunds in V1.
7. **Multi-currency.** AED-only in V1. The FX Module handles currency conversion at the Case level, not at the Wallet.
8. **VAT-compliant invoicing.** V1 emits a payment receipt with the bundled total; full VAT invoicing is post-V1, owned by Finance. When introduced, VAT will likely be captured via a new named Bookkeeping Account.
9. **Intra-platform P2P transfers** between users. Not in V1.
10. **Top-up by Client.** Only the Agent or Agency sets the Top-up. The Client sees only the bundled price (per Fee Model; see WF1.6).
11. **FX-Partner API integration.** V1 reconciles FX-Partner settlement via Platform-Admin batch posting. Automated FX-Partner integration is V1.1.

## User Stories

### Client
- As a Client, I want to see one bundled price for a Case so I'm not haggling over line items.
- As an FX Client, I want to see the notional amount I'm transferring and the percentage fee being charged, so I understand what the bundled total is composed of.
- As a Client with a referral or cashback credit, I want my Client Wallet balance to apply when I pay for a Case so I don't lose track of credits I've earned.
- As a Client, I want a clear receipt for every Case payment so I have a record of what I paid for.

### Solo Agent
- As a Solo Agent, I want to set a Top-up amount per Case (within the platform's Solo cap for that Module) so I capture my margin without negotiating off-platform — on Modules where Top-up is allowed.
- As a Solo Agent on FX, I want my Originator Commission to land in my Wallet when the FX-Partner settles with the platform, so I see what I've earned even though FX has deferred settlement.
- As a Solo Agent, I want my Top-up to land in my Wallet at the moment the Case is paid so I see what I've earned in real time (on immediate-settlement Modules).
- As a Solo Agent, I want to request a cash-out from my Wallet at any time so I get paid on my own schedule.

### Agent (member of an Agency)
- As an Agent in an Agency, I want to set a Top-up per Case (within my Agency's per-Module cap) so I can adjust margin per Client without a manager in the loop — on Modules where Top-up is allowed.
- As an Agent in an Agency, I want to see my running balance for the month so I know what I've earned.
- As an Agent in an Agency, I want a clear note that "Cash-out is handled by your agency" on my Wallet view so I'm not confused about why there's no cash-out button.

### Agency Admin
- As an Agency Admin, I want to set my Agency's Top-up cap **per Module** so the cap matches the Module's Base Fee scale (e.g., POA cap can be much smaller than Conveyancing's).
- As an Agency Admin, I want to see the Base Fee my Agency is charged per Module (read-only) so I can size my Top-up cap sensibly.
- As an Agency Admin, I want to see every Agent's running balance for the current month so I know what the platform will settle to my Agency at month-end.
- As an Agency Admin, I want a monthly settlement report with a per-Agent breakdown — including which Fee Model each Case used and whether earnings came from Top-up or Originator Commission — so I can pay each Agent per my internal policy.
- As an Agency Admin, I want to request cash-out from the Agency Wallet so the Agency receives its settled funds.

### Partner Business Admin (Notary, Law Firm, FX Broker, Courier)
- As a Partner Business Admin, I want to see my Wallet balance and transaction history so I have a running view of what the platform owes me per Case.
- As a Partner Business Admin, I want a clear note that "Cash-out is handled off-platform by Finance" on my Wallet view so I'm not confused about why there's no cash-out button.
- As a Partner Business Admin, I want to see a monthly Partner settlement report — per-Case breakdown of Partner Share earned — so I can reconcile against the Finance team's off-platform payouts.

### Platform Admin
- As a Platform Admin, I want to set the platform-wide Solo Top-up cap per Module so Solo Agents' margins stay reasonable across the board.
- As a Platform Admin, I want to override an Agency's Top-up cap per Module when the Agency has a special arrangement so I can support negotiated terms.
- As a Platform Admin, I want to set per-Agency Base Fee overrides on `Fixed` Modules (and per-Agency rate overrides on `Percentage` Modules) so I can honor negotiated rates without changing the platform default.
- As a Platform Admin, I want to run a month-end settlement that aggregates each Agency's Agents' balances and credits the Agency's Wallet so the monthly cycle is one click.
- As a Platform Admin, I want to record FX-Partner settlement batches — when the FX broker pays us back our revenue share — so the corresponding Originator Commissions can be credited to the originating Agents.
- As a Platform Admin, I want to credit a Client's Wallet (referrals, cashback, goodwill) so the loyalty program has a place to deposit funds.
- As a Platform Admin, I want to issue a refund on any Case so I can resolve disputes — subject to the affected Wallets not having been paid out off-platform yet.
- As a Platform Admin, I want to post manual reconciliation debits against Partner Wallets so the Wallet ledger reflects Finance's off-platform payouts.

## Requirements

### WF1.1 — Wallets per Individual, Agency, and Partner Business

Every Individual has a personal Wallet; every Agency and every Partner Business has its own Wallet. Wallets are auto-provisioned at Individual / Business creation; no setup needed.

- AC: A Wallet exists for every Individual, every Agency, and every Partner Business on the platform.
- AC: A Wallet exposes `Available` balance, `Pending` balance (cash-out in flight, where applicable), and an immutable transaction history.
- AC: A multi-role Individual sees the Wallet for their *active role context* — switching from `Solo Agent` to `Client` swaps the Wallet view (Module 0 R1.1 role-context rule).
- AC: A Partner Business Wallet has no cash-out CTA in V1 (per WF1.8).
- AC: A suspended Business (Module 0 R1.5) does not receive new credits; existing balance is frozen pending Platform Admin review.

### WF1.2 — Fee Model in the Module Manifest

Each Module declares exactly one **Fee Model** in its Manifest (Module 0 R3.1). V1 supports three Fee Models:

| Fee Model | Used by | Manifest parameters | Settlement Mode |
|---|---|---|---|
| `Fixed` | POA, Golden Visa | `base_fee_aed`, `partner_cost_aed` (the portion of the Base Fee owed to the Partner Business; may be zero) | immediate |
| `Tiered` | Legal, Conveyancing, Shipping | A list of tiers, each declaring `tier_id`, `client_price_aed`, `partner_cost_aed` (per-tier; may be zero); for Modules where Partner Share is a percentage of the tier price rather than a fixed AED, the Manifest may declare a `partner_share_pct` instead | immediate |
| `Percentage` | FX | `fee_pct` (% of per-Case notional), `partner_share_pct_of_platform_share` (revenue share to the Partner — see WF1.4), `originator_commission_pct_of_platform_share` (slice paid to the originating Agent — see WF1.5) | deferred |

- AC: A Module without a valid Fee Model declaration in its Manifest cannot have a Case completed (system-side validation).
- AC: The Manifest's Fee Model and its parameters are versioned; updates apply to **new** Cases only — in-flight Cases keep the Fee Model and parameters they started with.
- AC: At Case creation, the Fee Model and parameters in effect are **frozen on the Case**; the resolved Base Fee, Partner Share, and Top-up amount become immutable on the Case once the Client pays.
- AC: For `Tiered`, the Agent selects a tier at Case creation; the selected tier's parameters resolve the Base Fee and Partner Share for that Case.
- AC: For `Percentage`, the per-Case notional is captured at Case creation by the Module's own form (out of scope for this PRD beyond noting it is required input); the wallet PRD computes the Base Fee as `notional × fee_pct` at the moment the fee is calculated.
- AC: For `Fixed`, the Base Fee is simply `base_fee_aed`; Partner Share is `partner_cost_aed`; Platform's margin is `base_fee_aed − partner_cost_aed`.
- AC: Every Manifest update is audited (Platform Admin who acted, before/after value, timestamp).

### WF1.3 — Per-Agency overrides per Fee Model

Platform Admin may negotiate per-Agency overrides on certain Fee Models. The override matrix:

| Fee Model | Per-Agency override? | What can be overridden |
|---|---|---|
| `Fixed` | Yes | `base_fee_aed` (Partner cost remains as declared) |
| `Tiered` | No | — |
| `Percentage` | Yes | `fee_pct` |

- AC: An override is a record keyed on `(Module, Agency)`; one row per pair maximum.
- AC: Overrides are set by Platform Admin only. Agency Admin can **see** the Base Fee / fee rate in effect for their Agency (read-only) so they can size their Top-up cap, but cannot edit.
- AC: A Case's effective Base Fee is determined by the Agent's active role context at Case creation: a Case created by an Agent acting in Agency A uses Agency A's override (if any) for that Module; a Case created by a Solo Agent always uses the Manifest default.
- AC: Override changes apply to **new** Cases only.
- AC: Originator Commission rate (Percentage Modules) has **no** per-Agency override in V1.
- AC: Every override change is audited.

### WF1.4 — Top-up Cap and Top-up enable flag

Each Module declares in its Manifest whether Top-up is enabled (`top_up_enabled: bool`). For Modules where Top-up is enabled, a **Top-up Cap** bounds the maximum margin an Agent can add over the Base Fee.

| Module | Top-up enabled |
|---|---|
| POA | Yes |
| Golden Visa | Yes |
| Conveyancing | Yes |
| Legal | No |
| Shipping | No |
| FX | No |

- AC: Where `top_up_enabled = false`, the Case creation form does not show a Top-up field; any API attempt to set a non-zero Top-up returns 400.
- AC: Where `top_up_enabled = true`, the Top-up Cap is a **flat AED amount per `(Module, Agency)`** declared in module config. The same cap applies uniformly across all tiers within a Tiered Module — there is no per-tier or percentage-based cap in V1.
- AC: Platform Admin sets a **platform-wide Solo cap per Module** that applies to all Solo Agents on that Module; Solo Agents cannot configure it themselves.
- AC: Agency Admin sets their **per-(Module) Agency Top-up Cap** in Agency settings; the cap can be 0 (no Top-up allowed in that Module) or any positive AED amount up to a platform-wide ceiling set by Platform Admin per Module.
- AC: Platform Admin can override an individual Agency's per-Module cap (parallels Module 0 R3.6).
- AC: Cap changes apply to **new** Cases only.
- AC: At Case creation, the Agent enters a Top-up between 0 and their applicable cap; a Top-up exceeding the cap is rejected with a clear inline error showing the cap.
- AC: The Top-up is frozen on the Case once the Client pays.

### WF1.5 — Payment-in postings (immediate-settlement Fee Models)

For Modules with `settlement_mode = immediate` (`Fixed` and `Tiered`), on successful Client payment, the platform records the following ledger postings, atomically and in a single transaction:

| Posting | Debit | Credit | Amount |
|---|---|---|---|
| Client charge in | Client Wallet (if credit used) and/or external card | — | bundled total |
| Partner Share | — | Partner Business Wallet | resolved Partner Share for the Case |
| Platform's margin | — | `Platform Revenue` (Bookkeeping Account) | `Base Fee − Partner Share` |
| Top-up to Agent | — | Agent's Wallet (active role context) | resolved Top-up (0 if disabled) |

- AC: Successful payment creates exactly four ledger entries (or three if Partner Share is zero, or three if Top-up is zero) — all linked to the Case ID and audited with the actor.
- AC: A failed payment creates no Wallet credits and no Bookkeeping Account postings.
- AC: Idempotency — re-submitting the same payment after success does not double-credit.
- AC: The Client sees only the bundled total on the payment screen and on the receipt — Partner Share, Platform margin, and Top-up are never visible to the Client (exception: see WF1.6 for FX).

### WF1.6 — FX-specific payment flow and Originator Commission

For Modules with `settlement_mode = deferred` (`Percentage` / FX), Client funds flow to the FX Partner directly at Case payment; no Wallet on the platform receives a credit at that moment. The platform's revenue share and the Agent's Originator Commission are posted later, when the FX Partner settles back to the platform.

- AC: At FX Case payment, the platform records:
  - Client charge to FX Partner (out-of-platform cash flow; ledger marker only, no Wallet posting)
  - `Pending FX Revenue` (Bookkeeping Account) credit = expected platform share = `Base Fee × (1 − partner_share_pct_of_platform_share)`
  - The Originator Commission for this Case is computed (`platform_share × originator_commission_pct_of_platform_share`) and held as a pending amount referencing the Case — but **not** posted to the Agent's Wallet yet.
- AC: The Client's FX payment screen shows: the notional (AED-equivalent of the transfer), the fee percentage, and the bundled fee total. The Client does not see the Partner Share / Platform Share / Originator Commission split.
- AC: The Client's FX receipt shows the FX Partner as the counterparty of the funds transfer, with the bundled fee total separately.
- AC: When the FX Partner settles a batch back to the platform, Platform Admin records a **FX-Partner Settlement Event** referencing the batch of FX Cases just paid out by the Partner. For each Case in the batch:
  - `Pending FX Revenue` (Bookkeeping Account) is debited
  - `Platform Revenue` (Bookkeeping Account) is credited by the platform's share
  - The Agent's Wallet (active role context at the time of Case creation) is credited by the Originator Commission
- AC: FX-Partner Settlement Event posting is Platform-Admin-only in V1; FX-Partner API integration is V1.1.
- AC: If the FX Partner disputes or short-pays a batch, Platform Admin can mark Cases in the batch as `disputed` — those Cases remain in `Pending FX Revenue` and do not post Originator Commission until resolved.

### WF1.7 — Solo Agent cash-out

A Solo Agent can request a cash-out at any time, subject to: positive `Available` balance, IBAN on file (collected just-in-time at first cash-out), and KYC complete.

- AC: Cash-out states: `Submitted` → `Sent to Finance` → `Paid` | `Rejected` | `Cancelled`.
- AC: On `Submitted`, the requested amount moves from `Available` to `Pending`.
- AC: On `Paid`, `Pending` is debited and the Wallet's lifetime payout total updates.
- AC: On `Rejected` or `Cancelled`, `Pending` returns to `Available`.
- AC: Cash-out hands off to Finance via Zoho (Module 0 R8.3); Finance marks `Paid` or `Rejected` in Zoho; status posts back to the platform.
- AC: A Solo Agent cannot have two cash-outs in non-terminal states simultaneously.

### WF1.8 — Agency-affiliated Agents cannot cash out; Partner Businesses cannot cash out

The cash-out CTA does not appear on an Agency-affiliated Agent's Wallet view or on a Partner Business's Wallet view. Their balances accrue and are settled by other means.

- AC: An Agency-affiliated Agent's Wallet view shows balance, transaction history, and a clear note: "Cash-out is handled by your agency at month-end."
- AC: A Partner Business's Wallet view shows balance, transaction history, and a clear note: "Cash-out is handled off-platform by Finance."
- AC: Any API attempt to submit a cash-out from an Agency-affiliated Agent's Wallet or a Partner Business's Wallet returns 403.
- AC: **Implication for Module 0 R1.3:** an Agency-affiliated Agent cannot satisfy the clean-state gate (`Available = 0`) until monthly settlement. Agent transitions out of an Agency happen at or after month-end. Carryover of WO4 from v0.1.

### WF1.9 — Monthly Agency settlement; Partner reconciliation

On the last day of each calendar month (UAE timezone, 23:59), the platform sums each Agency's affiliated Agents' Wallet balances, credits the Agency's Wallet with the total, and zeroes the Agents' Wallets. The Agency Admin can then request a cash-out from the Agency Wallet (same lifecycle as WF1.7).

- AC: Settlement runs automatically; Platform Admin can also trigger it manually with cause (audited).
- AC: Each Agent's Wallet receives a `monthly_settlement_debit` ledger entry; the Agency Wallet receives a matching aggregate `monthly_settlement_credit` entry referencing the Agents and amounts.
- AC: Settlement is idempotent per `(Agency, month)` — re-running the same month for an Agency is a no-op.
- AC: The Agency Admin sees a **monthly settlement report**: per-Agent breakdown, per-Case detail, the Fee Model used on each Case, and a breakdown of earnings into `Top-up` vs `Originator Commission` columns.
- AC: A suspended Agency (Module 0 R1.5) does not receive settlement; balances stay parked on the Agents' Wallets pending Platform Admin review.
- AC: An Agent who joined the Agency mid-month settles only the balance accrued during their membership in that Agency for that month. Balance accrued before joining stays on the Agent's Wallet under their prior state (Solo or other Agency).
- AC: **Partner reconciliation is not a monthly batch.** Each Partner Business's Wallet accrues Partner Share continuously. When Finance pays a Partner off-platform, Platform Admin posts a manual debit against the Partner's Wallet (with reference to the Finance payout); the Wallet then reflects the post-payout outstanding balance. A monthly **Partner settlement report** (per-Partner-Business: per-Case breakdown of Partner Share accrued, debits posted, current outstanding) is generated for Finance to reconcile.

### WF1.10 — Refunds and clawback

Refunds are issued by Platform Admin only (no self-service in V1). A refund posts reversal entries to every Wallet credited by the original payment, **conditioned on the payout status of those Wallets**.

- AC: Refund states: `Initiated` → `Posted` | `Escalated to Finance`.
- AC: A refund's posting path depends on whether any affected Wallet has been paid out off-platform since the original Case payment:
  - **All affected Wallets still hold their original credit (Agent / Agency / Partner not yet paid out, and Solo cash-out not in Paid state):** the refund posts cleanly as reversal entries against each Wallet and against `Platform Revenue` (Bookkeeping Account). Refund destination is the Client's card (default) or the Client Wallet as credit (Platform Admin's choice per refund).
  - **At least one affected Wallet has been paid out (Solo cash-out `Paid`, Agency settlement run + cashed out, or Partner reconciled by Finance):** the Wallet ledger is **not** touched. Platform Admin marks the refund as `Escalated to Finance` and Finance handles the recovery off-platform via bank transfer; a journal entry on the ledger (`Refunds Issued` Bookkeeping Account debit, Client Wallet or card credit) keeps the platform books reconciled but no entity Wallet is debited.
- AC: The refund flow surfaces the payout status of each affected Wallet to Platform Admin before they confirm, so the path (post vs. escalate) is explicit.
- AC: A refund issued to the Client Wallet creates a credit posting on the Client Wallet matched by a debit on `Refunds Issued`.
- AC: Refunds are audited (Platform Admin actor, original Case ID, refund destination, posting path, reason).

### WF1.11 — Client Wallet for referrals and cashback

Every Client has a Wallet. Platform Admin can credit a Client Wallet (referral reward, cashback, goodwill). Client Wallet balance applies to Case payments.

- AC: Platform Admin can credit a Client Wallet via a manual posting flow — Client Wallet credit, matched by a debit on `Platform Credits Issued` (Bookkeeping Account). Audited; reason captured.
- AC: At payment time, the Client sees their available Wallet balance and a toggle to apply some / all of it; the remainder charges the payment method.
- AC: A 100%-Wallet-paid Case is treated as paid in full — the Case advances normally, and the Base Fee / Partner Share / Top-up postings happen exactly as in WF1.5 / WF1.6 (the Client Wallet acts as the funding source instead of a card).
- AC: Clients cannot cash out their Wallet — the cash-out CTA does not exist for them.
- AC: Client Wallet credits have no expiry in V1 (revisit post-V1 if abuse emerges).

### WF1.12 — Bookkeeping Accounts

The Platform is not an entity (see ADR-0003). To preserve the double-entry invariant, the ledger uses four named Bookkeeping Accounts that absorb the Platform side of every posting. These are internal accounts, owned by no entity, not user-facing.

| Bookkeeping Account | Postings landing here |
|---|---|
| `Platform Revenue` | Credit: `Base Fee − Partner Share` at Case payment (Fixed/Tiered); platform share at FX-Partner settlement. Debit: refund reversals (when the original posting was clean), Originator Commission payouts at FX-Partner settlement. |
| `Pending FX Revenue` | Credit: expected platform share at FX Case payment. Debit: closes out when the FX Partner settles a batch (offsetting credit lands in `Platform Revenue`). |
| `Refunds Issued` | Debit: refund issued by Platform Admin where the original posting cannot cleanly reverse (Wallet already paid out). Kept separate from `Platform Revenue` so refunds do not pollute revenue reporting. |
| `Platform Credits Issued` | Debit: every Client Wallet credit posted by Platform Admin for non-Case reasons (referrals, cashback, goodwill). |

- AC: The four accounts are platform genesis singletons — created once, never deleted.
- AC: Bookkeeping Accounts are visible only in the Platform Admin financial dashboard.
- AC: Adding a new named Bookkeeping Account in the future (e.g., `VAT Collected` post-V1) requires a platform release; Modules cannot declare new Bookkeeping Accounts via their Manifest.

### WF1.13 — Ledger and audit invariant

Every Wallet transaction is an immutable, double-entry Ledger Entry. Every Ledger Entry has exactly one debit and one credit, each posting against either a Wallet or a Bookkeeping Account.

- AC: Posted entries are never mutated; corrections are reversal entries plus a fresh entry.
- AC: Each entry records: timestamp, type, amount, debit account (Wallet or Bookkeeping Account), credit account (Wallet or Bookkeeping Account), Case ID (if any), actor, reason (free-text where relevant).
- AC: A Wallet's `Available + Pending = Σ of its postings` at all times.
- AC: For each Bookkeeping Account, `Σ debits − Σ credits = current accumulated balance`.
- AC: Daily reconciliation: the system computes both invariants and surfaces any drift in the Platform Admin queue.

## Open questions

- **WO4 (carryover from v0.1):** Agency-affiliated Agents cannot satisfy Module 0 R1.3's clean-state gate until monthly settlement. Stakeholder confirmation needed that Agent-initiated transitions out of an Agency happening only at or after month-end is acceptable.
- **WO5 (new):** FX-Partner settlement cadence — monthly batch, per-Case real-time, or something in between — depends on partner agreements not yet finalised. Platform-Admin batch posting (WF1.6) accommodates any cadence, but V1.1 API integration should target the actual partner cadence once known.
- **WO6 (new):** Whether Partner-side `partner_share_pct` for FX should permit per-FX-Partner overrides in V1.1 (Non-Goal #5 defers this; revisit if multiple FX brokers with different commercial terms onboard).

## Cross-references back to Module 0

- `M0:R1.1` — role context. **WF1.1** scopes Wallet view to active role.
- `M0:R1.3` — Agent clean-state gate. **WF1.7 / WF1.8 / WF1.9** define the Wallet-side condition (`Available = 0`, no in-flight cash-out). For Agency-affiliated Agents, the gate effectively unlocks only at monthly settlement — see WO4.
- `M0:R1.5` — Business creation, Business Wallet, suspended-Business Wallet freeze. **WF1.1 + WF1.9** consume this.
- `M0:R3.1` — Module Manifest. **WF1.2** consumes the Fee Model declaration and its parameters.
- `M0:R3.6` — per-Business Module enable / disable pattern. **WF1.4** mirrors this for the per-`(Module, Agency)` Top-up Cap.
- `M0:R8.3` — Zoho cash-out hand-off. **WF1.7 + WF1.9** consume this.
- `M0:F6` — leave / remove a Business membership. **WF1.8 + WF1.9** define when an Agency-affiliated Agent can satisfy the clean-state gate.
