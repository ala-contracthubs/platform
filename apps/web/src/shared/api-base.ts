/**
 * API request URLs. The web app and the API are served from different hosts in
 * stage/prod (`platform.*` vs `api.*`), and the web origin's CDN serves only the
 * static SPA — it rejects non-GET methods. So requests must go to the API host
 * directly. `VITE_API_BASE_URL` carries that host, injected at build time; it is
 * empty in dev, where requests stay same-origin and Vite's proxy forwards
 * `/auth` and `/health` to the local API.
 */

/** Join the configured API base with an absolute request `path`. A trailing
 *  slash on the base is trimmed so the result never doubles `//`. */
export function joinApiUrl(base: string | undefined, path: string): string {
  return `${(base ?? '').replace(/\/$/, '')}${path}`
}

/** The request URL for an API `path`, prefixed with `VITE_API_BASE_URL` when set. */
export function apiUrl(path: string): string {
  return joinApiUrl(import.meta.env.VITE_API_BASE_URL, path)
}
