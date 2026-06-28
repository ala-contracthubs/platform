import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { HealthPage } from './health-page'
import type { HealthReport } from './health.types'

afterEach(cleanup)

describe('HealthPage (web contract against GET /health)', () => {
  it('renders the API and database status from the health report', async () => {
    const report: HealthReport = { status: 'ok', api: 'up', db: 'up' }

    render(<HealthPage load={async () => report} />)

    expect(await screen.findByText('API: up')).toBeTruthy()
    expect(screen.getByText('Database: up')).toBeTruthy()
    expect(screen.getByText('Overall: OK')).toBeTruthy()
  })

  it('shows a degraded status when the database is unreachable', async () => {
    const report: HealthReport = { status: 'degraded', api: 'up', db: 'down' }

    render(<HealthPage load={async () => report} />)

    expect(await screen.findByText('Database: down')).toBeTruthy()
    expect(screen.getByText('Overall: Degraded')).toBeTruthy()
  })

  it('shows an error message when the API cannot be reached', async () => {
    render(
      <HealthPage
        load={async () => {
          throw new Error('network down')
        }}
      />,
    )

    expect(await screen.findByRole('alert')).toBeTruthy()
  })
})
