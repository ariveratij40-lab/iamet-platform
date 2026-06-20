#!/bin/bash
# ─── IAMET Platform — Script de Rollback ─────────────────────────────────────
# Uso: ./infra/scripts/rollback.sh <commit_hash>
# Revierte el código a un commit específico y redespliega

set -euo pipefail

DEPLOY_DIR="/opt/apps/iamet/staging"
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"
APP_CONTAINER="iamet_app_staging"

if [ -z "${1:-}" ]; then
    echo "Uso: $0 <commit_hash>"
    echo ""
    echo "Commits recientes:"
    cd "$DEPLOY_DIR" && git log --oneline -10
    exit 1
fi

COMMIT_HASH="$1"
cd "$DEPLOY_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IAMET Platform — Rollback a: $COMMIT_HASH"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "▶ Revirtiendo código a $COMMIT_HASH..."
git checkout "$COMMIT_HASH"

echo "▶ Reconstruyendo imagen Docker..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache "$APP_CONTAINER"

echo "▶ Reiniciando aplicación..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate "$APP_CONTAINER"

echo ""
echo "✓ Rollback completado a commit: $COMMIT_HASH"
echo "  Para volver a la rama main: git checkout main && ./infra/scripts/deploy.sh"
