// Root ESLint flat config — the shared base preset from @contracthubs/config.
// Apps add their own eslint.config.mjs (and opt into module-boundary rules);
// Turborepo runs each app's `lint` script with the app root as cwd.
// Imported by relative path so this file is valid before `pnpm install`.
import base from './packages/config/eslint/index.mjs'

export default [...base]
