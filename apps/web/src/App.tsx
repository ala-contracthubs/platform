import { useEffect, useState } from 'react'
import { LoginPage } from './modules/login/login-page'
import { loginApi as defaultLoginApi, type LoginApi } from './modules/login/login-client'
import type { LoginRole } from './modules/login/login.types'
import {
  localSessionStore,
  type SessionStore,
} from './modules/login/session-store'
import { RegistrationPage } from './modules/registration/registration-page'
import {
  registrationApi as defaultRegistrationApi,
  type RegistrationApi,
} from './modules/registration/registration-client'
import { Dashboard } from './modules/dashboard/dashboard'

const EXPIRED_NOTICE = 'Your session expired. Please log in again.'

type Route =
  | { name: 'checking' }
  | { name: 'login'; initialMobile?: string; notice?: string }
  | { name: 'register'; initialMobile?: string }
  | { name: 'dashboard'; role: LoginRole }

/**
 * Composition root and session router for Module 0's web auth. On load it asks
 * the API whether the stored token is still a live session (R1.2): active →
 * straight to the dashboard, expired → login with a re-auth notice, none/invalid
 * → the login welcome. It also wires the F2 login flow, the "no account → register"
 * hand-off (F2 branch), and registration (F1) — persisting the session token on
 * any successful authentication. The APIs and the token store are injectable for
 * tests.
 */
export function App({
  loginApi = defaultLoginApi,
  registrationApi = defaultRegistrationApi,
  sessionStore = localSessionStore,
}: {
  loginApi?: LoginApi
  registrationApi?: RegistrationApi
  sessionStore?: SessionStore
} = {}) {
  const [route, setRoute] = useState<Route>({ name: 'checking' })

  useEffect(() => {
    const token = sessionStore.get()
    if (!token) {
      setRoute({ name: 'login' })
      return
    }
    let cancelled = false
    loginApi
      .checkSession(token)
      .then((status) => {
        if (cancelled) return
        if (status.status === 'active') {
          setRoute({ name: 'dashboard', role: status.role })
        } else if (status.status === 'expired') {
          setRoute({ name: 'login', notice: EXPIRED_NOTICE })
        } else {
          sessionStore.clear()
          setRoute({ name: 'login' })
        }
      })
      .catch(() => {
        if (!cancelled) setRoute({ name: 'login' })
      })
    return () => {
      cancelled = true
    }
  }, [loginApi, sessionStore])

  /** Persist the issued session and land on its role dashboard. */
  function land(token: string, role: LoginRole) {
    sessionStore.set(token)
    setRoute({ name: 'dashboard', role })
  }

  if (route.name === 'checking') return null
  if (route.name === 'dashboard') return <Dashboard role={route.role} />

  if (route.name === 'register') {
    return (
      <RegistrationPage
        api={registrationApi}
        initialMobile={route.initialMobile}
        onComplete={(result) => land(result.session.token, result.role)}
        onLogin={() => setRoute({ name: 'login' })}
      />
    )
  }

  return (
    <LoginPage
      api={loginApi}
      initialMobile={route.initialMobile}
      notice={route.notice}
      onComplete={(result) => land(result.session.token, result.role)}
      onRegister={(mobile) => setRoute({ name: 'register', initialMobile: mobile })}
      onCreateAccount={() => setRoute({ name: 'register' })}
    />
  )
}
