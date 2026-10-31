#!/usr/bin/env bash
# Update application code only; never initialize or migrate an existing database.
set -Eeuo pipefail
umask 077
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
cd "$ROOT"
[[ -f deployment/vps-v2/.env.v2 && -f deployment/vps-v2/release-id ]]
[[ -z $(git status --porcelain --untracked-files=no) ]] || { echo 'Tracked modifications detected; update stopped.'; exit 1; }
PREVIOUS=$(cat deployment/vps-v2/release-id)
export RELEASE_ID
RELEASE_ID=$(git rev-parse --short=12 HEAD)
[[ "$PREVIOUS" != "$RELEASE_ID" ]] || { echo 'This release is already installed.'; exit 0; }
docker image inspect "iamet-v2-staging:$PREVIOUS" >/dev/null
docker inspect iamet_v2_app_staging iamet_v2_db_staging iamet_v2_redis_staging global_nginx >/dev/null
COMPOSE=(env -u POSTGRES_PASSWORD -u REDIS_PASSWORD -u JWT_SECRET docker compose --project-name iamet-v2-staging --env-file "$ROOT/deployment/vps-v2/.env.v2" -f "$ROOT/deployment/vps-v2/compose.yml")
"${COMPOSE[@]}" config --quiet
"${COMPOSE[@]}" build app
BACKUP="/opt/apps/iamet/backups/update-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP"
chmod 700 "$BACKUP"
docker exec iamet_v2_db_staging sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$BACKUP/database.dump"
docker exec -i iamet_v2_db_staging pg_restore --list < "$BACKUP/database.dump" >/dev/null
printf '%s\n' "$PREVIOUS" > "$BACKUP/previous-release"
restore_on_error() {
  local code=$?
  echo 'Application update failed; restoring the previous image. Database stays unchanged.'
  RELEASE_ID=$PREVIOUS
  export RELEASE_ID
  "${COMPOSE[@]}" up -d --no-deps --no-build --wait app
  docker exec global_nginx nginx -t && docker exec global_nginx nginx -s reload
  exit "$code"
}
trap restore_on_error ERR
"${COMPOSE[@]}" up -d --no-deps --no-build --wait app
# Validate application routes before making Nginx resolve the recreated container.
docker exec iamet_v2_app_staging node -e 'Promise.all(["/acceso","/admin/login","/"].map(p=>fetch("http://127.0.0.1:3000"+p))).then(rs=>{if(rs.some(r=>!r.ok))process.exit(1)}).catch(()=>process.exit(1))'
docker exec iamet_v2_app_staging node -e 'fetch("http://127.0.0.1:3000/api/auth/access",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}).then(r=>process.exit(r.status===400?0:1)).catch(()=>process.exit(1))'
docker exec global_nginx nginx -t
docker exec global_nginx nginx -s reload
sleep 2
curl --fail --silent --show-error --retry 5 --retry-delay 2 --retry-all-errors https://staging.iamet.mx/api/health | python3 -c 'import json,os,sys; assert json.load(sys.stdin).get("release") == os.environ["RELEASE_ID"], "Unexpected public release"'
curl --fail --silent --show-error https://staging.iamet.mx/acceso >/dev/null
printf '%s\n' "$RELEASE_ID" > deployment/vps-v2/release-id
trap - ERR
echo "Application updated: https://staging.iamet.mx/ | Release: $RELEASE_ID"
echo 'Existing accounts, passwords, database and conversations preserved.'
