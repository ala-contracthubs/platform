/** Contract shared with the API's POST /auth/registration surface.
 *  Dates arrive as ISO strings over the wire (JSON has no Date). */

/** The two self-service roles a user can pick at registration. */
export type RegistrationRole = 'CLIENT' | 'AGENT'

/** Result of requesting an OTP for a mobile number. */
export interface OtpRequestResult {
  challengeId: string
  expiresAt: string
}

/** Result of verifying an OTP: a one-shot token that authorises account creation. */
export interface OtpVerifyResult {
  verificationToken: string
}

/** Result of a completed registration. */
export interface RegistrationResult {
  individual: { id: string; mobile: string }
  role: RegistrationRole
  agentState: string | null
  session: { token: string }
  dashboard: string
}
