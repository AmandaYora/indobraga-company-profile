#!/usr/bin/env bash
# Indobraga deploy on the Elcodelabs VPS - lives at ~/indobraga/deploy.sh
#
#   cd ~/indobraga && ./deploy.sh <full-git-sha>
#
# Follows the SERVER_PLAYBOOK.md flow: pull -> backup DB -> migrate -> up -> health check.
# It NEVER builds anything here (the image is built by GitHub Actions and pushed to GHCR)
# and only touches this app's own container, database and folder.
set -Eeuo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_DIR"

COMPOSE=(docker compose -f docker-compose.prod.yml)
IMAGE_REPO="ghcr.io/amandayora/indobraga-company-profile"
APP_PORT="${APP_PORT:-8087}"
HEALTH_URL="http://127.0.0.1:${APP_PORT}/api/v1/health"
BACKUP_DIR="$APP_DIR/backups"
KEEP_IMAGES="${KEEP_IMAGES:-2}"

log() { printf '[deploy] %s\n' "$*"; }
fail() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

SHA="${1:-}"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || fail "Usage: ./deploy.sh <full 40-char git sha>"
[[ -f .env ]] || fail ".env not found in $APP_DIR"
[[ "$(stat -c %a .env)" == "600" ]] || fail ".env must be chmod 600"

# --- guard: refuse to run if another app's folder was passed by mistake
[[ "$(basename "$APP_DIR")" == "indobraga" ]] || fail "deploy.sh must live in ~/indobraga"

PREVIOUS_TAG="$(grep -E '^IMAGE_TAG=' .env | tail -1 | cut -d= -f2- || true)"

log "Pulling $IMAGE_REPO:$SHA"
docker pull "$IMAGE_REPO:$SHA"

# --- backup the database before migrations (playbook: back up before migrations)
db_url="$(grep -E '^DATABASE_URL=' .env | tail -1 | cut -d= -f2-)"
[[ -n "$db_url" ]] || fail "DATABASE_URL missing in .env"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
ts="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$BACKUP_DIR/indobraga_db-${SHA:0:12}-$ts.sql.gz"
defaults="$(mktemp)"
trap 'rm -f "$defaults"' EXIT
python3 - "$db_url" "$defaults" <<'PY'
import sys, urllib.parse as u
url = u.urlparse(sys.argv[1])
# The DB host is reached from the host shell on 127.0.0.1 (the container uses host.docker.internal).
open(sys.argv[2], "w").write(
    "[client]\nprotocol=tcp\nhost=127.0.0.1\nport=%s\nuser=%s\npassword=%s\n"
    % (url.port or 3306, u.unquote(url.username or ""), u.unquote(url.password or ""))
)
PY
chmod 600 "$defaults"
db_name="$(python3 -c "import sys,urllib.parse as u; print(u.urlparse(sys.argv[1]).path.lstrip('/'))" "$db_url")"
log "Backing up database $db_name -> $backup_file"
if ! mysqldump --defaults-extra-file="$defaults" --single-transaction --quick --routines --triggers "$db_name" | gzip -c > "$backup_file"; then
  rm -f "$backup_file"
  fail "Database backup failed; nothing was migrated."
fi
chmod 600 "$backup_file"

# --- point the compose file at the new image (recorded in .env, no :latest fallback)
if grep -qE '^IMAGE_TAG=' .env; then
  sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$SHA/" .env
else
  printf '\nIMAGE_TAG=%s\n' "$SHA" >> .env
fi

log "Running Prisma migrations"
if ! "${COMPOSE[@]}" run --rm --no-deps app migrate; then
  [[ -n "$PREVIOUS_TAG" ]] && sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$PREVIOUS_TAG/" .env
  fail "Migration failed. The running container was not touched. Backup: $backup_file"
fi

log "Starting container"
"${COMPOSE[@]}" up -d --remove-orphans app

log "Waiting for $HEALTH_URL"
for attempt in $(seq 1 30); do
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    log "Health check passed (attempt $attempt)"
    healthy=1
    break
  fi
  sleep 3
done
if [[ "${healthy:-0}" != "1" ]]; then
  "${COMPOSE[@]}" logs --tail 60 app || true
  fail "Health check failed. Roll back with: ./deploy.sh <previous-sha>  (previous: ${PREVIOUS_TAG:-none})"
fi

# --- keep the running image plus the previous ones; remove only OLD indobraga tags
mapfile -t old_tags < <(docker images "$IMAGE_REPO" --format '{{.Tag}}' | grep -E '^[0-9a-f]{40}$' | tail -n +"$((KEEP_IMAGES + 1))" || true)
for tag in "${old_tags[@]:-}"; do
  [[ -n "$tag" && "$tag" != "$SHA" ]] && docker rmi "$IMAGE_REPO:$tag" >/dev/null 2>&1 || true
done

log "Deployment completed: $SHA"
