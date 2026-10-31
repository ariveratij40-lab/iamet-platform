#!/usr/bin/env bash
set -Eeuo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
BACKUP=$(cat "$ROOT/deployment/vps-v2/last-backup")
[[ "$BACKUP" == /opt/apps/iamet/backups/pre-v2-* && -f "$BACKUP/nginx.conf" ]]
docker inspect iamet_app_staging >/dev/null
docker start iamet_app_staging >/dev/null
docker exec global_nginx wget -qO- http://iamet_app_staging:3000/api/health >/dev/null
TARGET=/opt/infra/nginx/sites-enabled/30-iamet-staging.conf
TEMP=$(mktemp)
cp "$TARGET" "$TEMP"
sudo install -m 644 "$BACKUP/nginx.conf" "$TARGET"
if docker exec global_nginx nginx -t && docker exec global_nginx nginx -s reload; then
  rm "$TEMP"
  echo 'Previous site restored. Both databases and new conversation history are preserved.'
else
  sudo install -m 644 "$TEMP" "$TARGET"
  rm "$TEMP"
  docker exec global_nginx nginx -t && docker exec global_nginx nginx -s reload
  exit 1
fi
