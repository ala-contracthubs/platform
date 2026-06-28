# `@contracthubs/api`

NestJS backend for the Contract Hubs platform. Flat peer modules under `src/modules/`,
cross-cutting code under `src/shared/`. Data access via Prisma against Postgres.

## Layout

```
src/
  main.ts            bootstrap (composition root)
  app.module.ts      wires the peer modules together
  modules/
    health/          GET /health — service status + DB connectivity check
  shared/
    prisma/          PrismaService (the single DB gateway) + PrismaModule
prisma/
  schema.prisma      models
  migrations/        SQL migrations (applied with db:migrate:deploy)
test/
  *.e2e-spec.ts      integration tests (boot the app against a real Postgres)
```

## Local development

```sh
docker compose up -d              # Postgres (from the repo root)
cp .env.example .env              # DATABASE_URL + PORT
pnpm db:migrate                   # apply migrations
pnpm dev                          # http://localhost:3000
curl localhost:3000/health        # {"status":"ok","api":"up","db":"up"}
```

## Migrations

Migrations live in `prisma/migrations/` and are managed with Prisma.

- `pnpm db:migrate` — create and apply a new migration during development.
- `pnpm db:migrate:deploy` — apply only the migrations that have not run yet. This is
  **idempotent**: re-running it when the database is up to date is a no-op. CI and the
  integration test use this.
- `pnpm db:generate` — regenerate the Prisma client after editing `schema.prisma`
  (also runs automatically on `pnpm install` via `postinstall`).

## Testing

`pnpm test` runs Jest. Unit tests (`*.spec.ts`) run with no external dependencies; the
integration tests (`test/*.e2e-spec.ts`) need a reachable Postgres (`DATABASE_URL`) — they
apply pending migrations and exercise `GET /health` through the real Nest app and database.
