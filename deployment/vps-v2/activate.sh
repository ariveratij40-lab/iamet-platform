#!/usr/bin/env bash
# Resume a completed installation after a failed cutover. Never initializes data.
set -Eeuo pipefail
umask 077
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$ROOT"
sudo -v
BACKUP=$(cat deployment/vps-v2/last-backup)
export RELEASE_ID
RELEASE_ID=$(cat deployment/vps-v2/release-id)
[[ "$BACKUP" == /opt/apps/iamet/backups/pre-v2-* && -f "$BACKUP/nginx.conf" ]]
NGINX=/opt/infra/nginx/sites-enabled/30-iamet-staging.conf
[[ $(docker inspect --format '{{.State.Health.Status}}' iamet_v2_app_staging) == healthy ]]
docker exec global_nginx wget -qO- http://iamet_v2_app_staging:3000/api/health | python3 -c 'import json,os,sys; assert json.load(sys.stdin).get("release") == os.environ["RELEASE_ID"], "Unexpected new release"'
GENERATED=$(mktemp)
CURRENT=$(mktemp)
cleanup() { rm -f "$GENERATED" "$CURRENT"; }
trap cleanup EXIT
python3 deployment/vps-v2/render-nginx.py "$BACKUP/nginx.conf" "$GENERATED"
cp "$NGINX" "$CURRENT"
restore_on_error() {
  local code=$?
  echo 'Activation failed. Restoring the configuration that was active before this attempt.'
  sudo install -m 644 "$CURRENT" "$NGINX"
  docker exec global_nginx nginx -t && docker exec global_nginx nginx -s reload
  exit "$code"
}
trap restore_on_error ERR
sudo install -m 644 "$GENERATED" "$NGINX"
docker exec global_nginx nginx -t
docker exec global_nginx nginx -s reload
sleep 2
curl --fail --silent --show-error --retry 5 --retry-delay 2 --retry-all-errors https://staging.iamet.mx/api/health | python3 -c 'import json,os,sys; assert json.load(sys.stdin).get("release") == os.environ["RELEASE_ID"], "Unexpected release served publicly"'
curl --fail --silent --show-error https://staging.iamet.mx/admin/login >/dev/null
trap - ERR
echo "New IAMET activated: https://staging.iamet.mx/ | Release: $RELEASE_ID"
echo 'Database, administrator account and passwords were preserved.'
