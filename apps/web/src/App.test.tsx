import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'
import type { LoginApi } from './modules/login/login-client'
import type { LoginResult, SessionStatus } from './modules/login/login.types'
import { memorySessionStore } from './modules/login/session-store'
import type { RegistrationApi } from './modules/registration/registration-client'
import type { RegistrationResult } from './modules/registration/registration.types'

afterEach(cleanup)

const loginResult: LoginResult = {
  role: 'AGENT',
  dashboard: '/agent',
  session: { token: 'login-tok' },
}

const registrationResult: RegistrationResult = {
  individual: { id: 'u1', mobile: '+971500000000' },
  role: 'CLIENT',
  agentState: null,
  session: { token: 'reg-tok' },
  dashboard: '/client',
}

function fakeLoginApi(overrides: Partial<LoginApi> = {}): LoginApi {
  return {
    requestOtp: vi.fn(async () => ({ challengeId: 'c1', expiresAt: '2026-06-30T12:05:00.000Z' })),
    verifyOtp: vi.fn(async () => loginResult),
    checkSession: vi.fn(async (): Promise<SessionStatus> => ({ status: 'invalid' })),
    ...overrides,
  }
}

function fakeRegistrationApi(overrides: Partial<RegistrationApi> = {}): RegistrationApi {
  return {
    requestOtp: vi.fn(async () => ({ challengeId: 'c1', expiresAt: '2026-06-30T12:05:00.000Z' })),
    verifyOtp: vi.fn(async () => ({ verificationToken: 'vtok' })),
    register: vi.fn(async () => registrationResult),
    ...overrides,
  }
}

describe('App — session check on load (R1.2 / AC2)', () => {
  it('lands an active session straight on its role dashboard', async () => {
    const loginApi = fakeLoginApi({
      checkSession: vi.fn(
        async (): Promise<SessionStatus> => ({ status: 'active', role: 'AGENT', dashboard: '/agent' }),
      ),
    })
    render(<App loginApi={loginApi} sessionStore={memorySessionStore('stored-tok')} />)

    expect(await screen.findByRole('heading', { name: /agent dashboard/i })).toBeTruthy()
    expect(loginApi.checkSession).toHaveBeenCalledWith('stored-tok')
  })

  it('routes an expired session to login with a re-authentication notice', async () => {
    const loginApi = fakeLoginApi({
      checkSession: vi.fn(async (): Promise<SessionStatus> => ({ status: 'expired', channel: 'mobile' })),
    })
    render(<App loginApi={loginApi} sessionStore={memorySessionStore('old-tok')} />)

    expect(await screen.findByText(/session expired/i)).toBeTruthy()
    expect(screen.getByRole('heading', { name: /log in/i })).toBeTruthy()
  })

  it('shows login (no notice) when there is no stored session', async () => {
    render(<App loginApi={fakeLoginApi()} sessionStore={memorySessionStore(null)} />)

    expect(await screen.findByRole('heading', { name: /log in/i })).toBeTruthy()
    expect(screen.queryByText(/session expired/i)).toBeNull()
  })
})

describe('App — login flow (AC1)', () => {
  it('logs in and lands on the dashboard, persisting the session token', async () => {
    const store = memorySessionStore(null)
    const loginApi = fakeLoginApi()
    render(<App loginApi={loginApi} sessionStore={store} />)

    fireEvent.change(await screen.findByLabelText(/mobile number/i), {
      target: { value: '+971500000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send code/i }))

    fireEvent.change(await screen.findByLabelText(/verification code/i), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^log in/i }))

    expect(await screen.findByRole('heading', { name: /agent dashboard/i })).toBeTruthy()
    expect(store.get()).toBe('login-tok')
  })
})

describe('App — unrecognized number routes to registration (AC3)', () => {
  it('continues to registration with the attempted number pre-filled', async () => {
    const { LoginError } = await import('./modules/login/login-client')
    const loginApi = fakeLoginApi({
      requestOtp: vi.fn(async () => {
        throw new LoginError("We don't see an account for this number", 404)
      }),
    })
    render(
      <App
        loginApi={loginApi}
        registrationApi={fakeRegistrationApi()}
        sessionStore={memorySessionStore(null)}
      />,
    )

    fireEvent.change(await screen.findByLabelText(/mobile number/i), {
      target: { value: '+971509999999' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send code/i }))

    fireEvent.click(await screen.findByRole('button', { name: /continue to register/i }))

    // On the registration page, with the number carried over.
    expect(await screen.findByRole('heading', { name: /create your account/i })).toBeTruthy()
    expect((screen.getByLabelText(/mobile number/i) as HTMLInputElement).value).toBe('+971509999999')
  })
})
