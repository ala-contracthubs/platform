import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { configureOpenApi } from '../src/openapi'

/**
 * Guards the OpenAPI docs site end to end: when the environment enables it, the
 * app serves a valid document at /docs-json and the Swagger UI at /docs; when
 * the environment gates it off (prod), neither route exists.
 *
 * Unlike the other e2e specs this needs no Postgres — the document is built from
 * route metadata and Prisma connects lazily, so the app boots without a DB.
 */
async function bootApp(env: NodeJS.ProcessEnv): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication()
  configureOpenApi(app, env)
  await app.init()
  return app
}

describe('OpenAPI docs (/docs)', () => {
  describe('when the environment enables docs (stage)', () => {
    let app: INestApplication

    beforeAll(async () => {
      app = await bootApp({ APP_ENV: 'stage', NODE_ENV: 'production' })
    })

    afterAll(async () => {
      await app?.close()
    })

    it('serves a valid OpenAPI document at /docs-json', async () => {
      const res = await request(app.getHttpServer()).get('/docs-json').expect(200)

      expect(res.body.openapi).toBe('3.0.0')
      expect(res.body.info.title).toBe('Contract Hubs API')
    })

    it('documents every live endpoint', async () => {
      const res = await request(app.getHttpServer()).get('/docs-json').expect(200)

      expect(Object.keys(res.body.paths)).toEqual(
        expect.arrayContaining([
          '/health',
          '/auth/registration/otp',
          '/auth/registration/verify',
          '/auth/registration',
        ]),
      )
    })

    it('registers the request DTOs as schema components', async () => {
      const res = await request(app.getHttpServer()).get('/docs-json').expect(200)

      expect(Object.keys(res.body.components.schemas)).toEqual(
        expect.arrayContaining(['RequestOtpDto', 'VerifyOtpDto', 'RegisterDto']),
      )
    })

    it('serves the Swagger UI at /docs', async () => {
      const res = await request(app.getHttpServer()).get('/docs').expect(200)

      expect(res.text).toContain('Swagger UI')
    })
  })

  describe('when the environment gates docs off (prod)', () => {
    let app: INestApplication

    beforeAll(async () => {
      app = await bootApp({ APP_ENV: 'prod', NODE_ENV: 'production' })
    })

    afterAll(async () => {
      await app?.close()
    })

    it('does not expose the OpenAPI document', async () => {
      await request(app.getHttpServer()).get('/docs-json').expect(404)
    })

    it('does not expose the Swagger UI', async () => {
      await request(app.getHttpServer()).get('/docs').expect(404)
    })
  })
})
