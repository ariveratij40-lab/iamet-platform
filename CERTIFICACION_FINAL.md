# CERTIFICACIÓN FINAL — IAMET Platform
## Plan de Remediación y Certificación para Staging

**Fecha:** 2026-06-20  
**Versión:** `c3efe009` → `[checkpoint actual]`  
**Repositorio:** `ariveratij40-lab/iamet-platform`  
**Entorno objetivo:** `staging.iamet.mx` en `/opt/apps/iamet/staging`

---

## A. Archivos Modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `server/_core/index.ts` | Helmet + CORS explícito + Rate Limiting + body parser 10MB |
| `package.json` | Agregadas dependencias: `helmet`, `cors`, `express-rate-limit` |
| `package.json` | Agregadas devDeps: `@types/cors`, `@types/express-rate-limit` |
| `pnpm-lock.yaml` | Actualizado automáticamente por pnpm |
| `drizzle/schema.ts` | Migrado de `mysqlTable` → `pgTable` (migración previa) |
| `server/db.ts` | Migrado de `mysql2` → `postgres-js` (migración previa) |
| `drizzle.config.ts` | `dialect: "mysql"` → `dialect: "postgresql"` (migración previa) |
| `drizzle/migrations/0000_marvelous_ravenous.sql` | Migración PostgreSQL regenerada (migración previa) |
| `Dockerfile` | Multi-stage, usuario no-root, `node:20-alpine` |
| `docker-compose.staging.yml` | PostgreSQL 16, Redis 7, `infra_network`, healthchecks, volúmenes |
| `.env.staging.example` | Plantilla completa de variables de entorno |
| `.dockerignore` | Excluye `node_modules`, `.env*`, `dist`, `*.log` |
| `infra/nginx/30-iamet-staging.phase-a.conf` | Nginx Fase A: HTTP + ACME challenge |
| `infra/nginx/30-iamet-staging.conf` | Nginx Fase B: HTTP + HTTPS con SSL |
| `infra/scripts/deploy.sh` | Script de despliegue completo |
| `infra/scripts/migrate.sh` | Script de migración de base de datos |
| `infra/scripts/rollback.sh` | Script de rollback a commit anterior |
| `DEPLOYMENT.md` | Guía completa alineada a arquitectura VPS |

---

## B. Diff Resumido por Cambio

### `server/_core/index.ts` — Seguridad

**Antes:**
```ts
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// Sin Helmet, sin CORS explícito, sin rate limiting
```

**Después:**
```ts
// Helmet — headers de seguridad HTTP (CSP deshabilitado para React/Vite)
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS explícito — acepta VITE_APP_URL + localhost en desarrollo
app.use(cors({ origin: allowedOrigins, credentials: true, ... }));

// Body parser reducido a 10MB (general)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rate limiters por tipo de ruta:
// - authLimiter: 20 req/15min en /api/oauth
// - formLimiter: 30 req/15min en leads, cotizaciones, storeAuth
// - apiLimiter: 200 req/min en /api/trpc (general)
```

### `drizzle/schema.ts` — PostgreSQL

```diff
- import { mysqlTable, mysqlEnum, int, varchar, text, boolean, timestamp, json, bigint } from "drizzle-orm/mysql-core";
+ import { pgTable, pgEnum, integer, varchar, text, boolean, timestamp, jsonb, bigint, serial } from "drizzle-orm/pg-core";
```

### `server/db.ts` — Driver PostgreSQL

```diff
- import { drizzle } from "drizzle-orm/mysql2";
- import mysql from "mysql2/promise";
+ import { drizzle } from "drizzle-orm/postgres-js";
+ import postgres from "postgres";
```

### `drizzle.config.ts`

```diff
- dialect: "mysql",
+ dialect: "postgresql",
```

---

## C. Riesgos Remanentes

