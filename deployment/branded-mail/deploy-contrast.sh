#!/usr/bin/env bash
set -euo pipefail
umask 077
repo=$(git rev-parse --show-toplevel)
base=/opt/apps/iamet/prod/cableado-mail
cont=iamet_cableado_mail
dest=/app/cableado-mail.mjs
test "$(id -u)" = 0
exec 9>"$base/.branded-mail-deploy.lock"
flock -n 9
test "$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/app/cableado-mail.mjs"}}{{.Source}}{{end}}{{end}}' "$cont")" = "$base/worker.mjs"
test "$(docker inspect -f '{{.State.Running}}' "$cont")" = true
mkdir -p "$base/backups"
backup=$(mktemp -d "$base/backups/contraste.XXXXXX")
git -C "$repo" diff HEAD^ HEAD -- deployment/cableado-mail/worker.mjs > "$backup/cambio.patch"
test -s "$backup/cambio.patch"
cd "$backup"
cp -p "$base/worker.mjs" anterior.mjs
cp anterior.mjs worker.mjs
if git apply --reverse --check -p3 cambio.patch 2>/dev/null; then
  echo "El archivo activo ya contiene el ajuste."
else
  git apply --check -p3 cambio.patch
  git apply -p3 cambio.patch
fi
docker exec -i "$cont" node --check --input-type=module < worker.mjs
cmp -s anterior.mjs "$base/worker.mjs"
rollback() {
  trap - ERR
  cat anterior.mjs > "$base/worker.mjs"
  docker restart "$cont" >/dev/null
  echo "Worker anterior restaurado. Respaldo: $backup"
  exit 1
}
trap rollback ERR
cat worker.mjs > "$base/worker.mjs"
docker restart "$cont" >/dev/null
sleep 5
test "$(docker inspect -f '{{.State.Running}}' "$cont")" = true
docker exec "$cont" node "$dest" --check
trap - ERR
echo "CORREO_CONTRASTE_PUBLICADO_OK"
echo "RESPALDO=$backup/anterior.mjs"
