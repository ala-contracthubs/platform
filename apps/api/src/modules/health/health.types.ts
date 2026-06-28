/** Shape of the GET /health response — the contract the web app consumes. */
export type ServiceStatus = 'up' | 'down'

export interface HealthReport {
  status: 'ok' | 'degraded'
  api: ServiceStatus
  db: ServiceStatus
}
