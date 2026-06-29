# syntax=docker/dockerfile:1
# Build context = repo ROOT. Build with:
#   docker build -f apps/web/Dockerfile --build-arg VITE_API_BASE_URL=https://api.contracthubs.com -t contracthubs/web .
# Static Vite build served by non-root nginx on 8080 (INF-55).

FROM node:24-bookworm-slim AS base
RUN corepack enable

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@2 prune @contracthubs/web --docker

FROM base AS builder
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY --from=pruner /repo/out/full/ .
# Cross-origin API base URL baked into the bundle (subdomain split -> CORS).
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter @contracthubs/web build

# ---- runtime: unprivileged nginx, listens on 8080 -------------------------
FROM nginxinc/nginx-unprivileged:alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
