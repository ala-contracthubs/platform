import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Dashboard } from './dashboard'

afterEach(cleanup)

describe('Dashboard (post-registration stub, AC4)', () => {
  it('lands a Client on the client dashboard', () => {
    render(<Dashboard role="CLIENT" />)
    expect(screen.getByRole('heading', { name: /client dashboard/i })).toBeTruthy()
  })

  it('lands an Agent on the agent dashboard', () => {
    render(<Dashboard role="AGENT" />)
    expect(screen.getByRole('heading', { name: /agent dashboard/i })).toBeTruthy()
  })
})
