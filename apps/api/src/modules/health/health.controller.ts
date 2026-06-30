import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { HealthService } from './health.service'
import type { HealthReport } from './health.types'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Service health report',
    description:
      'Always responds 200. status is "ok" when the database is reachable, "degraded" when it is not.',
  })
  @ApiOkResponse({
    description: 'Health report. db is "down" (and status "degraded") if the database is unreachable.',
    schema: { example: { status: 'ok', api: 'up', db: 'up' } },
  })
  get(): Promise<HealthReport> {
    return this.health.check()
  }
}
