import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import type { HealthReport } from './health.types'

/** Builds the platform health report: the API is up if it can answer, and the
 *  database is up if it is reachable. */
@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthReport> {
    const dbReachable = await this.prisma.isReachable()
    return {
      status: dbReachable ? 'ok' : 'degraded',
      api: 'up',
      db: dbReachable ? 'up' : 'down',
    }
  }
}
