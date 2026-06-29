import type { RegistrationRole } from '../registration/registration.types'

const COPY: Record<RegistrationRole, { heading: string; blurb: string }> = {
  CLIENT: {
    heading: 'Client dashboard',
    blurb: 'Your client workspace will appear here.',
  },
  AGENT: {
    heading: 'Agent dashboard',
    blurb: 'Your solo agent workspace will appear here.',
  },
}

/** Post-registration landing stub for the picked role. Full dashboards are out
 *  of scope for F1 (issue #3) — this just proves the user lands in the right
 *  place. */
export function Dashboard({ role }: { role: RegistrationRole }) {
  const { heading, blurb } = COPY[role]
  return (
    <main>
      <h1>{heading}</h1>
      <p>{blurb}</p>
    </main>
  )
}
