import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { CLOCK, type Clock } from '../../shared/clock/clock'
import { dashboardForRole, generateToken } from './auth.helpers'
import type { RegistrationResult, RegistrationRole } from './auth.types'

/**
 * Turns a verified mobile into a live account: creates the Individual (with a
 * minted UUID canonical id), grants the picked role, and issues a session — all
 * in one transaction, gated on a one-shot OTP verification token.
 */
@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async register(input: {
    verificationToken: string
    role: RegistrationRole
  }): Promise<RegistrationResult> {
    const { verificationToken, role } = input
    const now = this.clock.now()

    const challenge = await this.prisma.otpChallenge.findUnique({ where: { verificationToken } })
    if (!challenge?.verifiedAt || challenge.consumedAt) {
      throw new BadRequestException('Invalid or already-used verification token')
    }

    if (await this.prisma.individual.findUnique({ where: { mobile: challenge.mobile } })) {
      throw new ConflictException('An account already exists for this mobile number')
    }

    // Agents start Solo (R1.3); Clients carry no agent state.
    const agentState = role === 'AGENT' ? 'SOLO' : null
    const sessionToken = generateToken()

    const individual = await this.prisma.$transaction(async (tx) => {
      const created = await tx.individual.create({ data: { mobile: challenge.mobile } })
      await tx.roleGrant.create({ data: { individualId: created.id, role, agentState } })
      await tx.session.create({
        data: { token: sessionToken, individualId: created.id, activeRole: role },
      })
      // One-shot: spend the verification so the token can't create a second account.
      await tx.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: now } })
      return created
    })

    return {
      individual: { id: individual.id, mobile: individual.mobile },
      role,
      agentState,
      session: { token: sessionToken },
      dashboard: dashboardForRole(role),
    }
  }
}
