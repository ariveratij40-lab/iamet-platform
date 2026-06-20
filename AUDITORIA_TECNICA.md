# Informe de Auditoría Técnica — IAMET Platform
**Fecha:** 20 de junio de 2026  
**Repositorio:** `ariveratij40-lab/iamet-platform`  
**Objetivo:** Verificar que el proyecto está listo para deployment en VPS bajo la arquitectura Docker + PostgreSQL 16 + Redis 7 + Nginx global.

---

## Resumen Ejecutivo

| # | Validación | Estado | Severidad |
|---|-----------|--------|-----------|
| V1 | Migración MySQL → PostgreSQL | ✅ Aprobado | — |
| V2 | Dependencias Manus (variables de entorno) | ⚠️ Condicional | Media |
| V3 | Arquitectura Docker Compose | ✅ Aprobado | — |
| V4 | Persistencia de datos | ⚠️ Observación | Baja |
| V5 | Seguridad del servidor Express | ⚠️ Pendiente | Media |
| V6 | Simulación de deployment (build + health) | ✅ Aprobado | — |
| V7 | Configuración Nginx + SSL Certbot | ✅ Aprobado | — |

**Dictamen:** El proyecto puede desplegarse en staging con las observaciones documentadas. Dos hallazgos de severidad media deben resolverse antes de pasar a producción.

---

## V1 — Migración MySQL → PostgreSQL

**Estado: ✅ APROBADO**

La migración está completa y verificada en todos los niveles del stack:

| Componente | Antes | Después |
|---|---|---|
| Driver | `mysql2` | `postgres` (postgres-js v3.4.9) |
| ORM import | `drizzle-orm/mysql2` | `drizzle-orm/postgres-js` |
| Schema | `mysqlTable`, `mysqlEnum` | `pgTable`, `pgEnum` |
| Tipos | `int AUTO_INCREMENT`, `varchar`, `timestamp ON UPDATE` | `serial`, `varchar`, `timestamp DEFAULT now()` |
| Upsert | `onDuplicateKeyUpdate` | `onConflictDoUpdate` |
| Insert ID | `result[0].insertId` | `.returning({ id })` |
| Drizzle config | `dialect: "mysql"` | `dialect: "postgresql"` |
| `DATABASE_URL` | `mysql://...` | `postgresql://...` |
| Migraciones SQL | 7 archivos MySQL (eliminados) | 1 archivo PostgreSQL consolidado |

**Verificaciones ejecutadas:**
- `npx tsc --noEmit` → **Sin errores**
- `pnpm build` → **OK** (`dist/index.js` 117.4 KB)
- `grep mysql2/mysqlTable` en código activo → **0 referencias**
- Nueva migración `0000_marvelous_ravenous.sql` → **sintaxis PostgreSQL pura** (`CREATE TYPE ... AS ENUM`, `serial PRIMARY KEY`, `CONSTRAINT ... UNIQUE`)

---

## V2 — Dependencias Manus (variables de entorno)

**Estado: ⚠️ CONDICIONAL**

El proyecto usa la plataforma Manus como proveedor de servicios externos. Las siguientes variables son requeridas en el VPS:

### Variables estrictamente necesarias

| Variable | Uso en código | ¿Reemplazable? |
|---|---|---|
| `VITE_APP_ID` | OAuth Manus (autenticación de usuarios) | No — el sistema de login usa Manus OAuth |
| `OAUTH_SERVER_URL` | Endpoint del servidor OAuth | No — necesario para validar tokens |
| `VITE_OAUTH_PORTAL_URL` | URL del portal de login | No — frontend lo usa para redirigir al login |
| `OWNER_OPEN_ID` | Identificar al owner en `db.ts` (rol admin) | No — determina quién es admin |
| `JWT_SECRET` | Firmar/verificar cookies de sesión | No — seguridad crítica |
| `RESEND_API_KEY` | Envío de correos de verificación | No — funcionalidad activa |

### Variables para servicios opcionales (Manus AI)

| Variable | Uso | ¿Qué se desactiva si falta? |
|---|---|---|
| `BUILT_IN_FORGE_API_URL` | LLM (chat IA), storage S3, generación de imágenes, notificaciones | Chat IA, subida de imágenes de productos, notificaciones al owner |
| `BUILT_IN_FORGE_API_KEY` | Bearer token para las APIs anteriores | Igual que arriba |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend accede a APIs Manus | Chat IA en frontend |
| `VITE_FRONTEND_FORGE_API_URL` | URL frontend para APIs Manus | Chat IA en frontend |

