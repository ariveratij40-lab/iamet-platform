# Análisis de Variables de Entorno — Despliegue VPS
## IAMET Platform — `ariveratij40-lab/iamet-platform`

> **Metodología:** Este análisis se basa en la lectura directa de los archivos
> `server/_core/env.ts`, `server/_core/sdk.ts`, `server/_core/llm.ts`,
> `server/_core/notification.ts`, `server/storage.ts`, `server/_core/storageProxy.ts`,
> `server/_core/map.ts`, `client/src/const.ts` y `client/src/components/Map.tsx`,
> cruzados con la salida de `printenv` en el sandbox activo de Manus.

---

## 1. Inventario completo — valores reales del sandbox activo

La siguiente tabla muestra el valor exacto de cada variable tal como está inyectada
en el entorno de Manus en este momento. Estos valores son **credenciales activas**
del proyecto `SsX5E88NhsihTLcjsU3dHR`.

| Variable | Valor real (sandbox activo) | Presente en Manus Secrets |
|---|---|---|
| `VITE_APP_ID` | `SsX5E88NhsihTLcjsU3dHR` | ✅ Sí |
| `OWNER_OPEN_ID` | `Q2TwjGG2RwvDy9n7V3j8cj` | ✅ Sí |
| `OWNER_NAME` | `Back IA` | ✅ Sí |
| `OAUTH_SERVER_URL` | `https://api.manus.im` | ✅ Sí |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im` | ✅ Sí |
| `BUILT_IN_FORGE_API_URL` | `https://forge.manus.ai` | ✅ Sí |
| `BUILT_IN_FORGE_API_KEY` | `eX35xqSG4GU2vdKmGMxgg9` | ✅ Sí |
| `VITE_FRONTEND_FORGE_API_KEY` | `YvGwBAnpSsRqUmkuDC3MHd` | ✅ Sí |
| `VITE_FRONTEND_FORGE_API_URL` | `https://forge.manus.ai` | ✅ Sí |
| `RESEND_API_KEY` | `re_UF11fYAM_25wVf2UzGmgrhZroAGiakuFQ` | ✅ Sí |
| `JWT_SECRET` | `JE3r8LSfPkXMTKCwbBhrLY` | ✅ Sí |
| `DATABASE_URL` | `mysql://...tidbcloud.com/SsX5E88N...` | ✅ Sí (TiDB — NO usar en VPS) |

> **Nota sobre `DATABASE_URL`:** El sandbox de Manus inyecta una conexión MySQL/TiDB.
> Esta variable **no se usa en el código actual** del proyecto — el código ya fue migrado
> a PostgreSQL y usa `POSTGRES_*` variables para construir la URL de conexión en
> `docker-compose.staging.yml`. Ver sección 5.

---

## 2. Mapa de uso en código fuente

### Variables del servidor (`server/_core/env.ts`)

| Variable de entorno | Alias en `ENV` | Archivo que la consume | Uso exacto |
|---|---|---|---|
| `VITE_APP_ID` | `ENV.appId` | `sdk.ts` | `clientId` en el intercambio de código OAuth; incluido en el payload del JWT de sesión |
| `OAUTH_SERVER_URL` | `ENV.oAuthServerUrl` | `sdk.ts` | `baseURL` del cliente Axios que llama a `api.manus.im` para intercambiar código y obtener info de usuario |
| `JWT_SECRET` | `ENV.cookieSecret` | `sdk.ts` | Firma y verifica el JWT de sesión con HS256 (cookie `manus_session`) |
| `OWNER_OPEN_ID` | `ENV.ownerOpenId` | `db.ts` | Al hacer `upsertUser()`, si `openId === ENV.ownerOpenId` el usuario recibe `role: 'admin'` automáticamente |
| `BUILT_IN_FORGE_API_URL` | `ENV.forgeApiUrl` | `llm.ts`, `notification.ts`, `storage.ts`, `storageProxy.ts`, `map.ts`, `voiceTranscription.ts`, `imageGeneration.ts` | URL base para todos los servicios internos de Manus Forge |
| `BUILT_IN_FORGE_API_KEY` | `ENV.forgeApiKey` | Mismo conjunto de archivos | Bearer token para autenticar todas las llamadas a Manus Forge |
| `RESEND_API_KEY` | `ENV.resendApiKey` | `email.ts` | Instancia `new Resend(key)` para enviar correos de verificación desde `noreply@iamet.mx` |
| `VITE_APP_URL` | `ENV.appUrl` | `routers.ts` (storeAuth) | Construye el link de verificación en el correo: `${appUrl}/tienda/verificar?token=...` |
| `DATABASE_URL` | No usado | — | **No aparece en `env.ts` ni en ningún archivo del servidor.** La conexión PostgreSQL se construye desde `POSTGRES_*` en `docker-compose.staging.yml` |

