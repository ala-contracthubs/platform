# Contract Hubs — `platform` (coding-agent context)

A pnpm + Turborepo monorepo. Currently a minimal skeleton: only `packages/config`
(shared ESLint/Prettier/Jest/tsconfig presets, published as `@contracthubs/config`).
Apps and modules get added as work begins.

## Architecture

- **Everything is a module.** No "backbone" or privileged Module 0. Cross-cutting
  concerns — auth, role management, notifications & messaging, wallet & finance — are
  modules, exactly like service modules. Flat set of peers, clean boundaries between them.
- Build the simplest thing that fits; don't reintroduce the old heavy DDD/hexagonal
  layering unless asked.

## Stack

pnpm workspaces + Turborepo · TypeScript strict · Node 24 (`.nvmrc`, enforced via
`engine-strict`) · ESLint + Prettier from `@contracthubs/config`.

## Commands

`pnpm install` · `typecheck` · `lint` · `test` · `format`. CI runs typecheck + lint +
test on push/PR (no-op until packages define those tasks).

## Conventions

Lowercase-hyphen names, `@contracthubs/*` scope. Extend `@contracthubs/config` rather than
re-deriving config. Commit `pnpm-lock.yaml` changes.

## Adding a module/package

Create under `packages/<name>` (or `apps/<name>`, re-adding `"apps/*"` to
`pnpm-workspace.yaml`); add a `package.json` with the Turborepo scripts; register composite
TS projects in the root `tsconfig.json` `references`.

> Leftover: `packages/config/eslint/boundaries.mjs` still encodes old DDD boundary rules
> targeting a non-existent `apps/api/**` — inert; remove/adapt when apps land.
