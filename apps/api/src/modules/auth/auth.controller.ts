import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { OtpService } from './otp.service'
import { RegistrationService } from './registration.service'
import type {
  OtpRequestResult,
  OtpVerifyResult,
  RegistrationResult,
  RegistrationRole,
} from './auth.types'

const REGISTRATION_ROLES: readonly RegistrationRole[] = ['CLIENT', 'AGENT']

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new BadRequestException(`${field} is required`)
  }
  return value
}

function requireRole(value: unknown): RegistrationRole {
  if (!REGISTRATION_ROLES.includes(value as RegistrationRole)) {
    throw new BadRequestException('role must be CLIENT or AGENT')
  }
  return value as RegistrationRole
}

/** The mobile/SMS registration surface: request an OTP, verify it, then create
 *  the account with the picked role. */
@Controller('auth/registration')
export class AuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly registration: RegistrationService,
  ) {}

  @Post('otp')
  requestOtp(@Body() body: { mobile?: unknown }): Promise<OtpRequestResult> {
    return this.otp.request(requireString(body.mobile, 'mobile'))
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() body: { mobile?: unknown; code?: unknown }): Promise<OtpVerifyResult> {
    return this.otp.verify(requireString(body.mobile, 'mobile'), requireString(body.code, 'code'))
  }

  @Post()
  register(
    @Body() body: { verificationToken?: unknown; role?: unknown },
  ): Promise<RegistrationResult> {
    return this.registration.register({
      verificationToken: requireString(body.verificationToken, 'verificationToken'),
      role: requireRole(body.role),
    })
  }
}
