# `roles-and-access` — backbone context (Module 0)

The authorization domain. Owns Roles, Role grants, the Solo-vs-member Agent state, and the Active Role Context (the ActiveRoleContext value object is OWNED here, moved out of the shared kernel; the kernel keeps only an opaque RoleContextHandle id). Switched via the role switcher. Enforces permissions/data-visibility/wallet-view scoped to the Active Role Context, Platform-Admin exclusivity, and the case-level Agent-cannot-be-Client conflict via a domain PolicyEvaluator plus a NestJS guard/interceptor. PORT PLACEMENT: domain/ports holds repository ports and the pure PolicyEvaluator domain service; AuditLogPublisher and ModuleRoleCatalogReader are application/ports.

## Aggregates
- RoleGrantSet
- ActiveRoleContext

## Value objects
- Role
- RoleScope (platform | business)
- RoleSource (Module 0 | module key)
- AgentAffiliationState (Solo | Member-of-Agency)
- ActiveRoleContext (owned here)
- RoleContextHandle (opaque id; kernel-level)
- Permission
- AccessDecision

## Domain events
- RoleGranted
- RoleRevoked
- PlatformScopedRoleSelfGranted
- ActiveRoleContextSwitched
- RoleConflictPrevented

## Ports
- domain/ports: RoleGrantRepository, ActiveRoleContextRepository; domain service: PolicyEvaluator (pure)
- application/ports: AuditLogPublisher, ModuleRoleCatalogReader

## Adapters (infrastructure)
- PostgresRoleGrantRepository
- RedisActiveRoleContextCache
- RoleSwitcherHttpController
- SettingsRolesController
- NestRolesGuard
- ActiveRoleContextInterceptor
- RequestContextMiddleware

---
**Layering:** `domain` → `application` → `infrastructure` (dependencies point inward).
`domain/ports` = repository ports only; all I/O ports live in `application/ports`.
Aggregates *record* domain events via the kernel `AggregateRoot` — they never publish.
See [`docs/ARCHITECTURE.md`](../../../../../docs/ARCHITECTURE.md).

