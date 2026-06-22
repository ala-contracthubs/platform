# `poa/session-completion`

Session-Completion Checklist + Final POA issuance. Owns the required attestations: per-Principal identity_verified + signature_observed (the notarial-integrity gate), notarial_reading_conducted, recording_retained, and conditional english_translation_prepared. OWNS the POA-specific Final POA IMMUTABILITY semantics: it decides WHEN to call the backbone documents primitive's generic markImmutable() — the backbone does not know 'Final POA'. Value objects: SessionCompletionAttestation, FinalPoaFileSet(final_poa_ar|final_poa_en), LinkedCaseId(Shipping). Each attestation = checkbox + timestamp + actor, audit-logged; all gate the Upload Final POA action (#14). Final POA bytes are uploaded via the backbone DocumentStore port (final_poa_ar required, final_poa_en gated on the add-on, PDF-only), then marked immutable; advance to #15 (Completed); optional notarial_recording upload; the 4h checklist-completion window; and the Request-shipping CTA that creates a chained Shipping Case via a backbone Case-creation contract (no Shipping internals imported).

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

