import { useState } from 'react'
import { loginApi, LoginError, type LoginApi } from './login-client'
import type { LoginResult } from './login.types'

type Step =
  | { kind: 'phone' }
  | { kind: 'otp'; mobile: string }
  | { kind: 'no-account'; mobile: string }

/** The F2 returning-user mobile login flow: enter a number → enter the SMS code →
 *  land on the last-used role's dashboard. An unrecognised number branches to a
 *  "no account" prompt that hands the number back to the host for registration.
 *  `api` is injectable so tests drive the flow without the network; `initialMobile`
 *  and `notice` pre-fill the number and explain a forced re-authentication (R1.2
 *  session expiry); `onComplete` fires with the new session so the host can route. */
export function LoginPage({
  api = loginApi,
  onComplete,
  onRegister,
  onCreateAccount,
  initialMobile = '',
  notice,
}: {
  api?: LoginApi
  onComplete?: (result: LoginResult) => void
  onRegister?: (mobile: string) => void
  onCreateAccount?: () => void
  initialMobile?: string | undefined
  notice?: string | undefined
}) {
  const [step, setStep] = useState<Step>({ kind: 'phone' })
  const [mobile, setMobile] = useState(initialMobile)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  /** Run an API call with shared busy/error handling. Returns its result, the
   *  caught error (so callers can branch on status), or marks success/failure. */
  async function run<T>(call: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false; error: unknown }> {
    setBusy(true)
    setError(null)
    try {
      return { ok: true, value: await call() }
    } catch (err: unknown) {
      return { ok: false, error: err }
    } finally {
      setBusy(false)
    }
  }

  function surface(error: unknown) {
    setError(error instanceof Error ? error.message : 'Something went wrong')
  }

  async function sendCode() {
    const result = await run(() => api.requestOtp(mobile))
    if (result.ok) {
      setCode('')
      setStep({ kind: 'otp', mobile })
    } else if (result.error instanceof LoginError && result.error.status === 404) {
      // No account for this number — offer registration rather than an error.
      setStep({ kind: 'no-account', mobile })
    } else {
      surface(result.error)
    }
  }

  async function verifyCode(mobileNumber: string) {
    const result = await run(() => api.verifyOtp(mobileNumber, code))
    if (result.ok) onComplete?.(result.value)
    else surface(result.error)
  }

  async function resendCode(mobileNumber: string) {
    const result = await run(() => api.requestOtp(mobileNumber))
    if (result.ok) setCode('')
    else surface(result.error)
  }

  function tryDifferentNumber() {
    setError(null)
    setMobile('')
    setStep({ kind: 'phone' })
  }

  return (
    <main>
      <h1>Log in</h1>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}

      {step.kind === 'phone' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void sendCode()
          }}
        >
          <label htmlFor="mobile">Mobile number</label>
          <input
            id="mobile"
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+971500000000"
          />
          <button type="submit" disabled={busy}>
            Send code
          </button>
          {onCreateAccount && (
            <p>
              New to Contract Hubs?{' '}
              <button type="button" onClick={onCreateAccount}>
                Create an account
              </button>
            </p>
          )}
        </form>
      )}

      {step.kind === 'otp' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void verifyCode(step.mobile)
          }}
        >
          <p>{`We sent a code to ${step.mobile}.`}</p>
          <label htmlFor="code">Verification code</label>
          <input
            id="code"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button type="submit" disabled={busy}>
            Log in
          </button>
          <p>
            Didn’t get a code?{' '}
            <button type="button" onClick={() => void resendCode(step.mobile)} disabled={busy}>
              Resend code
            </button>
          </p>
        </form>
      )}

      {step.kind === 'no-account' && (
        <section aria-label="No account found">
          <p>{`We don't see an account for ${step.mobile}. Create one?`}</p>
          <button type="button" onClick={() => onRegister?.(step.mobile)}>
            Continue to register
          </button>
          <button type="button" onClick={tryDifferentNumber}>
            Try a different number
          </button>
        </section>
      )}
    </main>
  )
}