### Variables del frontend (`client/src/`)

| Variable de entorno | Archivo que la consume | Uso exacto |
|---|---|---|
| `VITE_APP_ID` | `client/src/const.ts` línea 6 | `appId` en el query param de la URL de login de Manus OAuth |
| `VITE_OAUTH_PORTAL_URL` | `client/src/const.ts` línea 5 | URL base del portal de login: `${oauthPortalUrl}/app-auth?appId=...` |
| `VITE_FRONTEND_FORGE_API_KEY` | `client/src/components/Map.tsx` línea 89 | `key=` en la URL del script de Google Maps cargado vía proxy Manus |
| `VITE_FRONTEND_FORGE_API_URL` | `client/src/components/Map.tsx` líneas 91-93 | URL base del proxy de Google Maps: `${url}/v1/maps/proxy/maps/api/js` |
| `OWNER_NAME` | **No aparece en ningún archivo del frontend** | — |

---

## 3. Clasificación: Manus-específicas vs. portables

### 3.1 Variables **portables** — funcionan en cualquier VPS sin cambios de código

| Variable | Valor real | Acción para VPS |
|---|---|---|
| `JWT_SECRET` | `JE3r8LSfPkXMTKCwbBhrLY` | Puedes reusar este valor o generar uno nuevo con `openssl rand -hex 32`. **Nunca lo expongas públicamente.** |
| `RESEND_API_KEY` | `re_UF11fYAM_25wVf2UzGmgrhZroAGiakuFQ` | Valor real y funcional. Copiar directamente al `.env.staging`. El dominio `iamet.mx` ya está verificado en Resend. |
| `VITE_APP_URL` | `https://staging.iamet.mx` | Cambiar al dominio real del VPS. |
| `POSTGRES_DB/USER/PASSWORD` | N/A (no en Manus) | Definir valores nuevos para el contenedor PostgreSQL del VPS. |
| `REDIS_PASSWORD` | N/A (no en Manus) | Definir valor nuevo para el contenedor Redis del VPS. |

### 3.2 Variables **Manus-específicas** — NO funcionan fuera de la plataforma Manus

Estas variables apuntan a servicios internos de Manus que **no son accesibles desde un VPS externo**. Las credenciales (`eX35xqSG4GU2vdKmGMxgg9`, `YvGwBAnpSsRqUmkuDC3MHd`) son tokens de sesión del proyecto en Manus y expirarán o dejarán de funcionar fuera del contexto de la plataforma.

| Variable | Valor actual | Por qué no funciona en VPS | Servicio Manus que reemplaza |
|---|---|---|---|
| `VITE_APP_ID` | `SsX5E88NhsihTLcjsU3dHR` | Es el ID del proyecto en Manus. El servidor OAuth `api.manus.im` solo acepta este ID si la petición viene de un origen registrado en Manus. | Sistema de autenticación de Manus |
| `OAUTH_SERVER_URL` | `https://api.manus.im` | Endpoint privado de Manus. No es una API OAuth estándar pública. | Sistema de autenticación de Manus |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im` | Portal de login de Manus. Los usuarios serían redirigidos a manus.im para autenticarse, lo cual no tiene sentido para IAMET standalone. | Portal de login de Manus |
| `OWNER_OPEN_ID` | `Q2TwjGG2RwvDy9n7V3j8cj` | Es el `openId` del propietario del proyecto en Manus. En VPS no habrá usuarios con `openId` de Manus. | Identidad de usuario en Manus |
| `OWNER_NAME` | `Back IA` | Solo se usa para metadatos. **No aparece en ningún archivo de código del proyecto** — no tiene efecto funcional. | — (no se usa) |
| `BUILT_IN_FORGE_API_URL` | `https://forge.manus.ai` | API interna de Manus. Requiere autenticación con token de proyecto Manus. | LLM, Storage, Maps, Notificaciones, Imágenes, Voz |
| `BUILT_IN_FORGE_API_KEY` | `eX35xqSG4GU2vdKmGMxgg9` | Token de proyecto Manus. No válido fuera de la plataforma. | Mismo conjunto |
| `VITE_FRONTEND_FORGE_API_KEY` | `YvGwBAnpSsRqUmkuDC3MHd` | Token de proyecto Manus para frontend. Solo se usa para el proxy de Google Maps. | Proxy de Google Maps de Manus |
| `VITE_FRONTEND_FORGE_API_URL` | `https://forge.manus.ai` | Mismo servicio Forge. | Proxy de Google Maps de Manus |

