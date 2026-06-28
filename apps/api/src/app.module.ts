import { Module } from '@nestjs/common'
import { HealthModule } from './modules/health/health.module'

/** Composition root: wires the app's peer modules together. */
@Module({
  imports: [HealthModule],
})
export class AppModule {}
