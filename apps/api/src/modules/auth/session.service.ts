import { Inject, Injectable } from '@nestjs/common'
import type { Role } from '@prisma/client'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { CLOCK, type Clock } from '../../shared/clock/clock'
import { dashboardForRole, generateToken } from './auth.helpers'
import type { LoginChannel, SessionStatus } from './auth.types'

/** Sessions expire and require re-authentication after 30 days (R1.2). */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

/** The only login channel in V1 is mobile OTP; UAE Pass arrives in #5. */
const DEFAULT_CHANNEL: LoginChannel = 'mobile'

/**
 * Owns the authenticated session: which role context it lands in, minting it,
 * and the R1.2 lifecycle (30-day expiry → re-authentication). Registration mints
 * the first session at sign-up; login mints a fresh one for the returning user's
 * last-used role. `createdAt` is stamped from the injected clock so the expiry
 * window is deterministic under test.
 */
@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** The role context the user last operated in — the role of their most recent
   *  session, falling back to their most recent role grant for an account that
   *  has never held a session. */
  async lastUsedRole(individualId: string): Promise<Role> {
    const latest = await this.prisma.session.findFirst({
      where: { individualId },
      orderBy: { createdAt: 'desc' },
    })
    if (latest) {
      return latest.activeRole
    }
    const grant = await this.prisma.roleGrant.findFirst({
      where: { individualId },
      orderBy: { createdAt: 'desc' },
    })
    if (!grant) {
      throw new Error(`Individual ${individualId} has no role to land on`)
    }
    return grant.role
  }

  /** Mint a fresh session bound to `role`, returning its bearer token. */
  async issue(individualId: string, role: Role): Promise<{ token: string }> {
    const token = generateToken()
    await this.prisma.session.create({
      data: { token, individualId, activeRole: role, createdAt: this.clock.now() },
    })
    return { token }
  }

  /** Classify a bearer token: active (with its role), expired past the 30-day
   *  window (re-auth required), or invalid/unknown. */
  async validate(token: string): Promise<SessionStatus> {
    if (!token) {
      return { status: 'invalid' }
    }
    const session = await this.prisma.session.findUnique({ where: { token } })
    if (!session) {
      return { status: 'invalid' }
    }
    const age = this.clock.now().getTime() - session.createdAt.getTime()
    if (age >= SESSION_TTL_MS) {
      return { status: 'expired', channel: DEFAULT_CHANNEL }
    }
    return { status: 'active', role: session.activeRole, dashboard: dashboardForRole(session.activeRole) }
  }
}
