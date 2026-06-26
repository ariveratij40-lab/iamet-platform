# IAMET Platform — Guía de Despliegue (Staging)

Entorno: `staging.iamet.mx` | Repositorio: `ariveratij40-lab/iamet-platform`
Stack: Docker Compose + PostgreSQL 16 + Redis 7 + Nginx global (`global_nginx`) + Certbot webroot

---

## Arquitectura del Despliegue

```
/opt/infra/nginx/sites-enabled/30-iamet-staging.conf  ← Nginx global (reverse proxy)
/opt/infra/certbot/conf/                               ← Certificados SSL (Let's Encrypt)
/opt/infra/certbot/www/                                ← Webroot para ACME challenge
/opt/apps/iamet/staging/                               ← Código fuente + docker-compose

Contenedor Nginx global: global_nginx
Red Docker: infra_network (externa, ya existente en el VPS)

Contenedores de la aplicación:
  iamet_app_staging    → Node.js 20, puerto 3000 (interno, sin exposición al host)
  iamet_db_staging     → PostgreSQL 16
  iamet_redis_staging  → Redis 7
```

El contenedor `global_nginx` enruta `staging.iamet.mx` → `iamet_app_staging:3000` dentro de `infra_network`.
Ningún puerto se expone directamente al host. No se usa PM2. No se usa MySQL.

---

## Variables de Entorno

Copiar `.env.staging.example` como `.env.staging` y completar los valores:

```bash
cp .env.staging.example .env.staging
nano .env.staging
```

| Variable | Obligatoria | Descripción |
|---|---|---|
| `POSTGRES_DB` | Sí | Nombre de la base de datos (ej. `iamet_staging`) |
| `POSTGRES_USER` | Sí | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Sí | Contraseña de PostgreSQL |
| `REDIS_PASSWORD` | Sí | Contraseña de Redis |
| `JWT_SECRET` | Sí | Secreto para firmar cookies de sesión (64+ chars) |
| `VITE_APP_URL` | Sí | URL pública del sitio — usada en links de correos de verificación |
| `RESEND_API_KEY` | Sí | API key de Resend para envío de correos |
| `VITE_APP_ID` | Sí | ID de la aplicación Manus OAuth (login de administradores) |
| `OAUTH_SERVER_URL` | Sí | URL del servidor OAuth de Manus |
| `VITE_OAUTH_PORTAL_URL` | Sí | URL del portal de login de Manus |
| `OWNER_OPEN_ID` | Sí | OpenID del propietario en Manus (notificaciones al admin) |
| `OWNER_NAME` | Sí | Nombre del propietario |
| `BUILT_IN_FORGE_API_URL` | Sí | URL de la API de IA de Manus (agente virtual) |
| `BUILT_IN_FORGE_API_KEY` | Sí | API key de la IA de Manus (server-side) |
| `VITE_FRONTEND_FORGE_API_KEY` | Sí | API key de la IA de Manus (frontend) |
| `VITE_FRONTEND_FORGE_API_URL` | Sí | URL de la API de IA de Manus (frontend) |

> Las variables `VITE_APP_ID`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_KEY` y relacionadas son necesarias porque el proyecto usa el sistema OAuth de Manus para el panel de administración y el agente de IA integrado. Obtenerlas desde **Manus → Settings → Secrets**.

Generar `JWT_SECRET` seguro:
```bash
openssl rand -hex 32
```

---

## Primer Despliegue

### 1. Preparar directorio en el VPS

```bash
sudo mkdir -p /opt/apps/iamet/staging
sudo chown $USER:$USER /opt/apps/iamet/staging
cd /opt/apps/iamet/staging
git clone https://github.com/ariveratij40-lab/iamet-platform.git .
```

### 2. Verificar red Docker externa

```bash
docker network ls | grep infra_network
# Si no existe:
docker network create infra_network
```

### 3. Configurar variables de entorno

```bash
cp .env.staging.example .env.staging
nano .env.staging   # Completar todos los valores reales
```

### 4. Fase A — Nginx HTTP solamente (sin SSL aún)

Instalar la configuración HTTP temporal para que Certbot pueda validar el dominio.
El bloque SSL **no** está presente en esta fase para evitar que `global_nginx` falle
por la ausencia de `fullchain.pem` y `privkey.pem`.

```bash
# Copiar la config Fase A al Nginx global
sudo cp infra/nginx/30-iamet-staging.phase-a.conf \
       /opt/infra/nginx/sites-enabled/30-iamet-staging.conf

# Verificar y recargar el contenedor Nginx global
docker exec global_nginx nginx -t
docker exec global_nginx nginx -s reload
```

### 5. Obtener certificado SSL con Certbot webroot

El Nginx global ya está sirviendo `staging.iamet.mx` en HTTP (paso 4), por lo que
Certbot puede completar el ACME challenge sin necesidad de `--standalone` ni `-p 80:80`.

```bash
docker run --rm \
  -v /opt/infra/certbot/conf:/etc/letsencrypt \
  -v /opt/infra/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@iamet.mx \
  --agree-tos \
  --no-eff-email \
  -d staging.iamet.mx
