import type { LoginRole, LoginResult, OtpRequestResult, SessionStatus } from './login.types'

/** A failed login call, carrying the HTTP status so the UI can branch — most
 *  importantly 404 (no account for this number → offer registration) — plus the
 *  server's human-readable message. */
export class LoginError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'LoginError'
  }
}

/** The calls the login flow makes against the API. Injectable so the page and
 *  the app shell can be driven in tests without touching the network. */
export interface LoginApi {
  requestOtp(mobile: string): Promise<OtpRequestResult>
  verifyOtp(mobile: string, code: string): Promise<LoginResult>
  /** Classify a stored session token: active / expired / invalid. */
  checkSession(token: string): Promise<SessionStatus>
}

/** Pull the human-readable message out of a NestJS error body
 *  (`{ message: string | string[] }`), falling back to the status. */
async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] }
    if (Array.isArray(body.message)) return body.message.join(', ')
    if (typeof body.message === 'string' && body.message.length > 0) return body.message
  } catch {
    // No / non-JSON body — fall through to the generic message.
  }
  return `Request failed (${res.status})`
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new LoginError(await errorMessage(res), res.status)
  }
  return (await res.json()) as T
}

/** Production API: talks to the API's /auth/login/* + /auth/session (proxied in
 *  dev). Session-check maps the endpoint's 200 / 401 contract to a status union
 *  rather than throwing, since expiry and absence are expected outcomes. */
export const loginApi: LoginApi = {
  requestOtp: (mobile) => postJson('/auth/login/otp', { mobile }),
  verifyOtp: (mobile, code) => postJson('/auth/login/verify', { mobile, code }),
  checkSession: async (token) => {
    const res = await fetch('/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const body = (await res.json()) as { role: LoginRole; dashboard: string }
      return { status: 'active', role: body.role, dashboard: body.dashboard }
    }
    const body = (await res.json().catch(() => ({}))) as { reason?: string; channel?: 'mobile' }
    if (body.reason === 'expired') {
      return { status: 'expired', channel: body.channel ?? 'mobile' }
    }
    return { status: 'invalid' }
  },
}
