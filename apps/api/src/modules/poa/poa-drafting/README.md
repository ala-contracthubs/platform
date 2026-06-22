# `poa/poa-drafting`

Produces the bilingual POA Draft (Arabic + English): deterministic template-merge from the Manifest-declared template iterating principals[]/attorneys[] and rendering Authority Mode clauses with LOCKED vs POLISH_ALLOWED zones, plus a per-language LLM-polish pass (60s combined budget, fallback to raw template output per language on failure/timeout, audit-logged). OWNS the POA-specific Draft semantics the backbone documents primitive does NOT know about: DraftVersion versioning (raw + polished per language), one-click revert, polished surfaced by default. Stores bytes via the backbone DocumentStore port — no POA-side S3 adapter. Value objects: DraftVersion, RawTemplateOutput, LlmPolishedOutput, Language(ar|en), UnlockedZone, ChangeRequest (BoundedText(50,2000), declared locally), ActingOperatorRef, ReassignmentReason. Includes the Notary Operator draft-review workspace: atomic self-assign (sets Acting Operator, #5->#6), editing in unlocked zones, flag documents needs-revision (#7), mark ready (#8), Notary-Admin recall (#8->#6 before any Principal approves).

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

