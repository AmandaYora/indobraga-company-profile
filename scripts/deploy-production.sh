#!/usr/bin/env bash
set -Eeuo pipefail

BASE_DIR="${DEPLOY_BASE_DIR:-/var/www/indobraga}"
CURRENT_DIR="${DEPLOY_CURRENT_DIR:-$BASE_DIR/current}"
SHARED_DIR="${DEPLOY_SHARED_DIR:-$BASE_DIR/shared}"
API_ENV_FILE="${DEPLOY_API_ENV_FILE:-$SHARED_DIR/apps-api.env}"
WEB_ENV_FILE="${DEPLOY_WEB_ENV_FILE:-$SHARED_DIR/apps-web.env}"
DEPLOY_LOCK_FILE="${DEPLOY_LOCK_FILE:-$BASE_DIR/deploy.lock}"
LAST_SUCCESSFUL_DEPLOY_FILE="${DEPLOY_STATE_FILE:-$SHARED_DIR/last-successful-deploy-sha}"
DB_BACKUP_DIR="${DB_BACKUP_DIR:-$BASE_DIR/backups/mysql}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_SHA="${1:-${DEPLOY_SHA:-}}"
RUN_PRODUCTION_SEED="${RUN_PRODUCTION_SEED:-false}"
SKIP_NGINX_RELOAD="${SKIP_NGINX_RELOAD:-false}"
ALLOW_NON_HEAD_DEPLOY="${ALLOW_NON_HEAD_DEPLOY:-false}"
BACKUP_ON_MIGRATION="${BACKUP_ON_MIGRATION:-true}"
SKIP_MIGRATION_BACKUP="${SKIP_MIGRATION_BACKUP:-false}"
EXTERNAL_DB_BACKUP_REFERENCE="${EXTERNAL_DB_BACKUP_REFERENCE:-}"

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

