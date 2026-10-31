#!/usr/bin/env bash
# First deployment only. Old IAMET and all other sites stay untouched until cutover.
set -Eeuo pipefail
umask 077
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
OLD=/opt/apps/iamet/staging
NGINX=/opt/infra/nginx/sites-enabled/30-iamet-staging.conf
cd "$ROOT"
[[ "$ROOT" != "$OLD" ]] || { echo 'Use a separate checkout, not the existing staging directory.'; exit 1; }
command -v python3 >/dev/null
command -v curl >/dev/null
sudo -v
docker compose version >/dev/null
docker network inspect infra_network >/dev/null
docker inspect global_nginx iamet_app_staging iamet_db_staging >/dev/null
[[ -f "$NGINX" && -d "$OLD" ]] || { echo 'Existing staging paths missing.'; exit 1; }
grep -q 'server_name staging.iamet.mx' "$NGINX"
for name in iamet_v2_app_staging iamet_v2_db_staging iamet_v2_redis_staging; do
  if docker container inspect "$name" >/dev/null 2>&1; then echo "Already exists: $name. Refusing first-deployment script."; exit 1; fi
done
for name in iamet_v2_pg_staging iamet_v2_redis_staging; do
  if docker volume inspect "$name" >/dev/null 2>&1; then echo "Volume already exists: $name. No data will be overwritten."; exit 1; fi
done
[[ -z $(git status --porcelain --untracked-files=no) ]] || { echo 'New checkout must have no tracked modifications.'; exit 1; }
export RELEASE_ID
RELEASE_ID=$(git rev-parse --short=12 HEAD)
BACKUP="/opt/apps/iamet/backups/pre-v2-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP"
chmod 700 "$BACKUP"
# Back up actual code, local modifications, environment and database. No secrets printed.
tar --exclude=.git --exclude=node_modules --exclude=dist -czf "$BACKUP/old-site.tar.gz" -C "$OLD" .
git -C "$OLD" diff HEAD > "$BACKUP/old-tracked.patch"
git -C "$OLD" rev-parse HEAD > "$BACKUP/old-commit.txt"
docker inspect iamet_app_staging > "$BACKUP/old-container.private.json"
docker exec iamet_db_staging sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$BACKUP/old-database.dump"
[[ -s "$BACKUP/old-database.dump" ]]
docker exec -i iamet_db_staging pg_restore --list < "$BACKUP/old-database.dump" > /dev/null
tar -tzf "$BACKUP/old-site.tar.gz" > /dev/null
cp "$NGINX" "$BACKUP/nginx.conf"
printf '%s\n' "$BACKUP" > deployment/vps-v2/last-backup
printf '%s\n' "$RELEASE_ID" > deployment/vps-v2/release-id
if [[ ! -f deployment/vps-v2/.env.v2 ]]; then
  python3 deployment/vps-v2/prepare-env.py
else
  echo 'Using the existing private .env.v2 without changing its credentials.'
fi
COMPOSE=(env -u POSTGRES_PASSWORD -u REDIS_PASSWORD -u JWT_SECRET docker compose --project-name iamet-v2-staging --env-file "$ROOT/deployment/vps-v2/.env.v2" -f "$ROOT/deployment/vps-v2/compose.yml")
"${COMPOSE[@]}" config --quiet
"${COMPOSE[@]}" build app
# Read only a silent terminal prompt, never command arguments or committed files.
read -r -s -p 'New administrator password (at least 16 characters): ' ADMIN_PASSWORD
printf '\n'
read -r -s -p 'Repeat administrator password: ' ADMIN_CONFIRM
printf '\n'
[[ ${#ADMIN_PASSWORD} -ge 16 && "$ADMIN_PASSWORD" == "$ADMIN_CONFIRM" ]] || { echo 'Passwords do not match or are too short.'; exit 1; }
unset ADMIN_CONFIRM
export ADMIN_PASSWORD
cleanup_password() { unset ADMIN_PASSWORD; }
trap cleanup_password EXIT
"${COMPOSE[@]}" up -d --wait iamet_v2_db iamet_v2_redis
"${COMPOSE[@]}" run --rm --no-deps -e ADMIN_PASSWORD app node scripts/init-vps-v2.mjs
"${COMPOSE[@]}" up -d --no-build --wait app
docker exec -e ADMIN_PASSWORD iamet_v2_app_staging node scripts/verify-vps-v2.mjs
unset ADMIN_PASSWORD
# Confirm the shared proxy can resolve/reach the new app before modifying its vhost.
docker exec global_nginx wget -qO- http://iamet_v2_app_staging:3000/api/health >/dev/null
# Automatic rollback if Nginx validation, reload or external verification fails.
CUTOVER=0
restore_on_error() {
  local code=$?
  if [[ $CUTOVER == 1 ]]; then
    echo 'Cutover failed. Restoring previous Nginx configuration.'
    sudo install -m 644 "$BACKUP/nginx.conf" "$NGINX"
    docker exec global_nginx nginx -t && docker exec global_nginx nginx -s reload
  fi
  exit "$code"
}
trap restore_on_error ERR
CUTOVER=1
sudo install -m 644 deployment/vps-v2/nginx.conf "$NGINX"
docker exec global_nginx nginx -t
docker exec global_nginx nginx -s reload
sleep 2
curl --fail --silent --show-error --retry 5 --retry-delay 2 --retry-all-errors https://staging.iamet.mx/api/health | python3 -c 'import json,os,sys; assert json.load(sys.stdin).get("release") == os.environ["RELEASE_ID"], "Unexpected release served by Nginx"'
curl --fail --silent --show-error https://staging.iamet.mx/admin/login >/dev/null
CUTOVER=0
trap - ERR
echo "Deployment verified: https://staging.iamet.mx/ | Release: $RELEASE_ID"
echo "Administrator: alvaro.rivera@iamet.mx | Backup: $BACKUP"
echo 'Old site/database remain running for rollback. No old volumes were deleted.'
