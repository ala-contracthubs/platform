// Shared ESLint flat-config base for the ContractHubs platform monorepo.
//
// This is the reusable base every app spreads into its own eslint.config.mjs.
// Module-boundary enforcement is kept separate (./boundaries.mjs) because its
// patterns are app-relative and only some apps opt in.
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/.expo/**',
      '**/*.tsbuildinfo',
    ],
  },

  ...tseslint.configs.recommended,

  // Prettier owns formatting — disable conflicting stylistic rules.
  prettier,
)
