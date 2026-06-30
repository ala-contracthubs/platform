/** Contract shared with the API's POST /auth/login/* and GET /auth/session
 *  surface. Dates arrive as ISO strings over the wire (JSON has no Date). */

/** The two self-service roles an account can land in. */
export type LoginRole = 'CLIENT' | 'AGENT'

/** The channel a returning user authenticates through. V1 ships mobile OTP only;
 *  UAE Pass (and later email) join this union as those paths land. */
export type LoginChannel = 'mobile'

/** Result of requesting a login OTP for a recognised mobile number. */
export interface OtpRequestResult {
  challengeId: string
  expiresAt: string
}

/** Result of a successful login: a fresh session bound to the last-used role. */
export interface LoginResult {
  role: LoginRole
  dashboard: string
  session: { token: string }
}

/** The state of a stored session token, as classified by GET /auth/session:
 *  `active` carries the role to land on; `expired` carries the channel to
 *  pre-select on the re-auth screen; `invalid` is an unknown / cleared token. */
export type SessionStatus =
  | { status: 'active'; role: LoginRole; dashboard: string }
  | { status: 'expired'; channel: LoginChannel }
  | { status: 'invalid' }
