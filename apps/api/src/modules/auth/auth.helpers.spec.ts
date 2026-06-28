import { dashboardForRole, isE164 } from './auth.helpers'

describe('isE164', () => {
  it.each(['+971500000000', '+14155552671', '+447911123456'])('accepts %s', (value) => {
    expect(isE164(value)).toBe(true)
  })

  it.each([
    ['', 'empty'],
    ['0501234567', 'no plus / no country code'],
    ['+0500000000', 'country code starting with 0'],
    ['+12 345', 'contains a space'],
    ['+1234567890123456', 'more than 15 digits'],
    ['+abc123', 'non-digits'],
  ])('rejects %s (%s)', (value) => {
    expect(isE164(value)).toBe(false)
  })
})

describe('dashboardForRole', () => {
  it('routes a Client to the client dashboard', () => {
    expect(dashboardForRole('CLIENT')).toBe('/client')
  })

  it('routes an Agent to the agent dashboard', () => {
    expect(dashboardForRole('AGENT')).toBe('/agent')
  })
})
