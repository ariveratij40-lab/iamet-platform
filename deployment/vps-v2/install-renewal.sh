#!/usr/bin/env bash
set -Eeuo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
sudo install -m 755 "$ROOT/renew-certificate.sh" /usr/local/sbin/iamet-staging-renew
sudo tee /etc/systemd/system/iamet-staging-certificate.service >/dev/null <<'UNIT'
[Unit]
Description=Renew TLS certificate for staging.iamet.mx
After=docker.service network-online.target
Requires=docker.service
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/iamet-staging-renew
UNIT
sudo tee /etc/systemd/system/iamet-staging-certificate.timer >/dev/null <<'UNIT'
[Unit]
Description=Check IAMET staging TLS certificate twice daily
[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=1800
Persistent=true
[Install]
WantedBy=timers.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now iamet-staging-certificate.timer
sudo systemctl list-timers iamet-staging-certificate.timer --no-pager
