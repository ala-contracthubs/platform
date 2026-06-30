import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

/**
 * Whether to expose the interactive API docs. Served in stage and in local dev,
 * never in production. Deployed tasks set APP_ENV (stage|prod); local dev leaves
 * it unset, so anything that isn't an explicit non-stage deploy gets docs.
 *
 * Fail-closed: once APP_ENV is set, only the literal "stage" enables docs — a
 * typo or any other value (incl. "prod") returns false.
 */
export function docsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const appEnv = env.APP_ENV
  if (appEnv) return appEnv === 'stage'
  return env.NODE_ENV !== 'production'
}

/** Mounts interactive API docs at /docs (Swagger UI) with the raw OpenAPI
 *  document at /docs-json. */
export function setupOpenApi(app: INestApplication): void {
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

/** Applies the docs site only when the environment allows it (see docsEnabled). */
export function configureOpenApi(app: INestApplication, env: NodeJS.ProcessEnv = process.env): void {
  if (docsEnabled(env)) {
    setupOpenApi(app)
  }
}
