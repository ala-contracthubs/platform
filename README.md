# Contract Hubs — `platform`

A pnpm + Turborepo monorepo for the Contract Hubs platform.

> **Status: fresh start.** The repo is currently a minimal monorepo skeleton — workspace
> tooling and shared config only. Apps and feature packages will be added as the work begins.

## Layout

```
packages/
  config/   shared presets: ESLint, Prettier, Jest, and tsconfig (base / nest / react)
```

Root files wire the workspace together: `pnpm-workspace.yaml`, `turbo.json`,
`tsconfig.json` (+ `tsconfig.base.json`), `eslint.config.mjs`, and the Prettier/editor configs.

## Prerequisites

- **Node 24** (`.nvmrc` → `24`; run `nvm use`). Enforced via `engine-strict`.
- **pnpm** (pinned through `packageManager`; run `corepack enable`).

## Getting started

```sh
nvm use                # Node 24
corepack enable        # provides the pinned pnpm
pnpm install           # install + link the workspace
pnpm typecheck         # tsc across the graph
pnpm lint              # ESLint
pnpm test              # turbo-run tests
```

## Workspace scripts (root)

| Script | Purpose |
| --- | --- |
| `pnpm dev` | run dev servers via Turborepo |
| `pnpm build` | build all packages |
| `pnpm lint` | lint the workspace |
| `pnpm typecheck` | type-check the whole graph |
| `pnpm test` | run tests via Turborepo |
| `pnpm format` | Prettier write (`format:check` to verify) |

> With no apps/packages defining these tasks yet, the `turbo run …` scripts simply
> find nothing to do and exit 0.

## Adding a package or app

1. Create it under `packages/<name>` (or `apps/<name>`, adding `"apps/*"` back to
   `pnpm-workspace.yaml`).
2. Give it a `package.json` with the scripts Turborepo should orchestrate
   (`build` / `lint` / `typecheck` / `test`) and extend a preset from
   `@contracthubs/config`.
3. If it's a composite TypeScript project, add it to `references` in the root `tsconfig.json`.
