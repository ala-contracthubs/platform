import { defineConfig } from '@hey-api/openapi-ts'

// Generates the typed REST client from the API's OpenAPI document.
// The api app emits `openapi.json` (via @nestjs/swagger) — point `input` at it
// once the API exposes its spec, then run `pnpm --filter @contracthubs/api-client generate`.
export default defineConfig({
  input: '../../apps/api/openapi.json',
  output: {
    path: './src/generated',
    format: 'prettier',
  },
})