```

### 6. Fase B — Nginx HTTP + HTTPS (con SSL)

Reemplazar la config temporal por la versión final que incluye el bloque `443 ssl`.
En este punto `fullchain.pem` y `privkey.pem` ya existen.

```bash
# Reemplazar con la config final Fase B
sudo cp infra/nginx/30-iamet-staging.conf \
       /opt/infra/nginx/sites-enabled/30-iamet-staging.conf

# Verificar y recargar
docker exec global_nginx nginx -t
docker exec global_nginx nginx -s reload
```

### 7. Construir y levantar los servicios

```bash
docker compose \
  -f docker-compose.staging.yml \
  -f docker-compose.override.yml \
  --env-file .env.staging \
  up -d --build
```

> **Importante:** Siempre incluir `-f docker-compose.override.yml` — contiene variables críticas como `LLM_*` y `R2_*`.

### 8. Ejecutar migraciones de base de datos

```bash
chmod +x infra/scripts/migrate.sh
./infra/scripts/migrate.sh
```

### 9. Verificar el despliegue

```bash
# Estado de los contenedores
docker compose \
  -f docker-compose.staging.yml \
  -f docker-compose.override.yml \
  --env-file .env.staging ps

# Logs de la aplicación
docker logs iamet_app_staging -f --tail 50

# Verificar que responde
curl -I https://staging.iamet.mx
```

---

## Despliegues Posteriores (actualizaciones)

```bash
cd /opt/apps/iamet/staging
./infra/scripts/deploy.sh
```

El script `deploy.sh`:
1. Hace `git pull origin main`
2. Reconstruye la imagen Docker sin caché
3. Levanta DB y Redis si no están corriendo
4. Reinicia la aplicación con la nueva imagen

---

## Rollback

```bash
# Ver commits disponibles
git log --oneline -10

# Revertir a un commit específico
./infra/scripts/rollback.sh <commit_hash>
```

---

## Comandos de Operación

```bash
# Ver logs en tiempo real
docker logs iamet_app_staging -f

# Reiniciar solo la aplicación (sin reconstruir)
docker compose \
  -f docker-compose.staging.yml \
  -f docker-compose.override.yml \
  --env-file .env.staging \
  restart iamet_app_staging

# Detener todos los servicios
docker compose \
  -f docker-compose.staging.yml \
  -f docker-compose.override.yml \
  --env-file .env.staging down

# ⚠ DESTRUCTIVO — detener y eliminar volúmenes (borra la DB)
docker compose \
  -f docker-compose.staging.yml \
  -f docker-compose.override.yml \
  --env-file .env.staging down -v

# Acceder a la consola de PostgreSQL
docker exec -it iamet_db_staging psql -U iamet -d iamet_staging

# Acceder a la consola de Redis
docker exec -it iamet_redis_staging redis-cli -a <REDIS_PASSWORD>

# Verificar y recargar Nginx global
docker exec global_nginx nginx -t
docker exec global_nginx nginx -s reload
```

---

## Renovación de SSL (automática con Certbot webroot)

El Nginx global (`global_nginx`) ya está corriendo, por lo que la renovación usa
`--webroot` sin detener ningún servicio. Agregar al crontab del VPS:

```bash
# crontab -e
0 3 * * * docker run --rm \
  -v /opt/infra/certbot/conf:/etc/letsencrypt \
  -v /opt/infra/certbot/www:/var/www/certbot \
  certbot/certbot renew \
  --webroot \
  --webroot-path=/var/www/certbot \
  --quiet \
  && docker exec global_nginx nginx -s reload
```

---

## Estructura de Archivos de Infraestructura

```
iamet-platform/
├── Dockerfile                                  ← Build multi-stage (builder + production)
├── docker-compose.staging.yml                  ← Compose: PostgreSQL 16 + Redis 7 + app
├── .env.staging.example                        ← Plantilla de variables de entorno
├── .dockerignore                               ← Exclusiones del contexto Docker
└── infra/
    ├── nginx/
    │   ├── 30-iamet-staging.phase-a.conf       ← Fase A: HTTP + ACME (sin SSL)
    │   └── 30-iamet-staging.conf               ← Fase B: HTTP + HTTPS (con SSL)
    │                                              Ambos se copian a:
    │                                              /opt/infra/nginx/sites-enabled/30-iamet-staging.conf
    └── scripts/
        ├── deploy.sh                           ← Despliegue completo (pull + build + restart)
        ├── migrate.sh                          ← Solo migraciones DB
        └── rollback.sh                         ← Rollback a commit anterior
```

---

## Resumen de la Migración MySQL → PostgreSQL 16

| Componente | Antes | Después |
|---|---|---|
| Driver | `mysql2` | `postgres` (postgres-js) |
| Drizzle import | `drizzle-orm/mysql2` | `drizzle-orm/postgres-js` |
| Schema | `mysqlTable`, `varchar`, `tinyint` | `pgTable`, `text`, `boolean` |
| `drizzle.config.ts` | `dialect: "mysql"` | `dialect: "postgresql"` |
| Upsert | `onDuplicateKeyUpdate` | `onConflictDoUpdate` |
| Insert ID | `result[0].insertId` | `.returning({ id })` |
| `DATABASE_URL` | `mysql://...` | `postgresql://...` |
