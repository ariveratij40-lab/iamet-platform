#!/bin/bash
# ─── IAMET Platform — Script de Migración de Base de Datos ───────────────────
# Uso: ./infra/scripts/migrate.sh
# Ejecuta drizzle-kit migrate dentro del contenedor de la aplicación

set -euo pipefail

DEPLOY_DIR="/opt/apps/iamet/staging"
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"

cd "$DEPLOY_DIR"

if [ ! -f "$ENV_FILE" ]; then
    echo "✗ Archivo $ENV_FILE no encontrado."
    exit 1
fi

echo "▶ Ejecutando migraciones de base de datos..."

# Leer variables del .env.staging
source <(grep -E '^(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_DB)=' "$ENV_FILE")

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@iamet_db_staging:5432/${POSTGRES_DB}"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm \
    --network infra_network \
    -e DATABASE_URL="$DATABASE_URL" \
    iamet_app_staging \
    sh -c "cd /app && npx drizzle-kit migrate"

echo "✓ Migraciones completadas."