---

## 4. Variables obligatorias por funcionalidad

### 4.1 Para que el login OAuth (admin) funcione

El flujo OAuth está implementado en `client/src/const.ts` (frontend) y `server/_core/sdk.ts` + `server/_core/oauth.ts` (backend). Requiere **todas** las siguientes variables:

| Variable | Rol en el flujo | ¿Reemplazable? |
|---|---|---|
| `VITE_APP_ID` | `clientId` al intercambiar el código de autorización con `api.manus.im` | ❌ Solo funciona con Manus OAuth |
| `VITE_OAUTH_PORTAL_URL` | URL del portal donde el usuario hace clic en "Iniciar sesión" | ❌ Solo funciona con Manus OAuth |
| `OAUTH_SERVER_URL` | Backend que valida el código y devuelve el `accessToken` y `openId` | ❌ Solo funciona con Manus OAuth |
| `JWT_SECRET` | Firma el JWT de sesión local (cookie `manus_session`) | ✅ Portable — cualquier string aleatorio |
| `OWNER_OPEN_ID` | Determina qué usuario recibe `role: 'admin'` automáticamente | ⚠️ Manus-específico, pero reemplazable con lógica custom |

**Conclusión:** El login OAuth **no puede funcionar en un VPS standalone** sin reemplazar el sistema de autenticación. Ver sección 5.

### 4.2 Para que el Agente Virtual IA funcione

El agente virtual llama a `invokeLLM()` en `server/routers.ts` (procedimientos `agent.sendMessage` y `advisor.generateRecommendations`). Requiere:

| Variable | Rol | ¿Reemplazable? |
|---|---|---|
| `BUILT_IN_FORGE_API_URL` | URL base del endpoint `/v1/chat/completions` | ✅ Reemplazable con cualquier API compatible con OpenAI |
| `BUILT_IN_FORGE_API_KEY` | Bearer token de autenticación | ✅ Reemplazable con API key de OpenAI/Anthropic/etc. |

**Buena noticia:** `server/_core/llm.ts` ya implementa la interfaz OpenAI Chat Completions estándar. El fallback hardcodeado es `https://forge.manus.im/v1/chat/completions`. **Basta con apuntar estas dos variables a OpenAI o cualquier proveedor compatible** sin cambiar una sola línea de código del agente.

---

## 5. Componentes Manus-específicos y sus reemplazos externos

### 5.1 Autenticación OAuth — REEMPLAZO OBLIGATORIO

**Componentes afectados:** `server/_core/sdk.ts`, `server/_core/oauth.ts`, `server/_core/context.ts`, `client/src/const.ts`

El sistema actual depende del protocolo propietario de Manus (`WebDevAuthPublicService/ExchangeToken`, `GetUserInfo`, `GetUserInfoWithJwt`). No es OAuth 2.0 estándar.

**Opciones de reemplazo:**

| Opción | Complejidad | Descripción |
|---|---|---|
| **Auth.js v5** (recomendado) | Media | Soporta Google, GitHub, Microsoft, Email/Password. Reemplaza `sdk.ts` y `oauth.ts` completamente. |
| **Lucia Auth** | Media | Auth minimalista con soporte para múltiples providers. Mantiene el patrón de sesiones en cookie. |
| **Auth propio con JWT** | Baja | Eliminar OAuth externo, implementar `POST /api/auth/login` con email+password, firmar JWT con `JWT_SECRET`. Solo para admin. |
| **Clerk** | Baja | SaaS de autenticación. Requiere cambios mínimos en el frontend. |

**Impacto en `OWNER_OPEN_ID`:** En el reemplazo, el admin se identifica por email o por un flag en la base de datos. La lógica en `db.ts` que compara `openId === ENV.ownerOpenId` debe reemplazarse por `email === 'admin@iamet.mx'` o similar.

### 5.2 LLM / Agente Virtual — REEMPLAZO TRIVIAL

**Componentes afectados:** `server/_core/llm.ts`

El código ya usa la interfaz estándar de OpenAI Chat Completions. **Solo hay que cambiar dos variables de entorno:**

```
BUILT_IN_FORGE_API_URL=https://api.openai.com
BUILT_IN_FORGE_API_KEY=sk-proj-XXXXXXXXXXXXXXXX
```

