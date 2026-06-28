/** Contract shared with the API's GET /health response. */
export type ServiceStatus = 'up' | 'down'

export interface HealthReport {
  status: 'ok' | 'degraded'
  api: ServiceStatus
  db: ServiceStatus
}
