#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
[[ $EUID -eq 0 ]] || { echo 'Ejecuta este bloque con sudo.'; exit 1; }
bundle=$(cd -- "$(dirname -- "$0")" && pwd)
cd "$bundle"
sha256sum -c files.sha256
base=/opt/apps/iamet/prod/cableado-mail
worker=iamet_cableado_mail
backup="$base/backups/main-site-mail-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup"
exec 9>"$base/.main-site-mail-deploy.lock"
flock -n 9 || { echo 'Ya hay otra actualización de correo en curso.'; exit 1; }
[[ $(docker inspect --format '{{.State.Running}}' "$worker") == true ]]
# Confirm the inspected incident before allowing the targeted catch-up.
incident=$(docker exec -i iamet_v2_db_prod sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -At -v ON_ERROR_STOP=1' <<'SQL'
SELECT count(*) FROM leads WHERE id=9 AND source='form' AND "verticalSlug"='rfid' AND "createdAt"::date='2026-11-12';
SQL
)
[[ "$incident" == 1 ]] || { echo 'DETENIDO: la solicitud 9 difiere de la revisada.'; exit 1; }
cp -a "$base/worker.mjs" "$backup/worker.before.mjs"
python3 "$bundle/patch-worker.py" "$base/worker.mjs" "$backup/worker.next.mjs" --minimum-id 9
docker exec -i "$worker" node --check --input-type=module < "$backup/worker.next.mjs"
# Refuse to replace an unrelated bind mount or a concurrent change.
docker inspect "$worker" --format '{{json .Mounts}}' | python3 -c 'import json,sys; assert any(m["Source"]=="/opt/apps/iamet/prod/cableado-mail/worker.mjs" and m["Destination"]=="/app/cableado-mail.mjs" for m in json.load(sys.stdin))'
cmp -s "$base/worker.mjs" "$backup/worker.before.mjs"
rollback() {
 trap - ERR
 cat "$backup/worker.before.mjs" > "$base/worker.mjs"
 docker restart "$worker" >/dev/null || true
 echo "Proceso anterior restaurado. Los avisos ya aceptados se conservan. Respaldo: $backup"
 exit 1
}
trap rollback ERR
# Preserve the bind-mounted inode; no application or database container is restarted.
cat "$backup/worker.next.mjs" > "$base/worker.mjs"
docker exec "$worker" node /app/cableado-mail.mjs --check
docker restart "$worker" >/dev/null
sleep 5
[[ $(docker inspect --format '{{.State.Running}}' "$worker") == true ]]
trap - ERR
echo 'CORRECCIÓN DE AVISOS ACTIVADA. Sitio y CRM no reiniciados.'
echo "Respaldo: $backup"
sleep 20
docker exec -i iamet_v2_db_prod sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' <<'SQL'
SELECT lead_id,kind,status,attempts,provider_id,last_error
FROM landing_mail_jobs WHERE lead_id=9 ORDER BY kind;
SQL
echo 'accepted significa aceptado por Resend; falta confirmar recepción en el buzón.'
