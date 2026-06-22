# `poa/poa-payment-addons`

POA-side payment orchestration and add-on logic at #10 (distinct from the backbone finance ledger which owns the postings). Owns the per-Principal Passport-Based Notarisation Add-on (mandatory for non-residents, opt-in for residents, count-based 0..max_principals, +200 AED each), the per-Case English Translation Add-on (pre-set from #2 intent, switch-off-free, switch-on only if assigned office translation-capable, +250 AED), payment-screen line-item assembly (Base Fee single number, Agent Top-up one line, add-on lines, Client Wallet credit, bundled total), the non-resident payment-blocking validation with server auto-correct of passport_notarisation, and raising the payment intent to finance via PaymentIntentPort. Value objects: PassportNotarisationAddon(per Principal, +200 AED), EnglishTranslationAddon(+250 AED), TranslationCapabilityGate. Reacts to CasePaid to advance #10->#11.

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

