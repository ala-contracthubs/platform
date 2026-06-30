import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LoginPage } from './login-page'
import { LoginError, type LoginApi } from './login-client'
import type { LoginResult } from './login.types'

afterEach(cleanup)

const clientResult: LoginResult = {
  role: 'CLIENT',
  dashboard: '/client',
  session: { token: 'sess' },
}

/** A fake API whose calls succeed by default; override per test for edge cases. */
function fakeApi(overrides: Partial<LoginApi> = {}): LoginApi {
  return {
    requestOtp: vi.fn(async () => ({ challengeId: 'c1', expiresAt: '2026-06-30T12:05:00.000Z' })),
    verifyOtp: vi.fn(async () => clientResult),
    checkSession: vi.fn(async () => ({ status: 'invalid' as const })),
    ...overrides,
  }
}

function typeInto(label: RegExp, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

/** Drive phone entry → land on the code step, returning the code input. */
async function reachOtpStep(api: LoginApi, props: Record<string, unknown> = {}): Promise<HTMLElement> {
  render(<LoginPage api={api} {...props} />)
  typeInto(/mobile number/i, '+971500000000')
  fireEvent.click(screen.getByRole('button', { name: /send code/i }))
  return screen.findByLabelText(/verification code/i)
}

describe('LoginPage — returning user via OTP (AC1)', () => {
  it('requests a code, verifies it, and reports the session for the last-used role', async () => {
    const onComplete = vi.fn()
    const api = fakeApi()
    await reachOtpStep(api, { onComplete })

    typeInto(/verification code/i, '123456')
    fireEvent.click(screen.getByRole('button', { name: /^log in|^verify/i }))

    await waitFor(() => expect(api.verifyOtp).toHaveBeenCalledWith('+971500000000', '123456'))
    expect(api.requestOtp).toHaveBeenCalledWith('+971500000000')
    expect(onComplete).toHaveBeenCalledWith(clientResult)
  })
})

describe('LoginPage — unrecognized number (AC3)', () => {
  it('shows "no account" with Continue to register (pre-filling the number) and Try a different number', async () => {
    const onRegister = vi.fn()
    const api = fakeApi({
      requestOtp: vi.fn(async () => {
        throw new LoginError("We don't see an account for this number", 404)
      }),
    })
    render(<LoginPage api={api} onRegister={onRegister} />)

    typeInto(/mobile number/i, '+971509999999')
    fireEvent.click(screen.getByRole('button', { name: /send code/i }))

    expect(await screen.findByText(/don't see an account/i)).toBeTruthy()

    // Continue to register hands the attempted number back to the host to pre-fill.
    fireEvent.click(screen.getByRole('button', { name: /continue to register/i }))
    expect(onRegister).toHaveBeenCalledWith('+971509999999')
  })

  it('returns to phone entry on "Try a different number"', async () => {
    const api = fakeApi({
      requestOtp: vi.fn(async () => {
        throw new LoginError("We don't see an account for this number", 404)
      }),
    })
    render(<LoginPage api={api} />)

    typeInto(/mobile number/i, '+971509999999')
    fireEvent.click(screen.getByRole('button', { name: /send code/i }))
    await screen.findByText(/don't see an account/i)

    fireEvent.click(screen.getByRole('button', { name: /try a different number/i }))

    // Back on phone entry, no longer showing the no-account message.
    expect(screen.getByLabelText(/mobile number/i)).toBeTruthy()
    expect(screen.queryByText(/don't see an account/i)).toBeNull()
  })
})

describe('LoginPage — edge cases', () => {
  it('surfaces the lockout message after too many wrong attempts (429)', async () => {
    const api = fakeApi({
      verifyOtp: vi.fn(async () => {
        throw new LoginError('Too many attempts. Try again after 2026-06-30T12:10:00.000Z.', 429)
      }),
    })
    await reachOtpStep(api)

    typeInto(/verification code/i, '000000')
    fireEvent.click(screen.getByRole('button', { name: /^log in|^verify/i }))

    expect(await screen.findByText(/too many attempts/i)).toBeTruthy()
  })

  it('lets the user resend the code by re-requesting an OTP', async () => {
    const api = fakeApi()
    await reachOtpStep(api)
    expect(api.requestOtp).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /resend/i }))

    await waitFor(() => expect(api.requestOtp).toHaveBeenCalledTimes(2))
  })

  it('pre-fills the number and shows a notice when re-authentication is required (AC2)', () => {
    const api = fakeApi()
    render(
      <LoginPage api={api} initialMobile="+971500000000" notice="Your session expired. Please log in again." />,
    )

    expect((screen.getByLabelText(/mobile number/i) as HTMLInputElement).value).toBe('+971500000000')
    expect(screen.getByText(/session expired/i)).toBeTruthy()
  })
})
