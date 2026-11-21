# syntax=docker/dockerfile:1.7
#
# Indobraga - one image, one container, one domain (Elcodelabs VPS convention).
#
# The monorepo ships as a single container: the NestJS API and the TanStack Start/Nitro
# web server both run inside it, behind a tiny supervisor + reverse proxy
# (ops/docker/entrypoint.mjs) that exposes ONE port (APP_PORT). The host nginx proxies the
# domain to that port. The image is built in CI (GitHub Actions) and pushed to GHCR; the
# VPS only pulls and runs it - it never compiles. Images carry no secrets: everything is
# injected at runtime through env_file.

# ---------------------------------------------------------------------------- builder
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV CI=true \
    npm_config_update_notifier=false \
    npm_config_fund=false

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Manifests first so the dependency layer is cached until a lockfile changes.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --include=dev

COPY apps ./apps
# `prisma generate` only needs a syntactically valid URL; nothing connects during the build.
RUN DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" npm run db:generate \
 && npm run build:api \
 && npm run build:web

# ---------------------------------------------------------------------------- runtime
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

# openssl: Prisma's schema engine (migrate deploy). tini: PID 1, reaps children and
# forwards signals so `docker stop` is graceful.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates tini \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    npm_config_update_notifier=false \
    npm_config_fund=false

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

# Production dependencies of the API only (the web build is self-contained in .output).
# The Prisma CLI is a devDependency of the API, but `migrate deploy` must run from this
# image, so it is added back explicitly at the exact version pinned in the lockfile.
RUN PRISMA_VERSION="$(node -p "require('./package-lock.json').packages['node_modules/prisma'].version")" \
 && npm ci --omit=dev --ignore-scripts --workspace @indobraga/api \
 && npm install --no-save --no-package-lock --omit=dev --ignore-scripts --workspace @indobraga/api "prisma@${PRISMA_VERSION}" \
 && npm cache clean --force

# Generated Prisma client + native binaries come from the builder (same lockfile, same OS).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@img ./node_modules/@img
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=builder /app/apps/web/.output ./apps/web/.output
COPY ops/docker/entrypoint.mjs ./entrypoint.mjs

# Non-root, same uid as the other apps on the Elcodelabs VPS (bind-mounted data stays
# writable by the container user).
RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --home-dir /app --shell /usr/sbin/nologin app \
 && mkdir -p /app/apps/api/.local-storage \
 && chown -R app:app /app/apps/api/.local-storage
USER app

# APP_PORT is the single public port of the container (published on 127.0.0.1 only).
ENV APP_PORT=8087
EXPOSE 8087

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.APP_PORT||8087)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# ENTRYPOINT (not CMD) so `docker run <image> migrate` passes the argument to it.
#   serve   (default)  supervisor: API + web + reverse proxy on APP_PORT
#   migrate            prisma migrate deploy
#   seed               compiled prisma seed (only when explicitly requested)
ENTRYPOINT ["/usr/bin/tini", "--", "node", "/app/entrypoint.mjs"]
CMD ["serve"]
