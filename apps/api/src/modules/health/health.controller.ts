import { Controller, Get } from '@nestjs/common'
import { HealthService } from './health.service'
import type { HealthReport } from './health.types'

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  get(): Promise<HealthReport> {
    return this.health.check()
  }
}
