import type {
  OtpRequestResult,
  OtpVerifyResult,
  RegistrationResult,
  RegistrationRole,
} from './registration.types'

/** A failed registration call, carrying the HTTP status so the UI can branch
 *  (e.g. 429 lockout → offer retry / UAE Pass) and the server's human message. */
export class RegistrationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'RegistrationError'
  }
}

/** The three calls the registration flow makes against the API. Injectable so
 *  the page can be driven in tests without touching the network. */
export interface RegistrationApi {
  requestOtp(mobile: string): Promise<OtpRequestResult>
  verifyOtp(mobile: string, code: string): Promise<OtpVerifyResult>
  register(verificationToken: string, role: RegistrationRole): Promise<RegistrationResult>
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
    throw new RegistrationError(await errorMessage(res), res.status)
  }
  return (await res.json()) as T
}

/** Production API: POSTs to the API's /auth/registration/* (proxied in dev). */
export const registrationApi: RegistrationApi = {
  requestOtp: (mobile) => postJson('/auth/registration/otp', { mobile }),
  verifyOtp: (mobile, code) => postJson('/auth/registration/verify', { mobile, code }),
  register: (verificationToken, role) =>
    postJson('/auth/registration', { verificationToken, role }),
}
