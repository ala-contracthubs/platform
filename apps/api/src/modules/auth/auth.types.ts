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
