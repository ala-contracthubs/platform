# `poa/notary-rejection`

Notary rejection of a Case: Operator rejects with reason (BoundedText(50,500), declared locally) in two windows - pre-payment (#6/#9) and post-payment (#12-#14) - requiring Notary Admin countersignature <=24h (pending_rejection marker, office-visible only, holds the Case). On countersign -> T2. Pre-payment: no refund path. Post-payment: default full_refund (Base Fee + Top-up + Translation Add-on + per-Principal Passport-Based Notarisation fees) orchestrated through the backbone finance refund flow (RefundOrchestrationPort) with Partner Shares reversed; Platform Admin can override to no_refund only with reason=suspected_fraud (audited, triggers compliance review). Value objects: RejectionReason(BoundedText(50,500)), RefundDisposition(full_refund|no_refund=suspected_fraud), pending_rejection marker.

---
`domain` → `application` → `infrastructure`, dependencies inward. `domain/ports` = repository ports only.
Part of the POA Module. See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

