# syntax=docker/dockerfile:1
# Build context = repo ROOT (monorepo). Build with:
#   docker build -f apps/api/Dockerfile -t contracthubs/api .
# Multi-stage with turbo prune so the image carries only the api's slice (INF-55).
# NOTE: validate the first build in CI — pnpm `deploy` flags occasionally shift
# between pnpm minor versions.

FROM node:24-bookworm-slim AS base
RUN corepack enable
# openssl + ca-certificates: required by Prisma's query engine on Debian.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- prune: minimal subset for @contracthubs/api --------------------------
FROM base AS pruner
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@2 prune @contracthubs/api --docker

# ---- install + build ------------------------------------------------------
FROM base AS builder
WORKDIR /repo
# lockfile + package.jsons first for layer caching. --ignore-scripts so the
# api's `postinstall: prisma generate` doesn't run before the schema is copied.
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts
# full pruned source, then build (build = `prisma generate && nest build`).
COPY --from=pruner /repo/out/full/ .
RUN pnpm --filter @contracthubs/api build
# Export a production-only deployable (prod deps incl. the prisma CLI).
RUN pnpm --filter @contracthubs/api deploy --prod /app
# Regenerate the client into the fresh /app node_modules.
RUN cd /app && ./node_modules/.bin/prisma generate

# ---- runtime --------------------------------------------------------------
FROM node:24-bookworm-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /app ./
USER node
EXPOSE 3000
# The migration RunTask overrides this command with `prisma migrate deploy`.
CMD ["node", "dist/main.js"]
