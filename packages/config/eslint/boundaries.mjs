/**
 * Module-boundary element definitions + rules for eslint-plugin-boundaries.
 *
 * The platform's architecture (see CLAUDE.md) is a FLAT set of peer modules:
 * each app is `src/modules/<module>/**` plus cross-cutting `src/shared/**` and a
 * thin composition root (`src/*.ts`, e.g. main.ts / app.module.ts). There is no
 * asymmetric foundational layer and no DDD domain/application/infrastructure
 * stratification — the old rules that encoded that were dormant and would
 * mis-fire once real `.ts` landed in apps/api, so they are gone.
 *
 * Patterns are APP-RELATIVE: they assume ESLint runs with the app root as cwd
 * (which is how Turborepo runs each app's `lint` script). Spread `moduleBoundaries`
 * into an app's eslint.config.mjs to opt in.
 *
 * Element types (most specific patterns first):
 *   module   src/modules/<module>/**   (captures `module`)
 *   shared   src/shared/**
 *   app      src/*                       (composition root)
 */
import boundaries from 'eslint-plugin-boundaries'

export const elements = [
  { type: 'module', pattern: 'src/modules/*', mode: 'folder', capture: ['module'] },
  { type: 'shared', pattern: 'src/shared/*', mode: 'folder' },
  { type: 'app', pattern: 'src/*', mode: 'file' },
]

/**
 * default: 'allow' — forbid the *bad* edges rather than whitelist every good
 * one. The composition root (app) may import anything; every element may import
 * shared; only the two cross-cutting violations below are errors.
 */
export const elementTypesRule = {
  default: 'allow',
  rules: [
    {
      from: ['module'],
      // a module importing a *different* module (the captured name differs)
      disallow: [['module', { module: '!${module}' }]],
      message:
        'A module must not import another module ("${dependency.module}"). ' +
        'Modules are isolated peers — integrate via the composition root or shared/**.',
    },
    {
      from: ['shared'],
      disallow: ['module'],
      message:
        'shared/** must not import a module ("${dependency.module}"). ' +
        'shared is cross-cutting and sits below the modules that depend on it.',
    },
  ],
}

/**
 * Ready-to-spread flat-config block enforcing the flat peer-module boundaries.
 * Apply inside an app whose source lives under `src/` (cwd = app root).
 */
export const moduleBoundaries = [
  {
    files: ['src/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': elements,
      'boundaries/include': ['src/**/*.ts'],
      // resolve extensionless relative imports (../shared/x -> x.ts) so the
      // plugin can classify dependencies; the node resolver ships with eslint.
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx', '.js', '.json'] },
      },
    },
    rules: {
      'boundaries/element-types': ['error', elementTypesRule],
      'boundaries/no-unknown-files': 'off',
    },
  },
]
