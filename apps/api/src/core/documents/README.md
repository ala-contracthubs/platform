# `documents` — backbone context (Module 0)

GENERIC documents-as-a-platform-primitive — knows NOTHING of POA. Per-Case upload, replace, version history, download. Enforces formats (PDF, JPG, PNG, DOCX), max 25MB, encryption at rest (S3 + KMS), pre-signed URLs gated on Active Role Context, a GENERIC markImmutable() capability, plus generic document-template and required-document-checklist consumption ports declared by Module Manifests. The backbone knows only 'a versioned, encrypted, format/size-constrained document with an optional immutability flag set by its owning context'; it does NOT name Final POA, POA Draft, or POA retention rules — those semantics live in the POA module (poa-drafting / session-completion) which call this primitive and decide WHEN to markImmutable(). This is the SINGLE storage primitive: it owns the only S3KmsDocumentStoreAdapter, PreSignedUrlIssuer, encryption, versioning and Active-Role-Context gating; modules consume DocumentStorePort for ALL bytes and own zero AWS-SDK imports. PORT PLACEMENT: domain/ports holds the metadata repository; DocumentStore/DocumentTemplateProvider/ChecklistDefinitionReader/VirusScanPort/ClockPort are application/ports.

## Aggregates
- DocumentSet
- Document
- DocumentVersion

## Value objects
- FileFormat (PDF|JPG|PNG|DOCX)
- FileSize (<=25MB)
- DocumentVersionNumber
- ChecklistItem
- ChecklistRequirementState
- PreSignedUrl
- EncryptionKeyRef
- DocumentTemplateRef
- ImmutabilityFlag (generic; set by owning context)
- RetentionPolicyWindow (generic; PDPL statutory window, no POA-specific rule)

## Domain events
- DocumentUploaded
- DocumentReplaced
- DocumentVersioned
- DocumentFlaggedNeedsRevision
- RequiredChecklistSatisfied
- DocumentDownloaded
- DocumentMadeImmutable (generic)

## Ports
- domain/ports: DocumentRepository
- application/ports: DocumentStore, DocumentTemplateProvider, ChecklistDefinitionReader, VirusScanPort, ClockPort

## Adapters (infrastructure)
- S3KmsDocumentStoreAdapter (the only S3/KMS document adapter in the system)
- PostgresDocumentMetadataRepository
- DocumentHttpController
- PreSignedUrlIssuer
- TemplateMergeAdapter
- VirusScanAdapter

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

