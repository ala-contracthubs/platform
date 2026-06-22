# `poa/notary-internal-notes`

Notary internal notes: an append-only list of timestamped notes (author + body, InternalNote = BoundedText(0,4000) declared locally) on a POA Case, visible only to the assigned Notary office's Members (and Platform Admin for audit/compliance), never to Client or Agent, never in the case thread, never firing notifications. A separate Case field, part of the permanent record. Deliberately distinct from the case-thread context.

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

