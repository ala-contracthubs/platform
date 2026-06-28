import { HealthService } from './health.service'
import type { PrismaService } from '../../shared/prisma/prisma.service'

const fakePrisma = (reachable: boolean): PrismaService =>
  ({ isReachable: async () => reachable }) as unknown as PrismaService

describe('HealthService', () => {
  it('reports ok with the database up when it is reachable', async () => {
    const service = new HealthService(fakePrisma(true))

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      api: 'up',
      db: 'up',
    })
  })

  it('reports degraded with the database down when it is unreachable', async () => {
    const service = new HealthService(fakePrisma(false))

    await expect(service.check()).resolves.toEqual({
      status: 'degraded',
      api: 'up',
      db: 'down',
    })
  })
})