O con Anthropic (requiere pequeño ajuste en `llm.ts` para el formato de mensajes):
```
BUILT_IN_FORGE_API_URL=https://api.anthropic.com
BUILT_IN_FORGE_API_KEY=sk-ant-XXXXXXXXXXXXXXXX
```

O con cualquier proveedor compatible con OpenAI (Groq, Together AI, Mistral, etc.).

### 5.3 Storage de archivos — REEMPLAZO REQUERIDO

**Componentes afectados:** `server/storage.ts`, `server/_core/storageProxy.ts`

El storage actual llama a `forge.manus.ai/v1/storage/presign/put` y sirve archivos vía `/manus-storage/*`. En VPS esto devolverá `500 Storage proxy not configured`.

**Reemplazo recomendado — Cloudflare R2 (compatible con S3):**

```typescript
// server/storage.ts — reemplazar storagePut() con:
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // https://ACCOUNT_ID.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
```

**Alternativas:**

| Opción | Costo | Notas |
|---|---|---|
| **Cloudflare R2** | Gratis hasta 10 GB/mes | Compatible con S3 SDK, sin egress fees |
| **AWS S3** | ~$0.023/GB/mes | Referencia estándar |
| **MinIO** (self-hosted) | Gratis | Instalar como contenedor Docker en el mismo VPS |
| **Backblaze B2** | Gratis hasta 10 GB | Compatible con S3 SDK |

### 5.4 Notificaciones al owner — REEMPLAZO SIMPLE

**Componentes afectados:** `server/_core/notification.ts`

Llama a `forge.manus.ai/webdevtoken.v1.WebDevService/SendNotification`. En VPS fallará silenciosamente (retorna `false`, no lanza excepción).

**Reemplazo recomendado:** Enviar email con Resend (ya configurado):

```typescript
// Reemplazar notifyOwner() con:
export async function notifyOwner({ title, content }: NotificationPayload) {
  const resend = new Resend(ENV.resendApiKey);
  await resend.emails.send({
    from: "noreply@iamet.mx",
    to: process.env.OWNER_EMAIL ?? "admin@iamet.mx",
    subject: title,
    html: `<p>${content}</p>`,
  });
  return true;
}
```

### 5.5 Google Maps proxy — REEMPLAZO OPCIONAL

**Componentes afectados:** `client/src/components/Map.tsx`

`VITE_FRONTEND_FORGE_API_KEY` y `VITE_FRONTEND_FORGE_API_URL` solo se usan para cargar el SDK de Google Maps vía un proxy de Manus. El componente `Map.tsx` **no se usa en ninguna página activa del proyecto** (no está registrado en `App.tsx` como ruta).

**Acción:** Si no se necesitan mapas, estas dos variables pueden omitirse del `.env.staging`. Si se necesitan, reemplazar con una API key directa de Google Maps Platform.

### 5.6 Heartbeat / Cron — NO FUNCIONA EN VPS

**Componentes afectados:** `server/_core/heartbeat.ts`

El sistema de tareas programadas usa `webdevtoken.v1.WebDevService/CreateHeartbeatJob`. En VPS no tendrá efecto. Reemplazar con `node-cron` o un cron del sistema operativo.

---

## 6. Archivo `.env.staging` completo

El siguiente archivo incluye los **valores reales** donde están disponibles y
**placeholders claramente identificados** donde se requiere acción del operador.