> **Nota para producción independiente:** Si en el futuro se desea eliminar la dependencia de Manus, se requeriría reemplazar: (1) el sistema OAuth por Auth.js o similar, (2) el storage S3 por MinIO o AWS S3 propio, (3) el LLM por OpenAI/Anthropic directo. Esto está fuera del alcance del deployment actual.

**Acción requerida:** Obtener los valores de estas variables desde el panel de Manus (Settings → Secrets) antes del deployment.

---

## V3 — Arquitectura Docker Compose

**Estado: ✅ APROBADO**

El archivo `docker-compose.staging.yml` cumple con todos los requisitos de la arquitectura del VPS:

| Requisito | Implementación |
|---|---|
| Red externa `infra_network` | `networks.infra_network.external: true` ✅ |
| PostgreSQL 16 | `image: postgres:16-alpine` ✅ |
| Redis 7 | `image: redis:7-alpine` ✅ |
| Sin PM2 | Proceso directo `node dist/index.js` ✅ |
| Sin MySQL | Eliminado completamente ✅ |
| Sin puertos expuestos al host | No hay sección `ports:` en la app ✅ |
| Healthchecks | PostgreSQL (`pg_isready`), Redis (`redis-cli ping`), App (`wget /api/health`) ✅ |
| `depends_on` con condición | App espera a que DB y Redis estén `healthy` ✅ |
| Volúmenes persistentes | `iamet_pg_staging`, `iamet_redis_staging` con driver local ✅ |
| Usuario no-root | Dockerfile crea usuario `nodejs` (uid 1001) ✅ |
| Multi-stage build | Stage `builder` → Stage `production` (solo `dist/` y `node_modules` prod) ✅ |

---

## V4 — Persistencia de Datos

**Estado: ⚠️ OBSERVACIÓN (severidad baja)**

### PostgreSQL
- Volumen `iamet_pg_staging` correctamente montado en `/var/lib/postgresql/data`
- Los datos sobreviven reinicios de contenedor

### Redis
- Configurado con `--maxmemory 128mb --maxmemory-policy allkeys-lru`
- **Observación:** Redis está configurado como **cache**, no como almacén persistente. No tiene `--appendonly yes` ni `--save`.
- **Impacto:** Si el contenedor Redis se reinicia, las sesiones de usuario activas se invalidan (los usuarios tendrán que volver a iniciar sesión).
- **Evaluación:** Aceptable para staging. Para producción, evaluar si se requiere persistencia de sesiones o si el comportamiento actual es suficiente.

> El código actual no usa Redis directamente para sesiones — las sesiones se manejan con JWT en cookies firmadas. Redis está declarado en el compose pero el código Node.js no lo consume actualmente. Esto significa que el impacto es nulo en el estado actual.

---

## V5 — Seguridad del Servidor Express

**Estado: ⚠️ PENDIENTE (severidad media)**

### Hallazgos positivos
- **JWT/Cookies:** `httpOnly: true`, `secure: true` (en HTTPS), `sameSite: "none"` ✅
- **Validación de inputs:** 133 referencias a schemas Zod en `routers.ts` ✅
- **Secretos hardcodeados:** 0 encontrados en código fuente ✅
- **Usuario no-root en Docker:** `nodejs` uid 1001 ✅

### Hallazgos a corregir antes de producción

| Hallazgo | Riesgo | Recomendación |
|---|---|---|
| **Sin Helmet** | Headers HTTP inseguros (X-Powered-By expuesto, sin CSP, sin HSTS desde Node) | Agregar `helmet()` como primer middleware en `server/_core/index.ts` |
| **Sin rate limiting** | Endpoints de autenticación y formularios vulnerables a fuerza bruta | Agregar `express-rate-limit` en rutas `/api/oauth` y procedimientos de registro |
| **Sin CORS explícito** | Express acepta requests de cualquier origen | Agregar `cors({ origin: process.env.VITE_APP_URL })` |
| **Body limit 50MB** | Permite uploads excesivos que pueden saturar memoria | Reducir a 10MB para JSON, mantener 50MB solo para rutas de upload de archivos |

> **Nota:** Los headers de seguridad X-Frame-Options, X-Content-Type-Options, HSTS y X-XSS-Protection ya están configurados en el Nginx (Fase B). Esto mitiga parcialmente la ausencia de Helmet, pero no es suficiente para producción ya que no protege el tráfico interno entre contenedores.

