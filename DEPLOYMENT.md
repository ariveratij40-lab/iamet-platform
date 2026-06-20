# IAMET Platform — Guía de Despliegue (Staging)

Entorno: `staging.iamet.mx` | Stack: Docker Compose + PostgreSQL 16 + Redis 7 + Nginx global

---

## Arquitectura del Despliegue

```
/opt/infra/nginx/conf.d/staging.iamet.mx.conf   ← Nginx global (reverse proxy)
/opt/infra/certbot/                              ← SSL Certbot compartido
/opt/apps/iamet/staging/                         ← Código fuente + docker-compose

Red Docker: infra_network (externa, ya existente)

Contenedores:
  iamet_app_staging    → Node.js 20, puerto 3000 (interno, sin exposición al host)
  iamet_db_staging     → PostgreSQL 16
  iamet_redis_staging  → Redis 7
```

El Nginx global enruta `staging.iamet.mx` → `iamet_app_staging:3000` dentro de `infra_network`. Ningún puerto se expone al host directamente.

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

### 4. Obtener certificado SSL con Certbot

```bash
# Asegurarse de que el DNS de staging.iamet.mx apunta al VPS antes de ejecutar esto
docker run --rm \
  -v /opt/infra/certbot/conf:/etc/letsencrypt \
  -v /opt/infra/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --email admin@iamet.mx \
  --agree-tos \
  --no-eff-email \
  -d staging.iamet.mx
```

### 5. Instalar configuración de Nginx

```bash
sudo cp infra/nginx/staging.iamet.mx.conf /opt/infra/nginx/conf.d/
sudo nginx -t && sudo nginx -s reload
```

### 6. Construir y levantar los servicios

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
```

### 7. Ejecutar migraciones de base de datos

```bash
chmod +x infra/scripts/migrate.sh
./infra/scripts/migrate.sh
```

### 8. Verificar el despliegue

```bash
# Estado de los contenedores
docker compose -f docker-compose.staging.yml --env-file .env.staging ps

# Logs de la aplicación
docker logs iamet_app_staging -f --tail 50

# Verificar que responde
curl -I https://staging.iamet.mx
```

---

## Despliegues Posteriores (actualizaciones)

```bash
cd /opt/apps/iamet/staging
chmod +x infra/scripts/deploy.sh
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
chmod +x infra/scripts/rollback.sh
./infra/scripts/rollback.sh <commit_hash>
```

---

## Comandos de Operación

```bash
# Ver logs en tiempo real
docker logs iamet_app_staging -f

# Reiniciar solo la aplicación (sin reconstruir)
docker compose -f docker-compose.staging.yml --env-file .env.staging restart iamet_app_staging

# Detener todos los servicios
docker compose -f docker-compose.staging.yml --env-file .env.staging down

# ⚠ DESTRUCTIVO — detener y eliminar volúmenes (borra la DB)
docker compose -f docker-compose.staging.yml --env-file .env.staging down -v

# Acceder a la consola de PostgreSQL
docker exec -it iamet_db_staging psql -U iamet -d iamet_staging

# Acceder a la consola de Redis
docker exec -it iamet_redis_staging redis-cli -a <REDIS_PASSWORD>
```

---

## Renovación de SSL (automática)

Agregar al crontab del VPS:

```bash
# crontab -e
0 3 * * * docker run --rm \
  -v /opt/infra/certbot/conf:/etc/letsencrypt \
  -v /opt/infra/certbot/www:/var/www/certbot \
  certbot/certbot renew --quiet && \
  nginx -s reload
```

---

## Estructura de Archivos de Infraestructura

```
iamet-platform/
├── Dockerfile                          ← Build multi-stage (builder + production)
├── docker-compose.staging.yml          ← Compose para staging
├── .env.staging.example                ← Plantilla de variables de entorno
├── .dockerignore                       ← Exclusiones del contexto Docker
└── infra/
    ├── nginx/
    │   └── staging.iamet.mx.conf       ← Copiar a /opt/infra/nginx/conf.d/
    └── scripts/
        ├── deploy.sh                   ← Despliegue completo
        ├── migrate.sh                  ← Solo migraciones DB
        └── rollback.sh                 ← Rollback a commit anterior
```

---

## Notas sobre la Migración MySQL → PostgreSQL

El proyecto fue migrado de MySQL a PostgreSQL 16. Cambios realizados:

| Componente | Antes | Después |
|---|---|---|
| Driver | `mysql2` | `postgres` (postgres-js) |
| Drizzle import | `drizzle-orm/mysql2` | `drizzle-orm/postgres-js` |
| Schema | `mysqlTable`, `varchar`, `tinyint` | `pgTable`, `text`, `boolean` |
| `drizzle.config.ts` | `dialect: "mysql"` | `dialect: "postgresql"` |
| Upsert | `onDuplicateKeyUpdate` | `onConflictDoUpdate` |
| Insert ID | `result[0].insertId` | `.returning({ id: table.id })` |
| `DATABASE_URL` | `mysql://...` | `postgresql://...` |
