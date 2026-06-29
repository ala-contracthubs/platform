import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RegistrationPage } from './registration-page'
import { RegistrationError, type RegistrationApi } from './registration-client'
import type { RegistrationResult } from './registration.types'

afterEach(cleanup)

const clientResult: RegistrationResult = {
  individual: { id: '11111111-1111-4111-8111-111111111111', mobile: '+971500000000' },
  role: 'CLIENT',
  agentState: null,
  session: { token: 'sess' },
  dashboard: '/client',
}

/** A fake API whose calls succeed by default; override per test for edge cases. */
function fakeApi(overrides: Partial<RegistrationApi> = {}): RegistrationApi {
  return {
    requestOtp: vi.fn(async () => ({ challengeId: 'c1', expiresAt: '2026-06-29T12:05:00.000Z' })),
    verifyOtp: vi.fn(async () => ({ verificationToken: 'vtok' })),
    register: vi.fn(async () => clientResult),
    ...overrides,
  }
}

/** Type a value into a labelled field. */
function typeInto(label: RegExp, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('RegistrationPage — phone entry (AC1)', () => {
  it('requests an OTP for a valid E.164 number and advances to code entry', async () => {
    const api = fakeApi()
    render(<RegistrationPage api={api} />)

    typeInto(/mobile number/i, '+971500000000')
    fireEvent.click(screen.getByRole('button', { name: /send code/i }))

    await waitFor(() => expect(api.requestOtp).toHaveBeenCalledWith('+971500000000'))
    expect(await screen.findByLabelText(/verification code/i)).toBeTruthy()
  })

  it('surfaces the server error and stays on phone entry when the number is rejected', async () => {
    const api = fakeApi({
      requestOtp: vi.fn(async () => {
        throw new RegistrationError('mobile must be a valid E.164 number', 400)
      }),
    })
    render(<RegistrationPage api={api} />)

    typeInto(/mobile number/i, '0501234567')
    fireEvent.click(screen.getByRole('button', { name: /send code/i }))

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText(/valid e\.164/i)).toBeTruthy()
    // Still on the phone step — no code field appeared.
    expect(screen.queryByLabelText(/verification code/i)).toBeNull()
  })
})

type ExtraProps = { onComplete?: (result: RegistrationResult) => void }

/** Drive phone entry → land on the code step, returning the code input. */
async function reachOtpStep(api: RegistrationApi, props: ExtraProps = {}): Promise<HTMLElement> {
  render(<RegistrationPage api={api} {...props} />)
  typeInto(/mobile number/i, '+971500000000')
  fireEvent.click(screen.getByRole('button', { name: /send code/i }))
  return screen.findByLabelText(/verification code/i)
}

describe('RegistrationPage — code entry (AC1, AC6)', () => {
  it('verifies the entered code and advances to the role pick', async () => {
    const api = fakeApi()
    await reachOtpStep(api)

    typeInto(/verification code/i, '123456')
    fireEvent.click(screen.getByRole('button', { name: /^verify/i }))

    await waitFor(() => expect(api.verifyOtp).toHaveBeenCalledWith('+971500000000', '123456'))
    expect(await screen.findByRole('button', { name: /continue/i })).toBeTruthy()
  })

  it('shows the expired-code message and keeps the user on the code step', async () => {
    const api = fakeApi({
      verifyOtp: vi.fn(async () => {
        throw new RegistrationError('Code expired; request a new one', 400)
      }),
    })
    await reachOtpStep(api)

    typeInto(/verification code/i, '000000')
    fireEvent.click(screen.getByRole('button', { name: /^verify/i }))

    expect(await screen.findByText(/expired/i)).toBeTruthy()
    expect(screen.getByLabelText(/verification code/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /continue/i })).toBeNull()
  })

  it('surfaces the lockout message after too many wrong attempts (429)', async () => {
    const api = fakeApi({
      verifyOtp: vi.fn(async () => {
        throw new RegistrationError('Too many attempts. Try again after 2026-06-29T12:10:00.000Z.', 429)
      }),
    })
    await reachOtpStep(api)

    typeInto(/verification code/i, '000000')
    fireEvent.click(screen.getByRole('button', { name: /^verify/i }))

    expect(await screen.findByText(/too many attempts/i)).toBeTruthy()
  })

  it('lets the user resend the code (SMS undelivered) by re-requesting an OTP', async () => {
    const api = fakeApi()
    await reachOtpStep(api)
    expect(api.requestOtp).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /resend/i }))

    await waitFor(() => expect(api.requestOtp).toHaveBeenCalledTimes(2))
  })

  it('offers a UAE Pass fallback on the code step', async () => {
    const api = fakeApi()
    await reachOtpStep(api)

    expect(screen.getByText(/uae pass/i)).toBeTruthy()
  })
})

/** Drive phone → code → land on the role-pick step. */
async function reachRoleStep(api: RegistrationApi, props: ExtraProps = {}): Promise<void> {
  await reachOtpStep(api, props)
  typeInto(/verification code/i, '123456')
  fireEvent.click(screen.getByRole('button', { name: /^verify/i }))
  await screen.findByRole('button', { name: /continue/i })
}

const continueButton = () => screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement

describe('RegistrationPage — role pick (AC2, AC5)', () => {
  it('keeps Continue disabled until a role card is selected', async () => {
    const api = fakeApi()
    await reachRoleStep(api)

    expect(continueButton().disabled).toBe(true)

    fireEvent.click(screen.getByRole('radio', { name: /client/i }))

    expect(continueButton().disabled).toBe(false)
  })

  it('registers the picked role and reports the result (AC2)', async () => {
    const agentResult: RegistrationResult = {
      ...clientResult,
      role: 'AGENT',
      agentState: 'SOLO',
      dashboard: '/agent',
    }
    const onComplete = vi.fn()
    const api = fakeApi({ register: vi.fn(async () => agentResult) })
    await reachRoleStep(api, { onComplete })

    fireEvent.click(screen.getByRole('radio', { name: /agent/i }))
    fireEvent.click(continueButton())

    await waitFor(() => expect(api.register).toHaveBeenCalledWith('vtok', 'AGENT'))
    expect(onComplete).toHaveBeenCalledWith(agentResult)
  })

  it('surfaces a 409 when an account already exists for the number', async () => {
    const api = fakeApi({
      register: vi.fn(async () => {
        throw new RegistrationError('An account already exists for this mobile number', 409)
      }),
    })
    const onComplete = vi.fn()
    await reachRoleStep(api, { onComplete })

    fireEvent.click(screen.getByRole('radio', { name: /client/i }))
    fireEvent.click(continueButton())

    expect(await screen.findByText(/already exists/i)).toBeTruthy()
    expect(onComplete).not.toHaveBeenCalled()
  })
})
