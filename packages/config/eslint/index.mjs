// Shared ESLint flat-config preset for the ContractHubs platform monorepo.
import boundaries from 'eslint-plugin-boundaries'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { elements, elementTypesRule, domainRestrictedImports } from './boundaries.mjs'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.expo/**',
      'packages/api-client/src/generated/**',
    ],
  },

  ...tseslint.configs.recommended,

  // Module-boundary enforcement across the NestJS app (core / modules / shared).
  {
    files: ['apps/api/**/*.ts'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': elements,
      'boundaries/include': ['apps/api/src/**/*.ts'],
    },
    rules: {
      'boundaries/element-types': ['error', elementTypesRule],
      'boundaries/no-unknown-files': 'off',
    },
  },

  // The domain layer must stay free of framework / infrastructure imports.
  {
    files: ['apps/api/src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', domainRestrictedImports],
    },
  },

  // Prettier owns formatting — disable conflicting stylistic rules.
  prettier,
)
