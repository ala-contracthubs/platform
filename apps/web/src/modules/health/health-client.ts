import type { HealthReport } from './health.types'

/** Calls the API's GET /health (proxied to the API in dev). */
export async function fetchHealth(): Promise<HealthReport> {
  const res = await fetch('/health')
  if (!res.ok) {
    throw new Error(`Health request failed: ${res.status}`)
  }
  return (await res.json()) as HealthReport
}
