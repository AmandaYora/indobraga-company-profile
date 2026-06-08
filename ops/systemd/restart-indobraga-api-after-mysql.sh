#!/usr/bin/env bash
set -Eeuo pipefail

PM2_USER="${PM2_USER:-dimasprasetio}"
PM2_HOME="${PM2_HOME:-/home/${PM2_USER}/.pm2}"
PM2_BIN="${PM2_BIN:-/usr/bin/pm2}"
APP_NAME="${APP_NAME:-indobraga-api}"
MYSQLADMIN_BIN="${MYSQLADMIN_BIN:-/usr/bin/mysqladmin}"
LOGGER_TAG="${LOGGER_TAG:-indobraga-mysql-hook}"
MYSQL_READY_ATTEMPTS="${MYSQL_READY_ATTEMPTS:-30}"
MYSQL_READY_DELAY_SECONDS="${MYSQL_READY_DELAY_SECONDS:-1}"

log() {
  logger -t "$LOGGER_TAG" "$*"
  printf '[%s] %s\n' "$LOGGER_TAG" "$*"
}

run_pm2() {
  if [[ "$(id -u)" -eq 0 ]]; then
    runuser -u "$PM2_USER" -- env PM2_HOME="$PM2_HOME" "$PM2_BIN" "$@"
  else
    env PM2_HOME="$PM2_HOME" "$PM2_BIN" "$@"
  fi
}

wait_for_mysql() {
  local attempt

  for ((attempt = 1; attempt <= MYSQL_READY_ATTEMPTS; attempt += 1)); do
    if "$MYSQLADMIN_BIN" ping --silent >/dev/null 2>&1; then
      return 0
    fi

    sleep "$MYSQL_READY_DELAY_SECONDS"
  done

  return 1
}

if [[ ! -x "$MYSQLADMIN_BIN" ]]; then
  log "mysqladmin was not found at $MYSQLADMIN_BIN; skipping API restart."
  exit 0
fi

if [[ ! -x "$PM2_BIN" ]]; then
  log "PM2 was not found at $PM2_BIN; skipping API restart."
  exit 0
fi

if ! wait_for_mysql; then
  log "MySQL did not become ready after ${MYSQL_READY_ATTEMPTS} attempts; skipping API restart."
  exit 0
fi

if command -v systemctl >/dev/null 2>&1 && ! systemctl is-active --quiet "pm2-${PM2_USER}.service"; then
  log "pm2-${PM2_USER}.service is not active; skipping API restart."
  exit 0
fi

if ! run_pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  log "PM2 process $APP_NAME was not found; skipping API restart."
  exit 0
fi

if run_pm2 restart "$APP_NAME" --update-env; then
  log "Restarted PM2 process $APP_NAME after MySQL became ready."
else
  log "Failed to restart PM2 process $APP_NAME; leaving MySQL service healthy."
fi

exit 0
