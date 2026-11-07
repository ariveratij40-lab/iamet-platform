#!/usr/bin/env bash
# Run only on the test VPS after DNS is ready and app is updated.
set -Eeuo pipefail
umask 077
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
TARGET=/opt/infra/nginx/sites-enabled/31-iamet-cableado.conf
DOMAIN=cableadoestructurado.iamet.mx
[[ -d /opt/infra/certbot/conf && -d /opt/infra/certbot/www ]]
docker inspect global_nginx iamet_v2_app_staging >/dev/null
# Verify current image knows this subdomain before exposing the host.
docker exec iamet_v2_app_staging node -e 'require("node:http").get("http://127.0.0.1:3000/",{headers:{Host:"cableadoestructurado.iamet.mx"}},r=>{let s="";r.on("data",x=>s+=x);r.on("end",()=>process.exit(r.statusCode===200&&s.includes("https://cableadoestructurado.iamet.mx/")?0:1));}).on("error",()=>process.exit(1))'
python3 - <<'PY'
import socket
ips={r[4][0] for r in socket.getaddrinfo('cableadoestructurado.iamet.mx',80,type=socket.SOCK_STREAM)}
if '108.175.9.162' not in ips:
    raise SystemExit('DNS pendiente: cableadoestructurado.iamet.mx debe apuntar a 108.175.9.162.')
PY
BACKUP="/opt/apps/iamet/backups/cableado-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP"
if sudo test -f "$TARGET"; then sudo cp "$TARGET" "$BACKUP/previous.conf"; fi
restore() {
    code=$?
    trap - ERR
    if [[ -f "$BACKUP/previous.conf" ]]; then sudo install -m 644 "$BACKUP/previous.conf" "$TARGET"; else sudo rm -f "$TARGET"; fi
    docker exec global_nginx nginx -t && docker exec global_nginx nginx -s reload
    echo "Activación detenida; configuración anterior restaurada. Respaldo: $BACKUP"
    exit "$code"
}
trap restore ERR
# Existing certificate permits a direct HTTPS reactivation without HTTP downtime.
if ! sudo test -s /opt/infra/certbot/conf/live/cableadoestructurado.iamet.mx/fullchain.pem; then
    sudo install -m 644 "$ROOT/http.conf" "$TARGET"
    docker exec global_nginx nginx -t
    docker exec global_nginx nginx -s reload
    docker run --rm -v /opt/infra/certbot/conf:/etc/letsencrypt -v /opt/infra/certbot/www:/var/www/certbot certbot/certbot:latest certonly --webroot --webroot-path /var/www/certbot --cert-name "$DOMAIN" -d "$DOMAIN"
fi
sudo install -m 644 "$ROOT/https.conf" "$TARGET"
docker exec global_nginx nginx -t

docker exec global_nginx nginx -s reload
curl --fail --silent --show-error --retry 5 --retry-delay 2 --retry-all-errors "https://$DOMAIN/" | python3 -c 'import sys; s=sys.stdin.read(); assert "https://cableadoestructurado.iamet.mx/" in s and "Instalación de cableado estructurado Panduit" in s, "Landing inesperada"'
trap - ERR
echo "Landing disponible: https://$DOMAIN/"
echo 'Validación en VPS de pruebas con el mismo CRM. Noindex conservado; no activar campañas todavía.'
echo "Respaldo de configuración: $BACKUP"
