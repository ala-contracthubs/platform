import { execSync } from 'node:child_process'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'

/**
 * The walking-skeleton integration test: it boots the real Nest app wired to a
 * real Postgres (migrations applied) and exercises the same /health contract
 * the web app consumes — proving the web → API → DB path end to end.
 *
 * Requires a reachable Postgres (DATABASE_URL). Locally: `docker compose up -d`.
 */
describe('GET /health (integration: API → DB)', () => {
  let app: INestApplication

  beforeAll(async () => {
    // Idempotent: applies only pending migrations to the configured database.
    execSync('pnpm prisma migrate deploy', { stdio: 'inherit' })

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
  })

  it('returns 200 with the API up and the database reachable', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200)

    expect(res.body).toEqual({ status: 'ok', api: 'up', db: 'up' })
  })
})
