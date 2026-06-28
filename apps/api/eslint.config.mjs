// apps/api ESLint config. Base preset + the flat peer-module boundaries
// (a module must not import another module; shared/** must not import a module).
import base from '@contracthubs/config/eslint'
import { moduleBoundaries } from '@contracthubs/config/eslint/boundaries'

export default [...base, ...moduleBoundaries]