acquire_deploy_lock() {
  mkdir -p "$(dirname "$DEPLOY_LOCK_FILE")"
  exec 200>"$DEPLOY_LOCK_FILE"

  if ! flock -n 200; then
    fail "Another deployment is already running. Lock file: $DEPLOY_LOCK_FILE"
  fi

  log "Acquired deploy lock: $DEPLOY_LOCK_FILE"
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

read_database_url() {
  node - "$CURRENT_DIR/apps/api/.env" <<'NODE'
const fs = require("fs");

const envPath = process.argv[2];
const content = fs.readFileSync(envPath, "utf8");

for (const rawLine of content.split(/\r?\n/)) {
  const line = rawLine.trim();

  if (!line || line.startsWith("#")) {
    continue;
  }

  const match = line.match(/^(?:export\s+)?DATABASE_URL\s*=\s*(.*)$/);
  if (!match) {
    continue;
  }

  let value = match[1].trim();

  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  process.stdout.write(value);
  process.exit(0);
}

process.exit(1);
NODE
}

write_mysql_defaults_file() {
  local database_url="$1"
  local defaults_file="$2"

  node - "$database_url" "$defaults_file" <<'NODE'
const fs = require("fs");

const databaseUrl = process.argv[2];
const defaultsFile = process.argv[3];
const url = new URL(databaseUrl);

if (url.protocol !== "mysql:" && url.protocol !== "mysql2:") {
  throw new Error(`Unsupported DATABASE_URL protocol for MySQL backup: ${url.protocol}`);
}

const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
if (!database) {
  throw new Error("DATABASE_URL does not include a database name.");
}

const lines = [
  "[client]",
  "protocol=tcp",
  `host=${url.hostname || "127.0.0.1"}`,
  `port=${url.port || "3306"}`,
  `user=${decodeURIComponent(url.username)}`,
  `password=${decodeURIComponent(url.password)}`,
  "",
];

fs.writeFileSync(defaultsFile, lines.join("\n"), { mode: 0o600 });
process.stdout.write(database);
NODE
}

create_mysql_backup() {
  require_command mysqldump
  require_command gzip
  require_command mktemp

  local database_url
  local defaults_file
  local database_name
  local timestamp
  local backup_file

  database_url="$(read_database_url)" || fail "DATABASE_URL was not found in $CURRENT_DIR/apps/api/.env"
  defaults_file="$(mktemp)"
  database_name="$(write_mysql_defaults_file "$database_url" "$defaults_file")" || {
    rm -f "$defaults_file"
    fail "Failed to parse DATABASE_URL for MySQL backup."
  }

  mkdir -p "$DB_BACKUP_DIR"
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  backup_file="$DB_BACKUP_DIR/${database_name}-${DEPLOY_SHA:0:12}-$timestamp.sql.gz"

  log "Creating MySQL backup before Prisma migration changes: $backup_file"

  if ! mysqldump --defaults-extra-file="$defaults_file" --single-transaction --quick --routines --triggers "$database_name" | gzip -c > "$backup_file"; then
    rm -f "$defaults_file"
    rm -f "$backup_file"
    fail "MySQL backup failed; migration was not run."
  fi

  rm -f "$defaults_file"
  chmod 600 "$backup_file"
  log "MySQL backup completed: $backup_file"
}

backup_if_migration_changed() {
  local previous_successful_sha="$1"
  local migration_changes

  if [[ -z "$previous_successful_sha" ]]; then
    log "No previous successful deploy marker found; using current worktree as migration diff baseline."
    previous_successful_sha="$(git rev-parse HEAD)"
  fi

  if [[ "$previous_successful_sha" == "$DEPLOY_SHA" ]]; then
    log "Deploy target matches last successful deploy; skipping migration backup."
    return 0
  fi

  migration_changes="$(git diff --name-only "$previous_successful_sha" "$DEPLOY_SHA" -- apps/api/prisma/schema.prisma apps/api/prisma/migrations || true)"

  if [[ -z "$migration_changes" ]]; then
    log "No Prisma schema or migration changes detected; skipping migration backup."
    return 0
  fi

  log "Prisma schema or migration changes detected:"
  printf '%s\n' "$migration_changes" | sed 's/^/[deploy] - /'

  if [[ "$SKIP_MIGRATION_BACKUP" == "true" ]]; then
    [[ -n "$EXTERNAL_DB_BACKUP_REFERENCE" ]] || fail "SKIP_MIGRATION_BACKUP=true requires EXTERNAL_DB_BACKUP_REFERENCE."
    log "Skipping automatic MySQL backup because external backup is confirmed: $EXTERNAL_DB_BACKUP_REFERENCE"
    return 0
  fi

  [[ "$BACKUP_ON_MIGRATION" == "true" ]] || fail "Prisma migration changes detected, but BACKUP_ON_MIGRATION is not true."
  create_mysql_backup
}

if [[ -z "$DEPLOY_SHA" ]]; then
  fail "DEPLOY_SHA is required. Pass the GitHub commit SHA as the first argument or env var."
fi

require_command git
require_command node
require_command npm
require_command npx
require_command pm2
require_command curl
require_command flock

acquire_deploy_lock

[[ -d "$CURRENT_DIR/.git" ]] || fail "Git worktree not found: $CURRENT_DIR"
mkdir -p "$SHARED_DIR"

cd "$CURRENT_DIR"

CURRENT_WORKTREE_SHA="$(git rev-parse HEAD)"
PREVIOUS_SUCCESSFUL_SHA="$CURRENT_WORKTREE_SHA"
if [[ -f "$LAST_SUCCESSFUL_DEPLOY_FILE" ]]; then
  PREVIOUS_SUCCESSFUL_SHA="$(tr -d '[:space:]' < "$LAST_SUCCESSFUL_DEPLOY_FILE")"
fi

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

backup_if_migration_changed "$PREVIOUS_SUCCESSFUL_SHA"

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

printf '%s\n' "$DEPLOY_SHA" > "$LAST_SUCCESSFUL_DEPLOY_FILE"
chmod 600 "$LAST_SUCCESSFUL_DEPLOY_FILE"

log "Deployment completed for $DEPLOY_SHA"
