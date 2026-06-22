# `identity` — backbone context (Module 0)

Authentication only. Owns the Individual aggregate (the only thing that can log in), registration via mobile+SMS OTP and UAE Pass (OIDC -> Emirates ID), login, session lifecycle, the Canonical Identifier, and the UUID->Emirates-ID merge. Authorization lives in roles-and-access; the Verification Status machine lives in verification. PORT PLACEMENT: domain/ports holds only repository ports; IdentityProvider/SmsOtpSender/TokenIssuer/ClockPort are I/O ports in application/ports.

## Aggregates
- Individual
- Session
- OtpChallenge

## Value objects
- CanonicalIdentifier
- EmiratesId
- MobileNumber (E.164)
- EmailAddress
- OtpCode
- UaePassPayload
- VerifiedName
- IdentityAlias (retired UUID)
- RegistrationPath (mobile | uae_pass)

## Domain events
- IndividualRegistered
- MobileVerified
- UaePassLinked
- CanonicalIdentifierMerged
- SessionStarted
- SessionExpired
- SuspiciousActivityDetected

## Ports
- domain/ports: IndividualRepository, SessionRepository, OtpChallengeRepository
- application/ports: IdentityProvider, SmsOtpSender, TokenIssuer, ClockPort, DomainEventPublisher

## Adapters (infrastructure)
- UaePassOidcAdapter
- SmsOtpAdapter
- Argon2PasswordlessAdapter
- PostgresIndividualRepository
- RedisSessionStore
- RedisOtpChallengeStore
- IdentityHttpController
- AuthGuardPassportStrategy

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

