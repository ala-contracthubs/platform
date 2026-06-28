import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

/**
 * Thin wrapper over PrismaClient, the platform's single database gateway.
 *
 * Connection is lazy (Prisma connects on first query) so the app still boots
 * when the database is down — the /health endpoint can then report it rather
 * than the process crashing on startup.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }

  /** True if the database answers a trivial query; false on any failure. */
  async isReachable(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}
