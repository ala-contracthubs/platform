import { useState } from 'react'
import { registrationApi, type RegistrationApi } from './registration-client'
import type { RegistrationResult, RegistrationRole } from './registration.types'

const ROLE_CARDS: ReadonlyArray<{ role: RegistrationRole; title: string; blurb: string }> = [
  { role: 'CLIENT', title: 'Client', blurb: 'Hire agents and manage your contracts.' },
  { role: 'AGENT', title: 'Agent (solo)', blurb: 'Offer your services independently.' },
]

type Step =
  | { kind: 'phone' }
  | { kind: 'otp'; mobile: string }
  | { kind: 'role'; mobile: string; verificationToken: string }

/** The F1 mobile registration flow: enter a number → enter the SMS code → pick a
 *  role. `api` is injectable so tests drive the flow without the network;
 *  `onComplete` fires with the created account so the host can route to its
 *  dashboard. `initialMobile` pre-fills the number (e.g. carried over from a
 *  failed login of an unrecognised number); `onLogin` offers a path back to
 *  login for users who already have an account. */
export function RegistrationPage({
  api = registrationApi,
  onComplete,
  onLogin,
  initialMobile = '',
}: {
  api?: RegistrationApi
  onComplete?: (result: RegistrationResult) => void
  onLogin?: () => void
  initialMobile?: string | undefined
}) {
  const [step, setStep] = useState<Step>({ kind: 'phone' })
  const [mobile, setMobile] = useState(initialMobile)
  const [code, setCode] = useState('')
  const [role, setRole] = useState<RegistrationRole | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  /** Run an API call with shared busy/error handling; returns its result, or
   *  null if it failed (the error is surfaced and the caller stays put). */
  async function run<T>(call: () => Promise<T>): Promise<T | null> {
    setBusy(true)
    setError(null)
    try {
      return await call()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function sendCode() {
    const result = await run(() => api.requestOtp(mobile))
    if (result) {
      setCode('')
      setStep({ kind: 'otp', mobile })
    }
  }

  async function verifyCode(mobileNumber: string) {
    const result = await run(() => api.verifyOtp(mobileNumber, code))
    if (result) {
      setStep({ kind: 'role', mobile: mobileNumber, verificationToken: result.verificationToken })
    }
  }

  async function resendCode(mobileNumber: string) {
    if (await run(() => api.requestOtp(mobileNumber))) setCode('')
  }

  async function completeRegistration(verificationToken: string) {
    if (role === null) return
    const result = await run(() => api.register(verificationToken, role))
    if (result) onComplete?.(result)
  }

  return (
    <main>
      <h1>Create your account</h1>
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
          {onLogin && (
            <p>
              Already have an account?{' '}
              <button type="button" onClick={onLogin}>
                Log in
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
            Verify
          </button>
          <p>
            Didn’t get a code?{' '}
            <button type="button" onClick={() => void resendCode(step.mobile)} disabled={busy}>
              Resend code
            </button>{' '}
            or{' '}
            <button type="button" disabled title="Coming soon">
              try UAE Pass instead
            </button>
          </p>
        </form>
      )}

      {step.kind === 'role' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void completeRegistration(step.verificationToken)
          }}
        >
          <fieldset>
            <legend>How will you use Contract Hubs?</legend>
            <div role="radiogroup" aria-label="Choose your role">
              {ROLE_CARDS.map((card) => (
                <button
                  key={card.role}
                  type="button"
                  role="radio"
                  aria-label={card.title}
                  aria-checked={role === card.role}
                  onClick={() => setRole(card.role)}
                >
                  <strong>{card.title}</strong>
                  <span>{card.blurb}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <button type="submit" disabled={role === null || busy}>
            Continue
          </button>
        </form>
      )}
    </main>
  )
}