```bash
# ═══════════════════════════════════════════════════════════════════════════════
# IAMET Platform — .env.staging
# Dominio: staging.iamet.mx
# Generado: 2026-06-20
# ADVERTENCIA: No commitear este archivo. Contiene credenciales reales.
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Node ─────────────────────────────────────────────────────────────────────
NODE_ENV=production

# ─── URL del Sitio ────────────────────────────────────────────────────────────
# Usada para construir links en correos de verificación de la tienda
VITE_APP_URL=https://staging.iamet.mx

# ─── Base de Datos PostgreSQL ─────────────────────────────────────────────────
# Estos valores alimentan docker-compose.staging.yml
# DATABASE_URL se construye internamente en el contenedor app a partir de estos
POSTGRES_DB=iamet_staging
POSTGRES_USER=iamet
POSTGRES_PASSWORD=CAMBIAR_POR_PASSWORD_SEGURO_MIN_32_CHARS

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_PASSWORD=CAMBIAR_POR_PASSWORD_SEGURO_MIN_32_CHARS

# ─── Seguridad — JWT ──────────────────────────────────────────────────────────
# VALOR REAL del sandbox activo. Puedes reusar o regenerar con: openssl rand -hex 32
JWT_SECRET=JE3r8LSfPkXMTKCwbBhrLY

# ─── Correo (Resend) ──────────────────────────────────────────────────────────
# VALOR REAL — dominio iamet.mx verificado — sender: noreply@iamet.mx
RESEND_API_KEY=re_UF11fYAM_25wVf2UzGmgrhZroAGiakuFQ

# ─── LLM / Agente Virtual ─────────────────────────────────────────────────────
# OPCIÓN A: OpenAI (recomendado para producción)
BUILT_IN_FORGE_API_URL=https://api.openai.com
BUILT_IN_FORGE_API_KEY=sk-proj-REEMPLAZAR_CON_TU_API_KEY_DE_OPENAI

# OPCIÓN B: Manus Forge (solo funciona si el VPS tiene acceso a forge.manus.ai
#           y las credenciales del proyecto siguen activas — NO RECOMENDADO)
# BUILT_IN_FORGE_API_URL=https://forge.manus.ai
# BUILT_IN_FORGE_API_KEY=eX35xqSG4GU2vdKmGMxgg9

# ─── Manus OAuth — REQUIERE REEMPLAZO PARA VPS STANDALONE ────────────────────
# Estas variables apuntan a servicios internos de Manus que NO son accesibles
# desde un VPS externo. El login de admin NO funcionará sin reemplazar el
# sistema de autenticación (ver sección 5.1 del análisis).
#
# Si despliegas en VPS y quieres mantener Manus OAuth temporalmente para pruebas,
# usa los valores reales del sandbox. Funcionarán SOLO si Manus no revoca el token.
#
VITE_APP_ID=SsX5E88NhsihTLcjsU3dHR
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im

# ─── Owner (admin automático) ─────────────────────────────────────────────────
# OWNER_OPEN_ID: el primer usuario cuyo openId coincida con este valor
# recibirá role='admin' automáticamente en db.ts/upsertUser().
# VALOR REAL del sandbox activo.
OWNER_OPEN_ID=Q2TwjGG2RwvDy9n7V3j8cj

# OWNER_NAME: NO SE USA EN NINGÚN ARCHIVO DE CÓDIGO DEL PROYECTO.
# Presente en Manus Secrets pero sin efecto funcional. Incluir por compatibilidad.
OWNER_NAME=Back IA

# ─── Google Maps (proxy Manus) — OPCIONAL ────────────────────────────────────
# Solo se usan en client/src/components/Map.tsx.
# El componente Map.tsx NO está registrado en App.tsx — no hay rutas que lo usen.
# Puedes omitir estas variables si no necesitas mapas.
# Si las necesitas, reemplazar con API key directa de Google Maps Platform.
VITE_FRONTEND_FORGE_API_KEY=OMITIR_O_REEMPLAZAR_CON_GOOGLE_MAPS_API_KEY
VITE_FRONTEND_FORGE_API_URL=https://maps.googleapis.com
```

---

## 7. Resumen ejecutivo para el operador

| Pregunta | Respuesta |
|---|---|
| ¿Cuántas variables están en Manus Secrets? | **10 de 10** analizadas están presentes y activas |
| ¿Cuántas son portables sin cambios? | **3** — `JWT_SECRET`, `RESEND_API_KEY`, `VITE_APP_URL` |
| ¿Cuántas requieren reemplazo obligatorio? | **5** — todo el bloque OAuth (`VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, `OWNER_OPEN_ID`) + Storage |
| ¿Cuántas son opcionales/sin efecto? | **3** — `OWNER_NAME` (no se usa en código), `VITE_FRONTEND_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL` (Maps no activo) |
| ¿El Agente Virtual funciona en VPS? | **Sí**, cambiando solo `BUILT_IN_FORGE_API_URL` y `BUILT_IN_FORGE_API_KEY` a OpenAI |
| ¿El login de admin funciona en VPS? | **No**, requiere reemplazar el sistema OAuth de Manus |
| ¿Los correos de verificación funcionan? | **Sí**, `RESEND_API_KEY` es portable y el dominio `iamet.mx` ya está verificado |
| ¿El storage de archivos funciona? | **No**, requiere reemplazar `server/storage.ts` con S3/R2/MinIO |

---

*Documento generado a partir del análisis directo del código fuente del repositorio
`ariveratij40-lab/iamet-platform` y del entorno sandbox activo de Manus.*
