import type { AgentState, Role } from '@prisma/client'

/** The two self-service platform roles a user can pick at registration. */
export type RegistrationRole = Extract<Role, 'CLIENT' | 'AGENT'>

/** Result of requesting an OTP for a mobile number. */
export interface OtpRequestResult {
  challengeId: string
  expiresAt: Date
}

/** Result of verifying an OTP: a one-shot token that authorises account creation. */
export interface OtpVerifyResult {
  verificationToken: string
}

/** Result of a completed registration. */
export interface RegistrationResult {
  individual: { id: string; mobile: string }
  role: Role
  agentState: AgentState | null
  session: { token: string }
  dashboard: string
}

/** The channel a returning user authenticates through. V1 ships mobile OTP only;
 *  UAE Pass (and later email) join this union as those paths land. */
export type LoginChannel = 'mobile'

/** Result of a successful login: a fresh session bound to the last-used role. */
export interface LoginResult {
  role: Role
  dashboard: string
  session: { token: string }
}

/** The state of a session token, as seen by the session-check endpoint:
 *  `active` carries the role to land on; `expired` carries the channel to
 *  pre-select on the re-auth screen; `invalid` is an unknown / bogus token. */
export type SessionStatus =
  | { status: 'active'; role: Role; dashboard: string }
  | { status: 'expired'; channel: LoginChannel }
  | { status: 'invalid' }
