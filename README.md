# Contract Hubs — `platform`

A pnpm + Turborepo monorepo for the Contract Hubs platform.

> **Status: walking skeleton.** `api` and `web` are live workspace members wired through an
> end-to-end `/health` path (web → API → Postgres). `mobile` is still a folder skeleton.

## Layout

```
apps/
  api/      NestJS backend (Prisma + Postgres) — exposes GET /health
  web/      React + Vite frontend — renders API + DB status from /health
  mobile/   Expo / React Native (folder skeleton)
packages/
  config/   shared presets: ESLint, Prettier, Jest, and tsconfig (base / nest / react)
```

Root files wire the workspace together: `pnpm-workspace.yaml`, `turbo.json`,
`tsconfig.json` (+ `tsconfig.base.json`), `eslint.config.mjs`, `docker-compose.yml`, and the
Prettier/editor configs.

## Prerequisites

- **Node 24** (`.nvmrc` → `24`; run `nvm use`). Enforced via `engine-strict`.
- **pnpm** (pinned through `packageManager`; run `corepack enable`).
- **Docker** (for the local Postgres used by the API and its integration test).

## Getting started

```sh
nvm use                # Node 24
corepack enable        # provides the pinned pnpm
pnpm install           # install + link the workspace (generates the Prisma client)

docker compose up -d                          # start Postgres
cp apps/api/.env.example apps/api/.env        # local DATABASE_URL + PORT
pnpm --filter @contracthubs/api db:migrate    # create/apply DB migrations

pnpm typecheck         # tsc across the graph
pnpm lint              # ESLint (incl. flat peer-module boundaries)
pnpm test              # turbo-run tests (API integration test needs Postgres up)
```

### Running the skeleton

```sh
docker compose up -d                  # Postgres
pnpm --filter @contracthubs/api dev   # API on http://localhost:3000  (GET /health)
pnpm --filter @contracthubs/web dev   # Web on http://localhost:5173  (proxies /health → API)
```

Open the web app — it calls `/health` and displays the API and database status.

## Database & migrations

Postgres runs locally via `docker compose up -d` (see `docker-compose.yml`). The schema and
migrations live in `apps/api/prisma/`.

| Command                                             | Purpose                                            |
| --------------------------------------------------- | -------------------------------------------------- |
| `pnpm --filter @contracthubs/api db:migrate`        | create + apply a new migration (dev)               |
| `pnpm --filter @contracthubs/api db:migrate:deploy` | apply pending migrations (**idempotent**; CI/prod) |
| `pnpm --filter @contracthubs/api db:generate`       | regenerate the Prisma client                       |

`db:migrate:deploy` only applies migrations that have not run yet, so it is safe to re-run.

## Workspace scripts (root)

| Script           | Purpose                                   |
| ---------------- | ----------------------------------------- |
| `pnpm dev`       | run dev servers via Turborepo             |
| `pnpm build`     | build all apps/packages                   |
| `pnpm lint`      | lint the workspace                        |
| `pnpm typecheck` | type-check the whole graph                |
| `pnpm test`      | run tests via Turborepo                   |
| `pnpm format`    | Prettier write (`format:check` to verify) |

## Adding a package or app

1. Create it under `packages/<name>` (or `apps/<name>`; `"apps/*"` is already in
   `pnpm-workspace.yaml`).
2. Give it a `package.json` with the scripts Turborepo orchestrates
   (`build` / `lint` / `typecheck` / `test` / `dev`) and extend a preset from
   `@contracthubs/config`.
3. Add an `eslint.config.mjs` that spreads `@contracthubs/config/eslint`.
4. If it's a composite TypeScript project, add it to `references` in the root `tsconfig.json`.
