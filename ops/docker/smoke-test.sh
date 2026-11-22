#!/usr/bin/env bash
# Smoke test of the production image against a throw-away MySQL 8 (mysql_native_password,
# like the Elcodelabs host MySQL). Runs in CI before the image is pushed; also usable locally:
#
#   bash ops/docker/smoke-test.sh <image>
#
# Checks: migrate deploy, compiled seed, then `serve`: health (DB), web SSR, API routing,
# robots.txt/sitemap.xml via the API, a real 404 page, security headers, and prints memory use.
set -Eeuo pipefail

IMAGE="${1:?usage: smoke-test.sh <image>}"
DB_CONTAINER="indobraga-smoke-db"
APP_CONTAINER="indobraga-smoke-app"
APP_PORT=8087
DB_PORT=3307
ENV_FILE="$(mktemp)"

cleanup() {
  status=$?
  if [[ $status -ne 0 ]]; then
    echo "::group::app logs"
    docker logs "$APP_CONTAINER" 2>&1 | tail -80 || true
    echo "::endgroup::"
  fi
  docker rm -f "$APP_CONTAINER" "$DB_CONTAINER" >/dev/null 2>&1 || true
  rm -f "$ENV_FILE"
  exit $status
}
trap cleanup EXIT

log() { printf '[smoke] %s\n' "$*"; }
check() { # check <description> <command...>
  local description="$1"; shift
  if "$@" >/dev/null 2>&1; then log "ok   - $description"; else log "FAIL - $description"; return 1; fi
}

random() { head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

log "Starting MySQL"
docker run -d --name "$DB_CONTAINER" -p "$DB_PORT:3306" \
  -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=smoke \
  -e MYSQL_USER=smoke -e MYSQL_PASSWORD=smoke \
  mysql:8.0 --default-authentication-plugin=mysql_native_password >/dev/null
# Wait for the REAL server: on first start the mysql image runs a temporary, socket-only server
# to initialise the database, so a socket `mysqladmin ping` can pass and then the server restarts
# under us (Prisma P1017). A TCP query as the app user only succeeds once init is finished.
db_ready() { docker exec "$DB_CONTAINER" mysql --protocol=TCP -h127.0.0.1 -usmoke -psmoke -e 'SELECT 1' smoke >/dev/null 2>&1; }
for _ in $(seq 1 90); do
  db_ready && break
  sleep 2
done
db_ready || { docker logs "$DB_CONTAINER" 2>&1 | tail -40; echo "[smoke] MySQL did not become ready"; exit 1; }

cat > "$ENV_FILE" <<EOF
NODE_ENV=production
APP_PORT=$APP_PORT
DATABASE_URL=mysql://smoke:smoke@host.docker.internal:$DB_PORT/smoke
SESSION_SECRET=$(random)
CREDENTIAL_ENCRYPTION_KEY=$(random)
INTERNAL_WORKER_SECRET=$(random)
CORS_ORIGINS=https://smoke.example.test
PUBLIC_SITE_URL=https://smoke.example.test
PUBLIC_MEDIA_URL=https://media.smoke.example.test
STORAGE_DRIVER=s3
MEDIA_STORAGE_ENV=prod
S3_ENDPOINT=https://s3.smoke.example.test
S3_BUCKET=smoke
S3_ACCESS_KEY_ID=smoke
S3_SECRET_ACCESS_KEY=smoke
EMAIL_PROVIDER_MODE=mock
SEED_SUPER_ADMIN_NAME=Smoke Admin
SEED_SUPER_ADMIN_EMAIL=smoke-admin@example.test
SEED_SUPER_ADMIN_PASSWORD=$(random)
SEED_CONTENT_EDITOR_NAME=Smoke Editor
SEED_CONTENT_EDITOR_EMAIL=smoke-editor@example.test
SEED_CONTENT_EDITOR_PASSWORD=$(random)
EOF

RUN_ARGS=(--env-file "$ENV_FILE" --add-host host.docker.internal:host-gateway)

log "migrate"
docker run --rm "${RUN_ARGS[@]}" "$IMAGE" migrate
log "seed"
docker run --rm "${RUN_ARGS[@]}" "$IMAGE" seed

log "serve"
docker run -d --name "$APP_CONTAINER" "${RUN_ARGS[@]}" -p "127.0.0.1:$APP_PORT:$APP_PORT" --memory 512m "$IMAGE" >/dev/null

BASE="http://127.0.0.1:$APP_PORT"
for _ in $(seq 1 45); do
  curl -fsS "$BASE/api/v1/health" >/dev/null 2>&1 && break
  sleep 2
done

check "health (API + database)"                curl -fsS "$BASE/api/v1/health"
check "web SSR home page"                       bash -c "curl -fsS '$BASE/' | grep -qi '<html'"
check "public API routed to the API"            bash -c "curl -fsS '$BASE/api/v1/public/site-settings' | grep -q 'success'"
check "robots.txt served by the API"            bash -c "curl -fsS '$BASE/robots.txt' | grep -qi 'sitemap'"
check "sitemap.xml served by the API"           bash -c "curl -fsS '$BASE/sitemap.xml' | grep -q '<urlset'"
check "unknown portfolio slug is a real 404"    bash -c "[ \"\$(curl -s -o /dev/null -w '%{http_code}' '$BASE/portfolio/tidak-ada-slug')\" = 404 ]"
check "web sends X-Frame-Options"               bash -c "curl -sI '$BASE/' | grep -qi '^x-frame-options: DENY'"
check "API sends helmet headers"                bash -c "curl -sI '$BASE/api/v1/health' | grep -qi '^x-content-type-options'"

log "container state"
docker inspect -f 'status={{.State.Status}} health={{.State.Health.Status}} restarts={{.RestartCount}}' "$APP_CONTAINER"
docker stats --no-stream --format 'memory: {{.MemUsage}} cpu: {{.CPUPerc}}' "$APP_CONTAINER"
log "all checks passed"
