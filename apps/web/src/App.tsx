import { useState } from 'react'
import { RegistrationPage } from './modules/registration/registration-page'
import { registrationApi, type RegistrationApi } from './modules/registration/registration-client'
import type { RegistrationResult } from './modules/registration/registration.types'
import { Dashboard } from './modules/dashboard/dashboard'

/** Composition root for the F1 mobile path: run registration, then land the
 *  newly-created account on its role dashboard. `api` is injectable for tests. */
export function App({ api = registrationApi }: { api?: RegistrationApi } = {}) {
  const [account, setAccount] = useState<RegistrationResult | null>(null)

  if (account) return <Dashboard role={account.role} />
  return <RegistrationPage api={api} onComplete={setAccount} />
}
