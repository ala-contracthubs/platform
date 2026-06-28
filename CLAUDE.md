# Contract Hubs — `platform` (coding-agent context)

A pnpm + Turborepo monorepo: three apps plus shared config in `packages/config`
(`@contracthubs/config`). The apps are folder skeletons for now — tooling lands as work begins.

## Apps & layout

```
apps/
  api/      TypeScript / NestJS backend — client-facing APIs
              src/modules/  peer modules   src/shared/  cross-module code   test/
  web/      React / Vite frontend — desktop + mobile (PWA)
              src/modules/  src/shared/  public/
  mobile/   Expo / React Native — iOS + Android builds
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
`engine-strict`) · ESLint + Prettier from `@contracthubs/config`.

## Commands

`pnpm install` · `typecheck` · `lint` · `test` · `format`. CI runs typecheck + lint + test
on push/PR (no-op until packages define those tasks).

## Conventions

Lowercase-hyphen names, `@contracthubs/*` scope. Extend `@contracthubs/config` rather than
re-deriving config. Commit `pnpm-lock.yaml` changes.

## Adding a module / package

A module is a peer folder under an app's `src/modules/`. A workspace package goes under
`packages/<name>`. To make an app a workspace member, add its `package.json` + Turborepo
scripts, re-add `"apps/*"` to `pnpm-workspace.yaml`, and register composite TS projects in
the root `tsconfig.json` `references`.

> Leftover: `packages/config/eslint/boundaries.mjs` (wired in `eslint/index.mjs`) still
> encodes the old DDD boundary rules for `apps/api`. Dormant while there's no `.ts` yet, but
> it will mis-fire once backend code lands — strip or rewrite it before building `apps/api`.
