# `finance` — backbone context (subdomain-structured)

The whole financial backbone built once so Modules ship no payment code. ONE bounded context and ONE finance.module.ts, but its internal subdomains are TRUE internal contexts separated by anti-corruption boundaries: ledger (the single strongly-consistent append-only double-entry store and four named Bookkeeping Accounts; the ONLY subdomain that imports the postings persistence adapter and the ONLY writer of postings; exposes one inbound LedgerWritePort.commit(balancedBatch, idempotencyKey)); wallet (Wallet aggregate; Available+Pending DERIVES from postings via a BalanceProjection read model; suspend/freeze; cash-out eligibility); fee-model (Fixed/Tiered/Percentage Fee Models, Settlement Mode, Base Fee split, Top-up + Top-up Cap, per-Agency overrides, Manifest versioning); payments (Stripe-as-PSP behind PaymentProvider port + local-acquirer fallback, idempotent webhook, immediate-settlement case-billing batch, refunds, client-credit issuance); fx-settlement (deferred Settlement Mode — under deferred mode the ledger records ONLY the accrual: a Pending FX Revenue credit + Originator Commission held pending; real funds move OFF-PLATFORM Client->FX Partner at payment, no platform Wallet credited; the full balanced cash batch posts only at the FX-Partner Settlement Event; dispute machine); settlement (Solo-Agent cash-out lifecycle, monthly Agency settlement, continuous Partner reconciliation; OWNS the cash-out->Finance handoff CONTRACT FinanceHandoffPort whose transport adapter lives in zoho-sync); reconciliation (daily Wallet + Bookkeeping invariant checks, drift queue, Platform-Admin financial dashboard read model). SUB-BOUNDARY RULE: no subdomain references another subdomain's aggregate; payments/fx-settlement/settlement/reconciliation are CLIENTS of LedgerWritePort and may not import LedgerEntry/PostingBatch/BookkeepingAccount; ESLint forbids finance/payments importing finance/ledger/domain/aggregates and forbids any non-ledger subdomain importing the postings adapter. CROSS-CORE: finance does NOT synchronously call verification/membership/business on the money path — it consumes IndividualVerifiedVia*/MembershipCreated/MembershipEnded/BusinessSuspended into finance-LOCAL read models; it PUBLISHES WalletBalanceQuery as the strongly-consistent Clean-state-Gate read contract. IDEMPOTENCY ANCHORED IN DOMAIN: IdempotencyKey is a REQUIRED field on every money-moving command and on PostingBatch; LedgerWritePort.commit is idempotent on it (replay returns the original committed LedgerEntries, never double-posts); authoritative dedup is the ledger unique-key constraint, Redis is a fast path; the Stripe webhook gets the same WebhookVerifier+IdempotencyStore+ledger-key treatment.

## Aggregates
- LedgerEntry (ledger)
- BookkeepingAccount (ledger)
- PostingBatch (ledger; carries required IdempotencyKey)
- Wallet (wallet)
- FeeModelConfiguration (fee-model)
- CasePayment (payments)
- Refund (payments)
- FxCaseSettlement (fx-settlement)
- FxPartnerSettlementEvent (fx-settlement)
- CashOutRequest (settlement)
- AgencySettlementRun (settlement)
- PartnerReconciliationDebit (settlement)
- ClientWalletCreditGrant (payments)
- ReconciliationRun (reconciliation)

## Value objects
- Money (AED)
- Balance (Available + Pending, DERIVED via read model)
- DebitCredit
- PostingPair
- PostingType
- IdempotencyKey (required on PostingBatch + money-moving command)
- BookkeepingAccountName (Platform Revenue | Pending FX Revenue | Refunds Issued | Platform Credits Issued)
- FeeModelKind (Fixed | Tiered | Percentage)
- SettlementMode (immediate | deferred)
- BaseFee
- PartnerShare
- PlatformMargin
- TopUp
- TopUpCap
- OriginatorCommission
- ResolvedCasePricing (frozen snapshot)
- AddOnLineItem (per-Case translation; count-based per-Principal passport)
- Iban
- CashOutStatus
- RefundDestination (Client card | Client Wallet credit)
- RefundPostingPath (clean reversal | escalate)
- FxDisputeState
- DriftDelta

## Domain events
- LedgerEntryPosted
- PostingBatchCommitted
- ReversalEntryPosted
- WalletProvisioned
- WalletActivated
- WalletFrozen
- CasePricingResolved
- TopUpRejectedOverCap
- CasePaid
- PaymentFailed
- RefundPosted
- RefundEscalatedToFinance
- ClientWalletCredited
- PendingFxRevenueAccrued
- FxPartnerSettlementRecorded
- OriginatorCommissionPosted
- FxCaseDisputed
- CashOutSubmitted
- CashOutSentToFinance
- CashOutPaid
- AgencySettled
- PartnerReconciliationDebitPosted
- LedgerDriftDetected

## Ports
- domain/ports (per subdomain): LedgerRepository, BookkeepingAccountRepository, PostingBatchRepository, WalletRepository, FeeModelConfigRepository, AgencyOverrideRepository, TopUpCapRepository, CashOutRequestRepository, FxCaseSettlementRepository
- ledger inbound contract: LedgerWritePort.commit(balancedBatch, idempotencyKey) — idempotent; the single posting-write seam consumed by all other finance subdomains
- application/ports: PaymentProvider, WebhookVerifier, IdempotencyStore, BalanceProjectionPort (read model), ModuleManifestPort, FinanceHandoffPort (cash-out->Finance contract; transport adapter lives in zoho-sync), SchedulerPort, DomainEventPublisher, AuditLogPort, ClockPort
- consumed event-state ports (finance-local read models, NOT synchronous calls): VerificationStateProjection, MembershipProjection, BusinessStatusProjection
- published query contract: WalletBalanceQuery (open-host read API for the Clean-state Gate)

## Adapters (infrastructure)
- PostgresLedgerAdapter (Aurora, append-only; imported ONLY by finance/ledger)
- PostgresWalletRepository
- PostgresFeeModelRepository
- RedisIdempotencyStore
- StripePaymentProviderAdapter
- LocalAcquirerAdapter
- StripeWebhookController (idempotent: WebhookVerifier + IdempotencyStore + ledger key)
- PaymentHttpController
- WalletHttpController
- CashOutController
- FxSettlementController
- AgencySettlementController
- PartnerReconciliationController
- RefundController
- ClientCreditController
- FinancialDashboardController (read model)
- BalanceProjectionReadModel (application/queries + infrastructure/persistence; derived from postings)
- EventBridgeSchedulerAdapter
- FinanceEventStateProjector (builds finance-local read models from consumed domain events)

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

## Internal subdomains
Each is a true internal context with its own `domain/application/infrastructure`; one `finance.module.ts` composes them.
- `ledger/`
- `wallet/`
- `fee-model/`
- `payments/`
- `fx-settlement/`
- `settlement/`
- `reconciliation/`

