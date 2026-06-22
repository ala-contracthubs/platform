import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static SPA built to `dist/` for S3 + CloudFront (no SSR).
// Add the TanStack Router plugin here once routing is implemented.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: { outDir: 'dist', sourcemap: true },
})
