import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger'
import { OtpService } from './otp.service'
import { RegistrationService } from './registration.service'
import { RegisterDto, RequestOtpDto, VerifyOtpDto } from './auth.dto'
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
@ApiTags('auth')
@Controller('auth/registration')
export class AuthController {
  constructor(
    private readonly otp: OtpService,
    private readonly registration: RegistrationService,
  ) {}

  @Post('otp')
  @ApiOperation({
    summary: 'Request an OTP',
    description: 'Mints a 6-digit code, sends it by SMS, and opens a 5-minute verification window.',
  })
  @ApiCreatedResponse({
    description: 'Challenge created; the code has been sent by SMS.',
    schema: {
      example: { challengeId: 'b1c0…', expiresAt: '2026-06-30T12:05:00.000Z' },
    },
  })
  @ApiResponse({ status: 400, description: 'mobile is missing or not a valid E.164 number.' })
  @ApiTooManyRequestsResponse({ description: 'The mobile is temporarily locked after too many attempts.' })
  requestOtp(@Body() body: RequestOtpDto): Promise<OtpRequestResult> {
    return this.otp.request(requireString(body.mobile, 'mobile'))
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify an OTP',
    description: 'Checks the code against the active challenge and returns a one-shot verification token.',
  })
  @ApiOkResponse({
    description: 'Code accepted; token authorises one account creation.',
    schema: { example: { verificationToken: 'a7f3…' } },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing fields, or no active / expired / invalid code.',
  })
  @ApiTooManyRequestsResponse({ description: 'The mobile is locked after exhausting its attempts.' })
  verify(@Body() body: VerifyOtpDto): Promise<OtpVerifyResult> {
    return this.otp.verify(requireString(body.mobile, 'mobile'), requireString(body.code, 'code'))
  }

  @Post()
  @ApiOperation({
    summary: 'Create the account',
    description: 'Consumes the verification token, creates the Individual with the picked role, and issues a session.',
  })
  @ApiCreatedResponse({
    description: 'Account created; the response carries the new session token.',
    schema: {
      example: {
        individual: { id: 'b1c0…', mobile: '+971500000000' },
        role: 'CLIENT',
        agentState: null,
        session: { token: 'c9e2…' },
        dashboard: '/client',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Missing fields, invalid role, or an invalid / already-used verification token.',
  })
  @ApiConflictResponse({ description: 'An account already exists for this mobile number.' })
  register(@Body() body: RegisterDto): Promise<RegistrationResult> {
    return this.registration.register({
      verificationToken: requireString(body.verificationToken, 'verificationToken'),
      role: requireRole(body.role),
    })
  }
}
