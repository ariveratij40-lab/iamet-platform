#!/usr/bin/env bash
# Update the IONOS app while preserving its active configuration and database.
set -Eeuo pipefail
umask 077
[[ $EUID -eq 0 ]] || { echo 'Ejecute con sudo bash.'; exit 1; }
source_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)
expected=${1:?Indique el SHA completo del commit}
base=/opt/apps/iamet/prod
git_source() { git -c safe.directory="$source_dir" -C "$source_dir" "$@"; }
release=$(git_source rev-parse HEAD)
[[ $release == "$expected" && $release =~ ^[0-9a-f]{40}$ ]]
[[ -z $(git_source status --porcelain --untracked-files=no) ]]
[[ -r "$base/config/.env" && -r "$base/compose.yaml" ]]
exec 9>"$base/.update.lock"
flock -n 9 || { echo 'Otra actualización está en curso.'; exit 1; }
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup="$base/backups/computing-$stamp"
work="$base/releases/$release"
image="iamet-v2-prod:git-$release"
mkdir -p "$backup" "$work"
cp -a "$base/compose.yaml" "$backup/compose.yaml"
docker inspect --format '{{.Image}}' iamet_v2_app_prod > "$backup/previous-image.txt"
previous_tag=$(docker inspect --format '{{.Config.Image}}' iamet_v2_app_prod)
previous_revision=$(docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.revision" }}' iamet_v2_app_prod)
[[ $previous_revision =~ ^[0-9a-f]{40}$ ]] || { echo 'No se identificó el commit activo; revisar antes de desplegar.'; exit 1; }
git_source merge-base --is-ancestor "$previous_revision" "$release" || { echo 'El commit activo no es antecesor de esta versión; se detuvo para evitar perder cambios.'; exit 1; }
docker tag "$(cat "$backup/previous-image.txt")" "iamet-v2-prod:rollback-$stamp"
git_source archive HEAD | tar -x -C "$work"
export base backup release image previous_tag
python3 <<'PY'
import os,re
from pathlib import Path
s=(Path(os.environ['base'])/'compose.yaml').read_text()
pattern=r'(?m)^([ \t]*image:[ \t]*)'+re.escape(os.environ['previous_tag'])+r'[ \t]*$'
s,n=re.subn(pattern,lambda m:m[1]+os.environ['image'],s)
if n!=1: raise SystemExit('La imagen de Compose no coincide con el contenedor activo.')
s,n=re.subn(r'(?m)^([ \t]*)DEPLOY_RELEASE:[^\n]*$',lambda m:m[1]+'DEPLOY_RELEASE: "'+os.environ['release']+'"',s)
if n!=1: raise SystemExit('No se encontró un único DEPLOY_RELEASE; revisar Compose.')
(Path(os.environ['backup'])/'compose.next.yaml').write_text(s)
PY
dc() { docker compose --project-directory "$base" --env-file "$base/config/.env" -f "$base/compose.yaml" "$@"; }
docker compose --project-directory "$base" --env-file "$base/config/.env" -f "$backup/compose.next.yaml" config --quiet
echo 'Construyendo IAMET con el nuevo hero...'
docker build --build-arg VITE_APP_URL=https://iamet.mx --label "org.opencontainers.image.revision=$release" -f "$work/deployment/ionos-production/Dockerfile" -t "$image" "$work"
docker run --rm --network none --entrypoint node "$image" --check /app/dist/index.js
docker exec iamet_v2_db_prod sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup/database.dump"
test -s "$backup/database.dump"
docker exec -i iamet_v2_db_prod pg_restore --list < "$backup/database.dump" > /dev/null
cmp -s "$base/compose.yaml" "$backup/compose.yaml"
[[ $(docker inspect --format '{{.Image}}' iamet_v2_app_prod) == "$(cat "$backup/previous-image.txt")" ]]
rollback() {
  trap - ERR
  echo 'Falló la actualización; restaurando la versión anterior.'
  cp -a "$backup/compose.yaml" "$base/compose.yaml"
  if dc up -d --no-deps --no-build --wait --wait-timeout 120 app && docker exec global_nginx nginx -t && docker exec global_nginx nginx -s reload; then
    echo 'Versión anterior restaurada.'
  else
    echo "Se requiere revisar la recuperación. Respaldo: $backup"
  fi
  exit 1
}
trap rollback ERR
cp "$backup/compose.next.yaml" "$base/compose.yaml"
dc up -d --no-deps --no-build --wait --wait-timeout 120 app
docker exec -e EXPECTED_RELEASE="$release" -i iamet_v2_app_prod node --input-type=module <<'JS'
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3000';
const health=await fetch(base+'/api/health').then(r=>r.json());
assert.equal(health.release,process.env.EXPECTED_RELEASE);
for(const path of ['/','/soluciones/computo-licenciamiento','/images/solutions/computo-licenciamiento.png']) {
 const r=await fetch(base+path); assert.ok(r.ok,path);
 if(path.endsWith('.png')) assert.match(r.headers.get('content-type'),/^image\//);
}
JS
docker exec global_nginx nginx -t
docker exec global_nginx nginx -s reload
curl --fail --silent --show-error --retry 5 --retry-delay 2 --retry-all-errors --max-time 20 https://iamet.mx/api/health | python3 -c 'import json,os,sys; assert json.load(sys.stdin).get("release")==os.environ["release"]'
curl --fail --silent --show-error --max-time 20 https://iamet.mx/soluciones/computo-licenciamiento > /dev/null
printf '%s\n' "$release" > "$base/current-git-release"
trap - ERR
echo "PUBLICADO: https://iamet.mx/soluciones/computo-licenciamiento"
echo "Respaldo: $backup"
