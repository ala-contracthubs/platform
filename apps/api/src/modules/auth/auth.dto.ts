import { ApiProperty } from '@nestjs/swagger'
import type { RegistrationRole } from './auth.types'

/**
 * Request body shapes for the registration endpoints. These exist for OpenAPI
 * documentation and typing only — the controller still validates each field at
 * runtime (there is no global ValidationPipe).
 */

export class RequestOtpDto {
  @ApiProperty({
    example: '+971500000000',
    description: 'Mobile number in E.164 format. The SMS code is sent here.',
  })
  mobile!: string
}

export class VerifyOtpDto {
  @ApiProperty({
    example: '+971500000000',
    description: 'The mobile number the code was sent to.',
  })
  mobile!: string

  @ApiProperty({ example: '123456', description: 'The 6-digit code from the SMS.' })
  code!: string
}

export class RegisterDto {
  @ApiProperty({
    description: 'One-shot token returned by POST /auth/registration/verify.',
  })
  verificationToken!: string

  @ApiProperty({
    enum: ['CLIENT', 'AGENT'],
    example: 'CLIENT',
    description: 'Role to grant the new account.',
  })
  role!: RegistrationRole
}
