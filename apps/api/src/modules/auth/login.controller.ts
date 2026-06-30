import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { Role } from '@prisma/client'
import { LoginService } from './login.service'
import { SessionService } from './session.service'
import { RequestOtpDto, VerifyOtpDto } from './auth.dto'
import type { LoginResult, OtpRequestResult } from './auth.types'

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new BadRequestException(`${field} is required`)
  }
  return value
}

/** Pull the bearer token out of an `Authorization: Bearer <token>` header. */
function bearer(header: string | undefined): string {
  const [scheme, token] = (header ?? '').split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : ''
}

/** The returning-user mobile login surface (F2) plus the session-check the app
 *  calls on load to decide between the dashboard and re-authentication (R1.2). */
@ApiTags('auth')
@Controller('auth')
export class LoginController {
  constructor(
    private readonly login: LoginService,
    private readonly session: SessionService,
  ) {}

  @Post('login/otp')
  @ApiOperation({
    summary: 'Request a login OTP',
    description:
      'Sends a 6-digit code by SMS to a number that already has an account. An unrecognised number returns 404 so the UI can offer registration instead.',
  })
  @ApiResponse({
    status: 201,
    description: 'Challenge created; the code has been sent by SMS.',
    schema: { example: { challengeId: 'b1c0…', expiresAt: '2026-06-30T12:05:00.000Z' } },
  })
  @ApiResponse({ status: 400, description: 'mobile is missing or not a valid E.164 number.' })
  @ApiNotFoundResponse({ description: 'No account exists for this mobile number.' })
  @ApiTooManyRequestsResponse({ description: 'The mobile is temporarily locked after too many attempts.' })
  requestOtp(@Body() body: RequestOtpDto): Promise<OtpRequestResult> {
    return this.login.requestOtp(requireString(body.mobile, 'mobile'))
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a login OTP',
    description: 'Checks the code and, on success, issues a session for the last-used role.',
  })
  @ApiOkResponse({
    description: 'Code accepted; the response carries a session for the last-used role.',
    schema: {
      example: { role: 'CLIENT', dashboard: '/client', session: { token: 'c9e2…' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Missing fields, or no active / expired / invalid code.' })
  @ApiNotFoundResponse({ description: 'No account exists for this mobile number.' })
  @ApiTooManyRequestsResponse({ description: 'The mobile is locked after exhausting its attempts.' })
  verify(@Body() body: VerifyOtpDto): Promise<LoginResult> {
    return this.login.verify(requireString(body.mobile, 'mobile'), requireString(body.code, 'code'))
  }

  @Get('session')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check the current session',
    description:
      'Classifies the bearer token: active sessions return the role to land on; sessions past the 30-day window return 401 with the channel to re-authenticate through; unknown tokens return 401.',
  })
  @ApiOkResponse({
    description: 'The session is active.',
    schema: { example: { role: 'CLIENT', dashboard: '/client' } },
  })
  @ApiUnauthorizedResponse({
    description: 'The session is expired (re-auth required) or the token is unknown.',
    schema: { example: { reason: 'expired', channel: 'mobile' } },
  })
  async getSession(
    @Headers('authorization') authorization?: string,
  ): Promise<{ role: Role; dashboard: string }> {
    const status = await this.session.validate(bearer(authorization))
    if (status.status === 'active') {
      return { role: status.role, dashboard: status.dashboard }
    }
    if (status.status === 'expired') {
      throw new UnauthorizedException({ reason: 'expired', channel: status.channel })
    }
    throw new UnauthorizedException({ reason: 'invalid' })
  }
}
