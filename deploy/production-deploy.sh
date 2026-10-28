#!/usr/bin/env bash

# Installed as a root-owned forced SSH command on the production VPS.
# The GitHub Actions key can request only a deployment of the current main commit.
set -euo pipefail

APP_DIR=/opt/bramma-yogam
BACKUP_DIR=/root/bramma-yogam-backups
REPOSITORY=https://github.com/pranixtech/brammayogam.git
DEPLOY_REQUEST=${SSH_ORIGINAL_COMMAND:-}

if [[ ! "$DEPLOY_REQUEST" =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  echo 'Expected: deploy <40-character commit SHA>' >&2
  exit 2
fi

REQUESTED_SHA=${BASH_REMATCH[1]}
exec 9>/var/lock/bramma-yogam-deploy.lock
flock -w 600 9

RELEASE_DIR=$(mktemp -d /tmp/bramma-yogam-release.XXXXXXXX)
trap 'rm -rf "$RELEASE_DIR"' EXIT

git clone --quiet --depth 1 --branch main "$REPOSITORY" "$RELEASE_DIR/source"
REPOSITORY_SHA=$(git -C "$RELEASE_DIR/source" rev-parse HEAD)

if [[ "$REPOSITORY_SHA" != "$REQUESTED_SHA" ]]; then
  echo "Commit $REQUESTED_SHA is no longer the main branch tip; skipping superseded deployment."
  exit 0
fi

test -s "$APP_DIR/.env"
install -d -m 700 "$BACKUP_DIR"

# Keep a database snapshot on the VPS before deploying new application code.
docker compose -f "$APP_DIR/docker-compose.vps.yml" --project-directory "$APP_DIR" \
  exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "$BACKUP_DIR/predeploy-$REQUESTED_SHA.dump"
chmod 600 "$BACKUP_DIR/predeploy-$REQUESTED_SHA.dump"

# The environment file and uploaded media stay on the VPS; Docker volumes are untouched.
rsync -a --delete \
  --exclude='/.env' \
  --exclude='/.git/' \
  --exclude='/node_modules/' \
  --exclude='/dist/' \
  --exclude='/server/uploads/' \
  "$RELEASE_DIR/source/" "$APP_DIR/"

cd "$APP_DIR"
docker compose -f docker-compose.vps.yml up -d --build --wait --wait-timeout 180
curl --fail --silent --show-error --retry 10 --retry-delay 2 \
  http://127.0.0.1:8080/api/health
echo
echo "Deployed $REQUESTED_SHA"
