import { createHash, randomInt } from 'node:crypto'
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { CLOCK, type Clock } from '../../shared/clock/clock'
import { SMS_PROVIDER, type SmsProvider } from '../../shared/sms/sms.provider'
import { generateToken, isE164 } from './auth.helpers'
import type { OtpRequestResult, OtpVerifyResult } from './auth.types'

/** An OTP is valid for 5 minutes from issue (R1.2 / F1 edge cases). */
const OTP_TTL_MS = 5 * 60 * 1000
/** Wrong attempts allowed before the mobile is locked. */
const MAX_ATTEMPTS = 5
/** How long a mobile stays locked after exhausting its attempts. */
const LOCKOUT_MS = 10 * 60 * 1000

function lockedException(until: Date): HttpException {
  return new HttpException(
    `Too many attempts. Try again after ${until.toISOString()}.`,
    HttpStatus.TOO_MANY_REQUESTS,
  )
}

function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

/**
 * Owns the SMS-OTP challenge that proves a user controls a mobile number:
 * minting + delivering a one-time code, then verifying it under expiry and
 * lockout rules. A correct code yields a one-shot verification token that
 * registration consumes.
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async request(mobile: string): Promise<OtpRequestResult> {
    if (!isE164(mobile)) {
      throw new BadRequestException('mobile must be a valid E.164 number (e.g. +971500000000)')
    }

    const now = this.clock.now()

    // A lockout applies to the mobile, not just one challenge — so it can't be
    // sidestepped by requesting a fresh code.
    const lock = await this.prisma.otpChallenge.findFirst({
      where: { mobile, lockedUntil: { gt: now } },
      orderBy: { createdAt: 'desc' },
    })
    if (lock?.lockedUntil) {
      throw lockedException(lock.lockedUntil)
    }

    const code = generateCode()
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS)

    const challenge = await this.prisma.otpChallenge.create({
      data: { mobile, codeHash: hashCode(code), expiresAt },
    })

    await this.sms.send(
      mobile,
      `Your Contract Hubs verification code is ${code}. It expires in 5 minutes.`,
    )

    return { challengeId: challenge.id, expiresAt }
  }

  async verify(mobile: string, code: string): Promise<OtpVerifyResult> {
    const now = this.clock.now()
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { mobile, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    })
    if (!challenge) {
      throw new BadRequestException('No active verification code; request a new one')
    }

    if (challenge.lockedUntil && challenge.lockedUntil > now) {
      throw lockedException(challenge.lockedUntil)
    }

    if (challenge.expiresAt <= now) {
      throw new BadRequestException('Code expired; request a new one')
    }

    if (challenge.codeHash !== hashCode(code)) {
      const attempts = challenge.attempts + 1
      const lockedUntil = attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_MS) : null
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts, lockedUntil },
      })
      if (lockedUntil) {
        throw lockedException(lockedUntil)
      }
      throw new BadRequestException('Invalid code')
    }

    const verificationToken = generateToken()
    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: now, verificationToken },
    })
    return { verificationToken }
  }
}
