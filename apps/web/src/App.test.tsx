import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'
import type { RegistrationApi } from './modules/registration/registration-client'
import type { RegistrationResult } from './modules/registration/registration.types'

afterEach(cleanup)

describe('App — F1 mobile registration, end to end on the web', () => {
  it('walks phone → code → role and lands on the picked role dashboard', async () => {
    const result: RegistrationResult = {
      individual: { id: 'u1', mobile: '+971500000000' },
      role: 'AGENT',
      agentState: 'SOLO',
      session: { token: 'sess' },
      dashboard: '/agent',
    }
    const api: RegistrationApi = {
      requestOtp: vi.fn(async () => ({ challengeId: 'c1', expiresAt: '2026-06-29T12:05:00.000Z' })),
      verifyOtp: vi.fn(async () => ({ verificationToken: 'vtok' })),
      register: vi.fn(async () => result),
    }

    render(<App api={api} />)

    fireEvent.change(screen.getByLabelText(/mobile number/i), {
      target: { value: '+971500000000' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send code/i }))

    fireEvent.change(await screen.findByLabelText(/verification code/i), {
      target: { value: '123456' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^verify/i }))

    fireEvent.click(await screen.findByRole('radio', { name: /agent/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(await screen.findByRole('heading', { name: /agent dashboard/i })).toBeTruthy()
    expect(api.register).toHaveBeenCalledWith('vtok', 'AGENT')
  })
})
