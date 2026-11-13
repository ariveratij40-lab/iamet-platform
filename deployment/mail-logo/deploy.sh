#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
[[ $EUID -eq 0 ]] || exit 1
cd "$(dirname "$0")"
sha256sum -c files.sha256
base=/opt/apps/iamet/prod/cableado-mail
backup="$base/backups/logo-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$backup"
exec 9>"$base/.main-site-mail-deploy.lock"
flock -n 9
cp -a "$base/worker.mjs" "$backup/worker.before.mjs"
python3 - "$base/worker.mjs" "$backup/worker.next.mjs" <<'PY'
from pathlib import Path
import sys
s=Path(sys.argv[1]).read_text()
old='https://iamet.mx/brand/iamet-lockup-on-light.png'
assert 'BRANDED_LEAD_CONFIRMATION_V1' in s, 'Falta activar el diseño de correo'
assert s.count(old)==1, 'Logo inesperado; revisar antes de modificar'
Path(sys.argv[2]).write_text(s.replace(old,'https://iamet.mx/brand/iamet-email-official-v2.png'))
PY
docker exec -i iamet_cableado_mail node --check --input-type=module < "$backup/worker.next.mjs"
chmod 644 iamet-email-official-v2.png
docker cp iamet-email-official-v2.png iamet_v2_app_prod:/app/dist/public/brand/iamet-email-official-v2.png
curl --fail --silent --show-error --max-time 20 https://iamet.mx/brand/iamet-email-official-v2.png > "$backup/public-logo.png"
cmp iamet-email-official-v2.png "$backup/public-logo.png"
cmp "$base/worker.mjs" "$backup/worker.before.mjs"
rollback() { trap - ERR; cat "$backup/worker.before.mjs" > "$base/worker.mjs"; docker restart iamet_cableado_mail >/dev/null; echo "Plantilla anterior restaurada. Respaldo: $backup"; exit 1; }
trap rollback ERR
cat "$backup/worker.next.mjs" > "$base/worker.mjs"
docker exec iamet_cableado_mail node /app/cableado-mail.mjs --check
docker restart iamet_cableado_mail >/dev/null
sleep 5
[[ $(docker inspect --format '{{.State.Running}}' iamet_cableado_mail) == true ]]
trap - ERR
echo 'LOGO OFICIAL ACTIVADO PARA NUEVOS AVISOS. Sitio no reiniciado.'
echo "Respaldo: $backup"
echo 'El PNG debe conservarse en futuras imágenes: incluido en la rama de esta corrección.'
