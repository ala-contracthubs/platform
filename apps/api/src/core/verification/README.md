# `verification` — backbone context (Module 0)

Owns the per-Individual Verification Status state machine and the requireVerified() Transaction gate. UAE Pass implicit verification, passport OCR, 3-failed-attempt escalation to Pending Manual Review with Platform Admin human-in-the-loop, manual approve/reject/unverify, and the encrypted passport-image audit record. VerificationStatus/VerificationMethod/ResidencyStatus value objects are OWNED here (moved out of the shared kernel). ResidencyStatus is independent of any POA passport-notarisation choice. ManuallyApproveVerification/ManuallyRejectVerification/ManuallyUnverify are this context's published command API, invoked by platform-admin. PORT PLACEMENT: domain/ports holds only the repository port; PassportOcrService/DocumentStore/SmsInviteSender/ClockPort/notification publisher are application/ports; the passport image is stored via the backbone documents primitive (no POA-side S3 adapter).

## Aggregates
- VerificationRecord
- PassportVerificationAttempt

## Value objects
- VerificationStatus (owned here; kernel keeps none)
- VerificationMethod
- ResidencyStatus (resident | non_resident)
- EnteredIdentityFields
- OcrExtractedFields
- NameMatchResult
- DobMatchResult
- AttemptCount
- VerificationThreshold
- EncryptedPassportImageRef

## Domain events
- IndividualVerifiedViaUaePass
- IndividualVerifiedViaPassport
- PassportVerificationAttemptFailed
- VerificationEscalatedToManualReview
- VerificationManuallyApproved
- VerificationManuallyRejected
- IndividualUnverified
- ClientInvitedToVerify

## Ports
- domain/ports: VerificationRepository
- application/ports: PassportOcrService, DocumentStorePort (backbone documents), SmsInviteSender, VerificationNotificationPublisher, ClockPort

## Adapters (infrastructure)
- OcrAdapter
- PostgresVerificationRepository
- VerificationHttpController
- SmsInviteAdapter

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

