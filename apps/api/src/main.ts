import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { configureOpenApi } from './openapi'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  configureOpenApi(app)
  const port = process.env.PORT ?? 3000
  await app.listen(port)
}

void bootstrap()
