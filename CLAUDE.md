# Contract Hubs — `platform` (coding-agent context)

A pnpm + Turborepo monorepo: three apps plus shared config in `packages/config`
(`@contracthubs/config`). `api` and `web` are live workspace members (a walking skeleton with
an end-to-end `/health` path); `mobile` is still a folder skeleton — its tooling lands later.

## Apps & layout

```
apps/
  api/      TypeScript / NestJS backend — client-facing APIs · Prisma + Postgres
              src/modules/  peer modules (health)   src/shared/  cross-module code (prisma)
              prisma/  schema + migrations          test/  integration (e2e) tests
  web/      React / Vite frontend — desktop + mobile (PWA) · Vitest
              src/modules/  peer modules (health)   src/shared/  public/
  mobile/   Expo / React Native — iOS + Android builds (folder skeleton)
              src/modules/  src/shared/  assets/
packages/
  config/   shared ESLint / Prettier / Jest / tsconfig presets
```

## Architecture

- **Everything is a module.** Each app is a flat set of peer modules with clean boundaries —
  there is no foundational layer that the rest depend on asymmetrically. Cross-cutting
  concerns (auth, role management, notifications & messaging, wallet & finance) are modules in
  their own right, on equal footing with feature/service modules.
- Build the simplest thing that fits; don't reintroduce heavy DDD/hexagonal layering unless asked.

## Stack

pnpm workspaces + Turborepo · TypeScript strict · Node 24 (`.nvmrc`, enforced via
`engine-strict`) · ESLint + Prettier from `@contracthubs/config`. Backend: NestJS 11 +
Prisma 6 on Postgres 16 (local via `docker compose up -d`). Frontend: React + Vite, tested
with Vitest; API tested with Jest + Supertest.

## Commands

`pnpm install` · `typecheck` · `lint` · `test` · `build` · `format`. The API integration test
needs Postgres, so start `docker compose up -d` before `pnpm test` locally. Migrations:
`pnpm --filter @contracthubs/api db:migrate` (dev) / `db:migrate:deploy` (idempotent apply).
CI provisions a Postgres service and runs typecheck + lint + migrate + test on push/PR.

## Conventions

Lowercase-hyphen names, `@contracthubs/*` scope. Extend `@contracthubs/config` rather than
re-deriving config. Commit `pnpm-lock.yaml` changes.

## Adding a module / package

A module is a peer folder under an app's `src/modules/` (see `apps/api/src/modules/health` for
the reference shape: types + service + controller + module). A workspace package goes under
`packages/<name>`. To make an app a workspace member, add its `package.json` + Turborepo
scripts, ensure `"apps/*"` is in `pnpm-workspace.yaml`, register its composite TS project in
the root `tsconfig.json` `references`, and give it an `eslint.config.mjs` that spreads the
`@contracthubs/config/eslint` base.

> Module boundaries (`packages/config/eslint/boundaries.mjs`) are enforced for `apps/api`:
> a module must not import another module, and `shared/**` must not import a module. They are
> app-relative and opt-in per app via `moduleBoundaries` — layer them into `apps/web` when it
> grows more modules.
