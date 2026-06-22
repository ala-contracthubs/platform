// Root ESLint flat config. The shared preset (incl. the module-boundary rules
// that enforce core-never-imports-modules, module isolation, and the
// domain-layer import restrictions) lives in @contracthubs/config.
// Imported by relative path so this file is valid before `pnpm install`.
import contracthubs from './packages/config/eslint/index.mjs'

export default [...contracthubs]