| Riesgo | Severidad | Descripción | Mitigación recomendada |
|--------|-----------|-------------|----------------------|
| Sin CSP configurado | **Medio** | `contentSecurityPolicy: false` en Helmet — necesario para React/Vite pero reduce protección XSS | Configurar CSP personalizado con directivas específicas para producción |
| Variables Manus en producción | **Medio** | `VITE_APP_ID`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_KEY` son obligatorias para OAuth y agente IA | Obtener valores del panel Manus antes del primer despliegue |
| Rate limiting deshabilitado en dev | **Bajo** | Los limiters tienen `skip: () => NODE_ENV === "development"` | Comportamiento intencional — no afecta staging/producción |
| Chunk size warning en build | **Bajo** | Chunks > 500KB en el frontend (recharts, framer-motion) | Implementar code splitting con `import()` dinámico en iteración futura |
| Redis sin AOF | **Bajo** | Redis configurado con `maxmemory-policy allkeys-lru` — datos de sesión pueden perderse en restart | Agregar `--appendonly yes` al comando Redis si se requiere persistencia de sesiones |
| Sin DMARC en iamet.mx | **Bajo** | El registro `_dmarc` existe pero con `p=none` — no bloquea spoofing | Cambiar a `p=quarantine` o `p=reject` cuando el flujo de correo esté estabilizado |

---

## D. Variables Manus — Tabla de Clasificación

| Variable | Obligatoria | Uso en código | Impacto si falta |
|----------|-------------|---------------|-----------------|
| `VITE_APP_ID` | **Crítica** | OAuth Manus — `server/_core/oauth.ts` | Login de administradores no funciona |
| `OWNER_OPEN_ID` | **Crítica** | Identificar al owner en DB — `server/db.ts:upsertUser` | El admin no puede acceder al panel |
| `BUILT_IN_FORGE_API_KEY` | **Crítica** | Agente Virtual IA — `server/_core/llm.ts` | El chat IA no responde |
| `BUILT_IN_FORGE_API_URL` | **Crítica** | URL base de la API LLM | El chat IA no responde |
| `JWT_SECRET` | **Crítica** | Firma de cookies de sesión — `server/_core/cookies.ts` | Todas las sesiones fallan |
| `OAUTH_SERVER_URL` | **Crítica** | URL del servidor OAuth de Manus | Login de administradores no funciona |
| `RESEND_API_KEY` | **Crítica** | Envío de correos de verificación — `server/email.ts` | Registro en Tienda no funciona |
| `VITE_APP_URL` | **Crítica** | URL base para links en correos y CORS | Links de verificación apuntan a URL incorrecta |
| `VITE_OAUTH_PORTAL_URL` | **Importante** | URL del portal de login en el frontend | Botón de login no redirige correctamente |
| `OWNER_NAME` | **Importante** | Nombre del owner en notificaciones | Notificaciones muestran campo vacío |
| `VITE_FRONTEND_FORGE_API_KEY` | **Importante** | API key para llamadas LLM desde frontend | Funciones IA del frontend no funcionan |
| `VITE_FRONTEND_FORGE_API_URL` | **Importante** | URL de la API LLM para el frontend | Funciones IA del frontend no funcionan |
| `POSTGRES_PASSWORD` | **Crítica** | Contraseña de PostgreSQL en Docker | La base de datos no inicia |
| `REDIS_PASSWORD` | **Crítica** | Contraseña de Redis en Docker | Redis no inicia |
| `VITE_APP_ID` (frontend) | **Crítica** | ID de la app para el OAuth flow en el frontend | OAuth no puede iniciar |

> Los valores de las variables `VITE_APP_ID`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_KEY`, `BUILT_IN_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `OAUTH_SERVER_URL` y `VITE_OAUTH_PORTAL_URL` se obtienen del panel de Manus → Settings → Secrets.

---

## E. Evidencia de Certificación

### pnpm install
```
✅ Lockfile is up to date, resolution step is skipped
✅ Already up to date — Done in 1.1s
```

### TypeScript (npx tsc --noEmit)
```
✅ Sin errores — salida vacía (0 errores, 0 warnings)
```

### Build de producción (pnpm build)
```
✅ dist/index.js  119.5 KB
✅ dist/public/   (assets del frontend)
✅ Built in 22.19s
⚠️ Chunks > 500KB (warning de Vite — no es error, no bloquea deployment)
```

### Referencias MySQL activas
```
✅ grep mysql2|mysqlTable|onDuplicateKeyUpdate|insertId → sin resultados en server/ y drizzle/
```

### Verificación Docker
```
✅ Dockerfile: multi-stage (builder + production), usuario no-root (nodejs:1001)
✅ docker-compose.staging.yml: PostgreSQL 16, Redis 7, infra_network, healthchecks, volúmenes persistentes
✅ Healthcheck app: GET /api/health → { ok: true, ts: ... }
✅ Healthcheck DB: pg_isready -U iamet -d iamet_staging
✅ Healthcheck Redis: redis-cli ping
```

### Scripts de deployment
```
✅ deploy.sh: verificación de directorio, .env, git pull, docker compose build + up, migrate, health check
✅ migrate.sh: drizzle-kit migrate dentro del contenedor con DATABASE_URL correcto
✅ rollback.sh: git checkout <commit>, rebuild, restart
✅ Todos con chmod +x y set -euo pipefail
```

### Nginx
```
✅ 30-iamet-staging.phase-a.conf: HTTP + ACME challenge (sin SSL)
✅ 30-iamet-staging.conf: HTTP → HTTPS redirect + proxy a iamet_app_staging:3000
✅ Comandos: docker exec global_nginx nginx -t / nginx -s reload
✅ Cron de renovación: certbot renew --webroot + docker exec global_nginx nginx -s reload
```

---

## ✅ CERTIFICADO PARA STAGING

El proyecto **IAMET Platform** cumple con todos los requisitos técnicos para despliegue en el entorno de staging bajo la arquitectura oficial del VPS:

- **Ubuntu 24.04** — compatible
- **Docker Compose** — `docker-compose.staging.yml` listo
- **PostgreSQL 16** — driver, schema y migraciones en PostgreSQL puro
- **Redis 7** — configurado con contraseña y maxmemory
- **Nginx Global (`global_nginx`)** — configs Fase A/B con `docker exec`
- **Certbot Webroot** — flujo Fase A → Certbot → Fase B documentado
- **`infra_network`** — red externa configurada en todos los servicios
- **`/opt/apps/iamet/staging`** — ruta de despliegue en todos los scripts
- **Sin PM2** — proceso gestionado por Docker (`CMD ["node", "dist/index.js"]`)
- **Sin MySQL** — eliminado completamente del código activo

**Condición para el primer despliegue:** completar `.env.staging` con los valores de las variables Críticas obtenidas del panel de Manus antes de ejecutar `deploy.sh`.

---

*Certificación emitida el 2026-06-20 basada en inspección directa del código fuente, compilación real y verificación de todos los artefactos de infraestructura.*
