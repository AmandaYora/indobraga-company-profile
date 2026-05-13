#!/usr/bin/env bash
set -Eeuo pipefail

BASE_DIR="${DEPLOY_BASE_DIR:-/var/www/indobraga}"
CURRENT_DIR="${DEPLOY_CURRENT_DIR:-$BASE_DIR/current}"
SHARED_DIR="${DEPLOY_SHARED_DIR:-$BASE_DIR/shared}"
API_ENV_FILE="${DEPLOY_API_ENV_FILE:-$SHARED_DIR/apps-api.env}"
WEB_ENV_FILE="${DEPLOY_WEB_ENV_FILE:-$SHARED_DIR/apps-web.env}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_SHA="${1:-${DEPLOY_SHA:-}}"
RUN_PRODUCTION_SEED="${RUN_PRODUCTION_SEED:-false}"
SKIP_NGINX_RELOAD="${SKIP_NGINX_RELOAD:-false}"
ALLOW_NON_HEAD_DEPLOY="${ALLOW_NON_HEAD_DEPLOY:-false}"

log() {
  printf '[deploy] %s\n' "$*"
}

fail() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

retry_curl() {
  local url="$1"
  local attempts="${2:-10}"
  local delay="${3:-3}"

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    if curl -fsS "$url" >/dev/null; then
      log "Smoke test passed: $url"
      return 0
    fi

    log "Smoke test attempt $attempt/$attempts failed: $url"
    sleep "$delay"
  done

  fail "Smoke test failed: $url"
}

if [[ -z "$DEPLOY_SHA" ]]; then
  fail "DEPLOY_SHA is required. Pass the GitHub commit SHA as the first argument or env var."
fi

require_command git
require_command npm
require_command npx
require_command pm2
require_command curl

[[ -d "$CURRENT_DIR/.git" ]] || fail "Git worktree not found: $CURRENT_DIR"

cd "$CURRENT_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
  git status --short
  fail "Production worktree has tracked local changes. Resolve them before deploying."
fi

log "Fetching origin/$DEPLOY_BRANCH"
git fetch --prune origin "$DEPLOY_BRANCH"

git cat-file -e "${DEPLOY_SHA}^{commit}" || fail "Commit not found after fetch: $DEPLOY_SHA"

if ! git merge-base --is-ancestor "$DEPLOY_SHA" "origin/$DEPLOY_BRANCH"; then
  fail "Commit $DEPLOY_SHA is not reachable from origin/$DEPLOY_BRANCH"
fi

ORIGIN_HEAD_SHA="$(git rev-parse "origin/$DEPLOY_BRANCH")"
if [[ "$ALLOW_NON_HEAD_DEPLOY" != "true" && "$DEPLOY_SHA" != "$ORIGIN_HEAD_SHA" ]]; then
  fail "Commit $DEPLOY_SHA is not current origin/$DEPLOY_BRANCH ($ORIGIN_HEAD_SHA). Set ALLOW_NON_HEAD_DEPLOY=true for an intentional rollback."
fi

log "Checking out exact commit $DEPLOY_SHA"
git checkout -B "$DEPLOY_BRANCH" "$DEPLOY_SHA"

mkdir -p "$SHARED_DIR"

if [[ ! -f "$API_ENV_FILE" ]]; then
  if [[ -f "$CURRENT_DIR/apps/api/.env" ]]; then
    log "Bootstrapping shared API env from current apps/api/.env"
    cp -p "$CURRENT_DIR/apps/api/.env" "$API_ENV_FILE"
    chmod 600 "$API_ENV_FILE"
  else
    fail "API env not found. Expected $API_ENV_FILE"
  fi
fi

install -m 600 "$API_ENV_FILE" "$CURRENT_DIR/apps/api/.env"

if [[ -f "$WEB_ENV_FILE" ]]; then
  install -m 600 "$WEB_ENV_FILE" "$CURRENT_DIR/apps/web/.env"
elif [[ -f "$CURRENT_DIR/apps/web/.env" ]]; then
  log "No shared web env found; preserving existing apps/web/.env"
else
  log "No web env found; frontend will use production same-origin defaults."
fi

log "Installing dependencies"
npm ci --include=dev

log "Generating Prisma Client"
npm run db:generate

log "Building API"
npm run build:api

log "Building web"
npm run build:web

log "Running Prisma migrations"
(
  cd "$CURRENT_DIR/apps/api"
  npx prisma migrate deploy
)

if [[ "$RUN_PRODUCTION_SEED" == "true" ]]; then
  log "Running production seed because RUN_PRODUCTION_SEED=true"
  npm run db:seed
else
  log "Skipping production seed. Run manually or set RUN_PRODUCTION_SEED=true when intentionally needed."
fi

log "Starting or reloading PM2 processes"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

if [[ "$SKIP_NGINX_RELOAD" == "true" ]]; then
  log "Skipping Nginx reload because SKIP_NGINX_RELOAD=true"
else
  require_command sudo
  log "Validating and reloading Nginx"
  sudo -n nginx -t
  sudo -n systemctl reload nginx
fi

retry_curl "http://127.0.0.1:3001/api/v1/health" 10 3
retry_curl "http://127.0.0.1:3000/" 10 3

if [[ -n "${PUBLIC_SMOKE_BASE_URL:-}" ]]; then
  retry_curl "${PUBLIC_SMOKE_BASE_URL%/}/api/v1/health" 10 3
  retry_curl "${PUBLIC_SMOKE_BASE_URL%/}/" 10 3
fi

log "Deployment completed for $DEPLOY_SHA"
