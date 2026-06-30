import 'reflect-metadata'
import type { INestApplication } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

/**
 * Whether to expose the interactive API docs. Served in stage and in local dev,
 * never in production. Deployed tasks set APP_ENV (stage|prod); local dev leaves
 * it unset, so anything that isn't an explicit non-stage deploy gets docs.
 */
function docsEnabled(): boolean {
  const appEnv = process.env.APP_ENV
  if (appEnv) return appEnv === 'stage'
  return process.env.NODE_ENV !== 'production'
}

/** Mounts interactive API docs at /docs (Swagger UI) with the raw OpenAPI
 *  document at /docs-json. */
function setupOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Contract Hubs API')
    .setDescription('Client-facing REST API for the Contract Hubs platform.')
    .setVersion('0.0.0')
    .addTag('health', 'Liveness and database-reachability checks')
    .addTag('auth', 'Mobile/SMS registration: request an OTP, verify it, create the account')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  if (docsEnabled()) {
    setupOpenApi(app)
  }
  const port = process.env.PORT ?? 3000
  await app.listen(port)
}

void bootstrap()
