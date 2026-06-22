# Contract Hubs — `platform`

A platform where **Module 0 (the backbone)** owns identity, Cases, documents, payments, Wallets, the
ledger, SLAs, dashboards and notifications **once**. Each service (POA first) plugs in as a **Module**
via a **Manifest**. The backbone never depends on a Module; a Module talks to the backbone only
through its declared Manifest contract.

> **Status: scaffolding only.** This repo currently contains the folder structure, READMEs and the
> prerequisite tooling. No domain/application/infrastructure logic has been implemented yet. Build it
> test-first (red → green → refactor) per [`CLAUDE.md`](./CLAUDE.md).

## Layout

```
apps/
  api/      NestJS modular monolith — backbone (src/core) + the POA module (src/modules/poa)
  web/      Vite + React SPA (TanStack Router + Query) — static on S3 + CloudFront
  mobile/   Expo managed workflow (EAS dev builds from day one)
packages/
  types/        shared TS domain/wire types
  validation/   zod schemas + Manifest contract-test fixtures
  api-client/    OpenAPI-generated REST client
  ui-tokens/    design tokens (RTL/LTR, status colours, money formatting)
  config/       tsconfig + ESLint module-boundary rules + prettier/jest presets
docs/
  ARCHITECTURE.md   layering, bounded contexts, boundary rules (read this)
  CONTEXT.md        ubiquitous language — source of truth for terms
  prd/              the PRDs (platform, POA, wallet/finance, messaging, client prototype)
  adr/              architecture decision records
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the bounded contexts, the hexagonal layering,
the port-placement rule, and the enforced module boundaries.

## Prerequisites

- **Node 20 LTS** (`.nvmrc` → `20`; `nvm use`)
- **pnpm** (pinned via `packageManager`; `corepack enable`)

## Getting started

```sh
nvm use                # Node 20
corepack enable        # provides the pinned pnpm
pnpm install           # install + link the workspace
pnpm typecheck         # tsc across the graph
pnpm lint              # ESLint incl. module-boundary rules
pnpm test              # turbo-run the test pyramid
```

> Dependency versions in the `package.json` files are sensible starting points — run `pnpm install`
> and adjust as the implementation lands.

## Workspace scripts (root)

| Script | Purpose |
| --- | --- |
| `pnpm dev` | run app dev servers via Turborepo |
| `pnpm build` | build all packages + apps |
| `pnpm lint` | lint + module-boundary enforcement |
| `pnpm typecheck` | type-check the whole graph |
| `pnpm test` | unit / use-case / integration / e2e + architecture edge tests |
| `pnpm format` | Prettier write |

## Engineering principles (non-negotiable)

- **TDD** — failing test first for all domain and application logic.
- **DDD** — `CONTEXT.md` is the ubiquitous language; use those exact terms; never an _Avoid_ term.
- **Clean / Hexagonal** — dependencies point inward; ports & adapters; per-Module layering.

Start every task by reading the relevant PRD(s) end to end and the affected parts of `CONTEXT.md`.
