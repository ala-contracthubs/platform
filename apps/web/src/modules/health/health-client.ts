import { apiUrl } from '../../shared/api-base'
import type { HealthReport } from './health.types'

/** Calls the API's GET /health (same-origin via the Vite proxy in dev; the API
 *  host in stage/prod via VITE_API_BASE_URL). */
export async function fetchHealth(): Promise<HealthReport> {
  const res = await fetch(apiUrl('/health'))
  if (!res.ok) {
    throw new Error(`Health request failed: ${res.status}`)
  }
  return (await res.json()) as HealthReport
}
