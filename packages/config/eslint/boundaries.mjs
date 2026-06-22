/**
 * Module-boundary element definitions + rules for eslint-plugin-boundaries.
 *
 * Encodes the structurally-enforceable subset of the ContractHubs hexagonal +
 * DDD boundary rules. The finer-grained invariants (finance sub-boundaries,
 * module-vs-module isolation by captured name, the cross-core synchronous-query
 * allowlist) are reinforced by the architecture edge tests in
 * apps/api/test/arch — see docs/ARCHITECTURE.md for the full matrix.
 *
 * Element types (most specific patterns first):
 *   kernel        apps/api/src/shared/kernel/**            (importable by everyone, incl. domain)
 *   shared-infra  apps/api/src/shared/{platform,audit,request-context}/**  (NEVER importable by domain)
 *   finance-*     apps/api/src/core/finance/<sub>/<layer>/**               (subdomain-structured)
 *   core-*        apps/api/src/core/<context>/<layer>/**
 *   module-*      apps/api/src/modules/<module>/<sub>/<layer>/**
 */
export const elements = [
  { type: 'kernel', pattern: 'apps/api/src/shared/kernel/*', mode: 'folder' },
  { type: 'shared-infra', pattern: 'apps/api/src/shared/platform/*', mode: 'folder' },
  { type: 'shared-infra', pattern: 'apps/api/src/shared/audit', mode: 'folder' },
  { type: 'shared-infra', pattern: 'apps/api/src/shared/request-context', mode: 'folder' },

  // finance is subdomain-structured (one extra path segment) — match it before generic core
  { type: 'finance-domain', pattern: 'apps/api/src/core/finance/*/domain/*', mode: 'folder', capture: ['sub'] },
  { type: 'finance-app', pattern: 'apps/api/src/core/finance/*/application/*', mode: 'folder', capture: ['sub'] },
  { type: 'finance-infra', pattern: 'apps/api/src/core/finance/*/infrastructure/*', mode: 'folder', capture: ['sub'] },

  // notifications is also subdomain-structured
  { type: 'core-domain', pattern: 'apps/api/src/core/notifications/*/domain/*', mode: 'folder', capture: ['context'] },
  { type: 'core-app', pattern: 'apps/api/src/core/notifications/*/application/*', mode: 'folder', capture: ['context'] },
  { type: 'core-infra', pattern: 'apps/api/src/core/notifications/*/infrastructure/*', mode: 'folder', capture: ['context'] },

  // standard (single-layered) backbone contexts
  { type: 'core-domain', pattern: 'apps/api/src/core/*/domain/*', mode: 'folder', capture: ['context'] },
  { type: 'core-app', pattern: 'apps/api/src/core/*/application/*', mode: 'folder', capture: ['context'] },
  { type: 'core-infra', pattern: 'apps/api/src/core/*/infrastructure/*', mode: 'folder', capture: ['context'] },

  // module subdomains
  { type: 'module-domain', pattern: 'apps/api/src/modules/*/*/domain/*', mode: 'folder', capture: ['module', 'sub'] },
  { type: 'module-app', pattern: 'apps/api/src/modules/*/*/application/*', mode: 'folder', capture: ['module', 'sub'] },
  { type: 'module-infra', pattern: 'apps/api/src/modules/*/*/infrastructure/*', mode: 'folder', capture: ['module', 'sub'] },
]

const BACKBONE = ['core-domain', 'core-app', 'core-infra', 'finance-domain', 'finance-app', 'finance-infra']
const MODULE = ['module-domain', 'module-app', 'module-infra']
const DOMAIN = ['core-domain', 'finance-domain', 'module-domain']

/**
 * default: 'allow' — we forbid the *bad* edges rather than whitelist every good
 * one. This keeps the rule honest and maintainable; intra-context and
 * inward-pointing imports are allowed by default.
 */
export const elementTypesRule = {
  default: 'allow',
  rules: [
    {
      from: BACKBONE,
      disallow: MODULE,
      message: 'The backbone (core/**) must never import a Module (modules/**).',
    },
    {
      from: MODULE,
      disallow: ['core-infra', 'finance-infra'],
      message: 'A Module imports only backbone ports/contracts/events — never backbone infrastructure.',
    },
    {
      from: MODULE,
      disallow: [['module-domain', { module: '!${module}' }], ['module-app', { module: '!${module}' }], ['module-infra', { module: '!${module}' }]],
      message: 'A Module must not import another Module; integrate via the backbone (Manifest contract / domain events).',
    },
    {
      from: DOMAIN,
      disallow: ['shared-infra'],
      message: 'The domain layer must not import shared/platform, shared/audit, or shared/request-context.',
    },
  ],
}

/** no-restricted-imports patterns applied to every `**\/domain\/**` file. */
export const domainRestrictedImports = {
  patterns: [
    { group: ['@nestjs/*', '@nestjs'], message: 'domain must not import NestJS.' },
    { group: ['typeorm', '@mikro-orm/*', 'prisma', '@prisma/*', 'sequelize'], message: 'domain must not import an ORM.' },
    { group: ['@aws-sdk/*', 'aws-sdk'], message: 'domain must not import an AWS SDK.' },
    { group: ['**/shared/platform/*', '**/shared/audit', '**/shared/audit/*', '**/shared/request-context'], message: 'domain must not import shared/platform, shared/audit, or shared/request-context.' },
  ],
}
