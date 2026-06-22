# `poa/poa-documents`

Generates the dynamic document checklist from POA Type + per-Principal type/residency + per-Attorney type + Purpose + per-Principal passport_notarisation and tracks per-document required/upload_status/review_status. Value objects: ChecklistItem, RevisionFlagAndReason, DocumentRole. Owns the single Case-level title-deed rule for co-owned property, the passport-notarisation checklist effect, the upload-only advancement gate (#3->#4) decoupled from Operator review (#5-#6), and the needs_revision re-entry to #6. Uses the GENERIC backbone documents primitive (DocumentStorePort) for ALL S3/KMS storage, pre-signed URLs and encryption — it owns NO S3/KMS adapter and zero AWS-SDK imports; only the POA-specific checklist semantics live here.

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

