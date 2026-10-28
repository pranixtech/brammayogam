#!/usr/bin/env bash

set -euo pipefail

APP_DIR=/opt/bramma-yogam
COMPOSE_FILE=docker-compose.vps.yml
NGINX_SITE=bramma-yogam.conf

install -d -m 0755 "$APP_DIR"
tar -xzf /tmp/source.tar.gz -C "$APP_DIR"
install -m 0644 /tmp/docker-compose.vps.yml "$APP_DIR/$COMPOSE_FILE"
install -m 0644 /tmp/nginx-bramma-yogam.conf "/etc/nginx/sites-available/$NGINX_SITE"
ln -sfn "/etc/nginx/sites-available/$NGINX_SITE" "/etc/nginx/sites-enabled/$NGINX_SITE"

cd "$APP_DIR"
sed -i \
  -e 's/^WEB_PORT=.*/WEB_PORT=8080/' \
  -e 's/^API_PORT=.*/API_PORT=4000/' \
  -e 's/^COOKIE_SECURE=.*/COOKIE_SECURE=true/' \
  .env
chmod 0600 .env

docker compose -f "$COMPOSE_FILE" up -d postgres

for attempt in $(seq 1 30); do
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U brahmam -d brahmam >/dev/null 2>&1; then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    echo 'PostgreSQL did not become ready in time.' >&2
    exit 1
  fi

  sleep 2
done

docker compose -f "$COMPOSE_FILE" cp /tmp/database.dump postgres:/tmp/database.dump
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_restore -U brahmam -d brahmam --clean --if-exists --no-owner --no-privileges --exit-on-error /tmp/database.dump

docker run --rm \
  -v bramma-yogam_gallery_uploads:/data \
  -v /tmp:/backup:ro \
  alpine:3.21 \
  sh -c 'tar -xzf /backup/uploads.tar.gz -C /data && chown -R 1000:1000 /data'

docker compose -f "$COMPOSE_FILE" up --build -d

nginx -t
systemctl reload nginx

curl -fsS http://127.0.0.1:8080/api/health
echo
docker compose -f "$COMPOSE_FILE" ps
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U brahmam -d brahmam -Atc "SELECT 'photos=' || count(*) FROM photos UNION ALL SELECT 'videos=' || count(*) FROM youtube_videos;"
docker run --rm -v bramma-yogam_gallery_uploads:/data:ro alpine:3.21 \
  sh -c "printf 'uploads='; find /data -type f | wc -l"
