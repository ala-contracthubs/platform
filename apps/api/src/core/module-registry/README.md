# `module-registry` — backbone context (Module 0)

The module framework. Registers each Module via its Module Manifest (key, display name, Business sub-types introduced, Business-scoped roles, valid sub-statuses, the WORKFLOW CONTRACT = transition table + guard/effect IDENTIFIERS the backbone engine reads as DATA, required-document checklists, SLA defaults, commission/pricing Fee Model + add-on line items, notification triggers, Zoho mapping, verification thresholds). Owns the two-level enable/disable (global + per-Business; effective visibility = intersection), Manifest versioning + contract tests, frozen-Manifest-snapshot on in-flight Cases, and the rule that modules ship by Manifest+workflow+UI without modifying Module 0. Provides the registries other backbone contexts read; the case-lifecycle engine consumes the workflow contract from here and never imports a module package. PORT PLACEMENT: domain/ports holds repositories; ManifestValidator, ManifestNotificationPublisher and AuditLogPublisher are application/ports.

## Aggregates
- ModuleRegistration
- ModuleManifest
- PerBusinessModuleActivation

## Value objects
- ModuleKey
- ManifestVersion
- ManifestSnapshot (frozen on Case)
- DeclaredBusinessSubType
- DeclaredRole
- DeclaredSubStatusSet
- DeclaredWorkflowContract (transition table + guard/effect identifiers)
- DeclaredChecklist
- DeclaredSlaDefaults
- DeclaredFeeModel
- DeclaredAddOnLineItem
- DeclaredTriggers
- ZohoFieldMapping
- DeclaredVerificationThreshold
- GlobalEnableState
- PerBusinessEnableState
- EffectiveModuleVisibility

## Domain events
- ModuleRegistered
- ManifestVersioned
- ModuleGloballyEnabled
- ModuleGloballyDisabled
- ModuleEnabledForBusiness
- ModuleDisabledForBusiness

## Ports
- domain/ports: ModuleRegistrationRepository, PerBusinessActivationRepository
- application/ports: ManifestValidator, ManifestNotificationPublisher, AuditLogPublisher

## Adapters (infrastructure)
- PostgresModuleRegistrationRepository
- ManifestLoaderAdapter
- PlatformAdminModulesController
- BusinessAdminModulesController
- ManifestContractTestHarness

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

