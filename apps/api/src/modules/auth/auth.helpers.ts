import { randomBytes } from 'node:crypto'
import type { Role } from '@prisma/client'

/** E.164: a leading '+', a non-zero country-code digit, then up to 14 more
 *  digits (15 digits total maximum). */
const E164 = /^\+[1-9]\d{1,14}$/

export function isE164(value: string): boolean {
  return E164.test(value)
}

/** An unguessable opaque token (for verification handoff and session tokens). */
export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

/** The dashboard a user lands on for a freshly picked role. */
export function dashboardForRole(role: Role): string {
  return role === 'AGENT' ? '/agent' : '/client'
}