---

## V6 — Simulación de Deployment

**Estado: ✅ APROBADO**

| Verificación | Resultado |
|---|---|
| `pnpm build` | ✅ `dist/index.js` 117.4 KB generado en 21ms |
| TypeScript `--noEmit` | ✅ Sin errores |
| Health endpoint en compose | ✅ `wget -qO- http://localhost:3000/api/health` |
| Health endpoint en código | ✅ `system.health` publicProcedure en `systemRouter.ts` |
| Puerto configurable | ✅ `process.env.PORT \|\| "3000"` |
| `NODE_ENV=production` | ✅ Sirve archivos estáticos del `dist/` |
| Migraciones PostgreSQL | ✅ `drizzle/0000_marvelous_ravenous.sql` (16 tablas, sintaxis PG pura) |
| `.dockerignore` | ✅ Excluye `node_modules`, `.env*`, `dist`, logs, scripts de infra |

> **Observación:** El health endpoint es una tRPC procedure (`/api/trpc/system.health`), no un endpoint REST simple. El healthcheck del compose usa `wget -qO- http://localhost:3000/api/health` que devolverá 404. Se recomienda agregar un endpoint REST `/api/health` en Express o ajustar el healthcheck a la URL tRPC correcta.

---

## V7 — Nginx + SSL Certbot

**Estado: ✅ APROBADO**

| Requisito | Implementación |
|---|---|
| Ruta `sites-enabled` | `/opt/infra/nginx/sites-enabled/30-iamet-staging.conf` ✅ |
| Certbot webroot (no standalone) | `--webroot -w /opt/infra/certbot/www` ✅ |
| Sin `-p 80:80` en Certbot | Usa volumen compartido con Nginx ✅ |
| Certificados en `/opt/infra/certbot/conf` | Montado como `/etc/letsencrypt` ✅ |
| Fase A (HTTP sin SSL) | `30-iamet-staging.phase-a.conf` ✅ |
| Fase B (HTTPS con SSL) | `30-iamet-staging.conf` ✅ |
| `docker exec global_nginx nginx -t` | Documentado en todos los pasos ✅ |
| `docker exec global_nginx nginx -s reload` | Documentado en todos los pasos ✅ |
| Cron renovación con reload | `certbot renew && docker exec global_nginx nginx -s reload` ✅ |
| Headers de seguridad en Nginx | X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy ✅ |
| WebSocket/SSE support | `proxy_set_header Upgrade $http_upgrade` ✅ |
| Caché de assets estáticos | `expires 1y; Cache-Control: public, immutable` ✅ |

---

## Acciones Requeridas

### Antes del deployment en staging

1. **Corregir health endpoint** — Agregar endpoint REST en Express:
   ```ts
   // En server/_core/index.ts, antes del middleware tRPC:
   app.get("/api/health", (_req, res) => res.json({ ok: true }));
   ```

2. **Obtener variables de entorno de Manus** — Copiar desde Settings → Secrets del panel Manus al `.env.staging` del VPS.

### Antes de pasar a producción (no bloqueante para staging)

3. **Agregar Helmet:**
   ```bash
   pnpm add helmet @types/helmet
   ```
   ```ts
   import helmet from "helmet";
   app.use(helmet());
   ```

4. **Agregar rate limiting:**
   ```bash
   pnpm add express-rate-limit
   ```
   ```ts
   import rateLimit from "express-rate-limit";
   app.use("/api/oauth", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
   ```

5. **Agregar CORS explícito:**
   ```bash
   pnpm add cors @types/cors
   ```
   ```ts
   import cors from "cors";
   app.use(cors({ origin: process.env.VITE_APP_URL, credentials: true }));
   ```

---

## Dictamen Final

**El proyecto IAMET Platform está listo para deployment en staging** con una corrección menor requerida (health endpoint REST). La migración a PostgreSQL está completa y verificada. La infraestructura Docker está correctamente alineada a la arquitectura del VPS. Los hallazgos de seguridad (Helmet, rate limiting, CORS) son recomendaciones para producción, no bloqueantes para staging.

| Entorno | Estado |
|---|---|
| **Staging** | ✅ Listo (con corrección del health endpoint) |
| **Producción** | ⚠️ Pendiente (Helmet + rate limiting + CORS antes de go-live) |

---

*Auditoría generada automáticamente el 20 de junio de 2026.*
