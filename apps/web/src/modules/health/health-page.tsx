import { useEffect, useState } from 'react'
import { fetchHealth } from './health-client'
import type { HealthReport } from './health.types'

type State =
  { kind: 'loading' } | { kind: 'ready'; report: HealthReport } | { kind: 'error'; message: string }

/** `load` is injectable so tests can drive the component against the /health
 *  contract without touching the network; production uses fetchHealth. */
export function HealthPage({ load = fetchHealth }: { load?: () => Promise<HealthReport> }) {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let active = true
    load()
      .then((report) => {
        if (active) setState({ kind: 'ready', report })
      })
      .catch((err: unknown) => {
        if (active)
          setState({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Unknown error',
          })
      })
    return () => {
      active = false
    }
  }, [load])

  return (
    <main>
      <h1>Contract Hubs</h1>
      {state.kind === 'loading' && <p>Checking system status…</p>}
      {state.kind === 'error' && <p role="alert">{`Could not reach the API: ${state.message}`}</p>}
      {state.kind === 'ready' && (
        <>
          <p>{`Overall: ${state.report.status === 'ok' ? 'OK' : 'Degraded'}`}</p>
          <ul>
            <li>{`API: ${state.report.api}`}</li>
            <li>{`Database: ${state.report.db}`}</li>
          </ul>
        </>
      )}
    </main>
  )
}
