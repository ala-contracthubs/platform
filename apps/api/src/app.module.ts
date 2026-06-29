import { Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module'
import { HealthModule } from './modules/health/health.module'

/** Composition root: wires the app's peer modules together. */
@Module({
  imports: [HealthModule, AuthModule],
})
export class AppModule {}
