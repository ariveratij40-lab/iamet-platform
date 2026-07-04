#!/bin/bash
# ─── IAMET Platform — Script de Despliegue (Staging) ─────────────────────────
# Uso: ./infra/scripts/deploy.sh
# Requiere: Docker, Docker Compose, git, acceso a /opt/apps/iamet/staging

set -euo pipefail

DEPLOY_DIR="/opt/apps/iamet/staging"
COMPOSE_FILE="docker-compose.staging.yml"
ENV_FILE=".env.staging"
APP_CONTAINER="iamet_app_staging"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  IAMET Platform — Despliegue Staging"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── 1. Verificar directorio de despliegue ────────────────────────────────────
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "✗ Directorio $DEPLOY_DIR no existe. Ejecuta primero:"
    echo "  sudo mkdir -p $DEPLOY_DIR && sudo chown \$USER:\$USER $DEPLOY_DIR"
    echo "  cd $DEPLOY_DIR && git clone https://github.com/ariveratij40-lab/iamet-platform.git ."
    exit 1
fi

cd "$DEPLOY_DIR"

# ─── 2. Verificar .env.staging ────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    echo "✗ Archivo $ENV_FILE no encontrado."
    echo "  Copia .env.staging.example como .env.staging y completa los valores."
    exit 1
fi

# ─── 2b. Validar variables críticas del LLM ─────────────────────────────────
# REGLA: BUILT_IN_FORGE_API_KEY y BUILT_IN_FORGE_API_URL son OBLIGATORIAS.
# Sin ellas el agente ARIA cae al fallback genérico "Entendido. ¿En qué más puedo ayudarte?"
# y el LLM nunca se invoca. Verificar ANTES del build para fallar rápido.
echo ""
echo "▶ Validando variables críticas del LLM..."

FORGE_KEY=$(grep '^BUILT_IN_FORGE_API_KEY=' "$ENV_FILE" | cut -d= -f2)
FORGE_URL=$(grep '^BUILT_IN_FORGE_API_URL=' "$ENV_FILE" | cut -d= -f2)

if [ -z "$FORGE_KEY" ]; then
    echo "✗ BUILT_IN_FORGE_API_KEY está vacía en $ENV_FILE"
    echo "  El agente ARIA no funcionará sin esta variable."
    echo "  Obtén el valor desde el panel de Manus → Settings → Secrets"
    echo "  y agrégalo al $ENV_FILE antes de continuar."
    exit 1
fi

if [ -z "$FORGE_URL" ]; then
    echo "✗ BUILT_IN_FORGE_API_URL está vacía en $ENV_FILE"
    echo "  Valor esperado: https://forge.manus.ai"
    exit 1
fi

echo "  ✓ BUILT_IN_FORGE_API_KEY configurada (${#FORGE_KEY} chars)"
echo "  ✓ BUILT_IN_FORGE_API_URL = $FORGE_URL"

# ─── 3. Pull del código más reciente ─────────────────────────────────────────
echo ""
echo "▶ Actualizando código desde GitHub..."
git pull origin main

# ─── 4. Build de la imagen Docker ────────────────────────────────────────────
echo ""
echo "▶ Construyendo imagen Docker..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache "$APP_CONTAINER"

# ─── 5. Levantar servicios de infraestructura (DB + Redis) ───────────────────
echo ""
echo "▶ Iniciando PostgreSQL y Redis..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d iamet_db_staging iamet_redis_staging

# Esperar a que la DB esté lista
echo "  Esperando a que PostgreSQL esté disponible..."
sleep 5

# ─── 6. Ejecutar migraciones ──────────────────────────────────────────────────
echo ""
echo "▶ Ejecutando migraciones de base de datos..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm \
    -e DATABASE_URL="postgresql://$(grep POSTGRES_USER $ENV_FILE | cut -d= -f2):$(grep POSTGRES_PASSWORD $ENV_FILE | cut -d= -f2)@iamet_db_staging:5432/$(grep POSTGRES_DB $ENV_FILE | cut -d= -f2)" \
    "$APP_CONTAINER" node -e "
const { execSync } = require('child_process');
execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
" 2>/dev/null || true

# ─── 7. Reiniciar la aplicación ───────────────────────────────────────────────
echo ""
echo "▶ Reiniciando la aplicación..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate "$APP_CONTAINER"

# ─── 8. Verificar estado ──────────────────────────────────────────────────────
echo ""
echo "▶ Verificando estado de los contenedores..."
sleep 5
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Despliegue completado — https://staging.iamet.mx"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
