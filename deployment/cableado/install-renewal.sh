#!/usr/bin/env bash
set -Eeuo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
sudo install -m 755 "$ROOT/renew-certificate.sh" /usr/local/sbin/iamet-cableado-renew
sudo tee /etc/systemd/system/iamet-cableado-certificate.service >/dev/null <<'UNIT'
[Unit]
Description=Renew TLS certificate for cableadoestructurado.iamet.mx
After=docker.service network-online.target
Requires=docker.service
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/iamet-cableado-renew
UNIT
sudo tee /etc/systemd/system/iamet-cableado-certificate.timer >/dev/null <<'UNIT'
[Unit]
Description=Check IAMET cableado TLS certificate twice daily
[Timer]
OnCalendar=*-*-* 03,15:00:00
RandomizedDelaySec=1800
Persistent=true
[Install]
WantedBy=timers.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now iamet-cableado-certificate.timer
sudo systemctl list-timers iamet-cableado-certificate.timer --no-pager
