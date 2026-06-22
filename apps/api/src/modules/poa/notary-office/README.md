# `poa/notary-office`

POA-specific extensions to the notary_office Business sub-type and its fulfilment. NotaryOfficePoaProfile is a SEPARATE POA-module aggregate KEYED BY BusinessId (default Operator capacity, translation-capable flag, notarial-video-system label, active/paused curation, max_in_flight_cases) — it is NOT a projection of, nor a write into, the backbone Business aggregate. It READS Business identity/status ONLY through BusinessLookupPort and never imports the Business aggregate. Owns the office's draft-review queue, exactly-one-Notary-office-per-Case assignment at #4a->#5 (round-robin across active offices, in-flight load as secondary fairness, translation-capable filter when English add-on intent set, Platform-Admin-only manual reassignment, no post-payment reassignment for translation), the Acting Operator (set at draft pickup) and Session Operator (defaults to Acting). The actual Partner slot on the Case is set by REQUESTING the backbone via case-lifecycle's port; the Partner Share lands in this Business's Wallet via the backbone finance PaymentIntent reaction to CasePaid — the POA module never references WalletRepository or the Wallet aggregate directly. Value objects: TranslationCapableFlag, ActingOperatorRef, SessionOperatorRef, ReassignmentReason, max_in_flight_cases.

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

