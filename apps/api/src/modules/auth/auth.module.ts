import { Module } from '@nestjs/common'
import { PrismaModule } from '../../shared/prisma/prisma.module'
import { CLOCK, SystemClock } from '../../shared/clock/clock'
import { SMS_PROVIDER } from '../../shared/sms/sms.provider'
import { StubSmsProvider } from '../../shared/sms/stub-sms.provider'
import { AuthController } from './auth.controller'
import { LoginController } from './login.controller'
import { OtpService } from './otp.service'
import { RegistrationService } from './registration.service'
import { LoginService } from './login.service'
import { SessionService } from './session.service'

/**
 * Identity & access for Module 0. V1 ships the mobile/SMS registration path; the
 * SMS provider and clock are bound to their default implementations here and can
 * be overridden (a real SMS gateway in prod, a fake clock in tests).
 */
@Module({
  imports: [PrismaModule],
  controllers: [AuthController, LoginController],
  providers: [
    OtpService,
    RegistrationService,
    LoginService,
    SessionService,
    { provide: SMS_PROVIDER, useClass: StubSmsProvider },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class AuthModule {}
