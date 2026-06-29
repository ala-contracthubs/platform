import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ + https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev proxy so the web app can call the API on the same origin (health +
    // the /auth/registration/* mobile-OTP surface).
    proxy: {
      '/health': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
  },
})
