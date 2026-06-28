/**
 * The platform's outbound SMS port. A cross-cutting seam: registration OTPs use
 * it now; login OTPs and member-invite deep links will reuse it. The real
 * provider is an open question (PRD O3), so only the dev stub ships in V1 — code
 * depends on this interface, never on a concrete provider.
 */
export interface SmsProvider {
  /** Deliver `message` to an E.164 number. Resolves once handed off. */
  send(to: string, message: string): Promise<void>
}

/** DI token for {@link SmsProvider} (an interface has no runtime identity). */
export const SMS_PROVIDER = Symbol('SMS_PROVIDER')
