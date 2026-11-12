#!/usr/bin/env bash
# Called by root's systemd timer; renew only staging.iamet.mx.
set -Eeuo pipefail
exec 9>/run/lock/iamet-staging-certificate.lock
flock -n 9 || exit 0
CERT=/opt/infra/certbot/conf/live/staging.iamet.mx/fullchain.pem
BEFORE=$(sha256sum "$CERT" | cut -d' ' -f1)
docker run --rm \
  -v /opt/infra/certbot/conf:/etc/letsencrypt \
  -v /opt/infra/certbot/www:/var/www/certbot \
  certbot/certbot:latest renew --cert-name staging.iamet.mx \
  --webroot-path /var/www/certbot --non-interactive --quiet
AFTER=$(sha256sum "$CERT" | cut -d' ' -f1)
if [[ "$BEFORE" != "$AFTER" ]]; then
  docker exec global_nginx nginx -t
  docker exec global_nginx nginx -s reload
fi
