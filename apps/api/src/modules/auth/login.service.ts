import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { CLOCK, type Clock } from '../../shared/clock/clock'
import { OtpService } from './otp.service'
import { SessionService } from './session.service'
import { dashboardForRole, isE164 } from './auth.helpers'
import type { LoginResult, OtpRequestResult } from './auth.types'

/**
 * The returning-user mobile login path (F2): an SMS OTP proves control of a
 * mobile that already has an account, and a correct code mints a fresh session
 * for the user's last-used role. An unrecognised number is rejected up front so
 * the UI can offer registration instead of silently sending a code to a
 * non-account.
 */
@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otp: OtpService,
    private readonly session: SessionService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Send a login OTP — but only to a number that already has an account. An
   *  unknown number yields 404 so the UI can route to registration (F2 branch). */
  async requestOtp(mobile: string): Promise<OtpRequestResult> {
    if (!isE164(mobile)) {
      throw new BadRequestException('mobile must be a valid E.164 number (e.g. +971500000000)')
    }
    const individual = await this.prisma.individual.findUnique({ where: { mobile } })
    if (!individual) {
      throw new NotFoundException("We don't see an account for this number")
    }
    return this.otp.request(mobile)
  }

  /** Verify the code and, on success, mint a session for the last-used role. The
   *  challenge is consumed so a code can mint exactly one session. */
  async verify(mobile: string, code: string): Promise<LoginResult> {
    const challenge = await this.otp.checkCode(mobile, code)

    const individual = await this.prisma.individual.findUnique({ where: { mobile } })
    if (!individual) {
      // The account vanished between request and verify — treat as no account.
      throw new NotFoundException("We don't see an account for this number")
    }

    const role = await this.session.lastUsedRole(individual.id)

    // Spend the challenge before issuing, so one code mints at most one session.
    const now = this.clock.now()
    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: now, consumedAt: now },
    })
    const { token } = await this.session.issue(individual.id, role)

    return { role, dashboard: dashboardForRole(role), session: { token } }
  }
}
