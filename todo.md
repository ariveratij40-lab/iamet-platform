# IAMET Platform - TODO

## Base de Datos y Backend
- [x] Schema BD: tablas leads, conversations, messages, verticals, courses, enrollments, advisor_sessions
- [x] Migración y seeds de verticales y cursos
- [x] Router tRPC: leads (crear, listar, filtrar, score)
- [x] Router tRPC: conversations (crear, listar, mensajes)
- [x] Router tRPC: agente virtual con LLM
- [x] Router tRPC: tech advisor (sesiones y recomendaciones)
- [x] Router tRPC: academy (cursos, inscripciones)
- [x] Router tRPC: analytics (métricas por vertical)
- [x] Lead scoring automático (formulario + conversaciones)
- [x] Notificación al owner en nuevo lead

## Sistema de Diseño
- [x] CSS tokens: fondo azul profundo, acento azul eléctrico/cian
- [x] Tipografía: Inter + Plus Jakarta Sans (Google Fonts)
- [x] Neumorfismo sutil en componentes
- [x] Animaciones snappy (framer-motion)
- [x] Tema oscuro enterprise como default

## Sitio Público
- [x] Navbar global: Soluciones, Industrias, Tech Advisor, Academy, Contacto
- [x] Home: hero asimétrico con headline impactante
- [x] Home: interfaz conversacional Agente Virtual IAMET con sugerencias rápidas
- [x] Home: sección de 7 verticales de negocio
- [x] Formulario de captura de leads (empresa, contacto, industria, tamaño, problema)

## 7 Landing Pages por Vertical
- [x] Landing: Infraestructura Tecnológica
- [x] Landing: Seguridad Electrónica
- [x] Landing: RFID y Automatización
- [x] Landing: Software e IA
- [x] Landing: Servicios Administrados
- [x] Landing: Educación Tecnológica
- [x] Landing: Compliance y Auditoría

## IAMET Tech Advisor
- [x] Flujo paso a paso: sector → tamaño → problemas
- [x] Generación de recomendaciones personalizadas con LLM
- [x] Captura de lead al finalizar el diagnóstico

## IAMET Academy
- [x] Catálogo de cursos por vertical
- [x] Detalle de curso: descripción, duración, nivel
- [x] Formulario de inscripción a curso

## Dashboard Admin
- [x] Ruta protegida /admin (solo rol admin)
- [x] Tabla de leads: filtros, estado, score
- [x] Historial de conversaciones con el Agente Virtual
- [x] Métricas: leads por vertical, distribución de score

## Rutas y Navegación
- [x] Registrar todas las rutas en App.tsx
- [x] Top nav público responsive
- [x] Ruta dinámica /soluciones/:slug para 7 verticales

## Pruebas
- [x] Test: auth.logout (test existente del template)
- [x] Test: auth.me autenticado y no autenticado
- [x] Test: leads.scorePreview (score entre 0-100)
- [x] Test: verticals.list (7 verticales con slugs correctos)
- [x] Test: academy.listCourses (arreglo con title/level)
- [x] Test: agent.startSession (retorna sessionId)

## Integración Panduit — Habilidad Especializada del Agente Virtual
- [x] Análisis de 15 PDFs Panduit (infraestructura física, cobre, fibra, healthcare, enterprise networks)
- [x] Base de conocimiento estructurada IAMET + Panduit (playbooks por vertical, preguntas de discovery, pólizas TIA)
- [x] System prompt enriquecido con habilidad especializada Panduit en el backend (routers.ts)
- [x] Función detectInfrastructureTopic() para activación dinámica del modo especialista
- [x] buildSystemPrompt() que inyecta la habilidad Panduit cuando se detecta el tema
- [x] El backend retorna isInfraMode en la respuesta del agente para el frontend
- [x] Badge visual "Panduit Certified" en el header del AgentChat cuando se activa el modo especialista
- [x] Banner informativo de especialista en Infraestructura Física con garantías y certificaciones
- [x] Sugerencias rápidas contextuales para infraestructura cuando está en modo especialista
- [x] Placeholder del input adaptativo según el modo activo

## Consola de Administración — Monitoreo en Tiempo Real

- [x] Tabla `visitor_sessions` en DB: visitorId, page, section, chatActive, chatDuration, country, city, ip, userAgent, lastSeenAt, createdAt
- [x] Tabla `page_events` en DB: visitorId, event, page, section, timestamp
- [x] tRPC procedure `tracking.heartbeat`: recibe visitorId, page, section, chatActive, chatDuration
- [x] tRPC procedure `admin.getLiveVisitors`: retorna visitantes activos (lastSeenAt < 2 min)
- [x] tRPC procedure `admin.getVisitorEvents`: retorna historial de eventos de un visitante
- [x] Hook `usePresenceTracker` en frontend: envía heartbeat cada 30s con página/sección activa
- [x] Detección de sección activa con IntersectionObserver en Home.tsx
- [x] Geolocalización por IP usando API pública (ip-api.com)
- [x] Página `/admin/monitor` con tabla de visitantes en tiempo real (auto-refresh cada 10-15s)
- [x] Columnas: ID visitante, página actual, sección activa, tiempo en chat, país/ciudad, última actividad
- [x] Indicadores de estado: verde (activo en chat), gris (navegando)
- [x] Detalle expandible por visitante: historial de páginas y eventos
- [x] Proteger ruta /admin/monitor con verificación de rol admin
- [x] Enlace a /admin/monitor desde el sidebar del admin
- [x] Historial de conversaciones del Agente Virtual en consola admin (ConversationRow + ChatHistorySection)
- [x] Vista expandible de mensajes por conversación con burbujas usuario/asistente
- [x] Indicadores de intención detectada, lead score y estado de conversación

## Live Chat con Intervención Humana

- [x] Campo `humanTookOver` (boolean) y `humanAgentName` (string) en tabla `conversations`
- [x] Tabla `live_chat_messages`: id, sessionId, role (user/human), content, agentName, read, createdAt
- [x] tRPC procedure `liveChat.getActiveSessions`: retorna sesiones intervenidas por humano
- [x] tRPC procedure `liveChat.sendMessage`: admin envía mensaje como humano a una sesión
- [x] tRPC procedure `liveChat.takeOver`: marca conversación como intervenida por humano
- [x] tRPC procedure `liveChat.release`: libera sesión de vuelta al agente IA
- [x] tRPC procedure `liveChat.pollMessages`: visitante consulta nuevos mensajes (polling cada 3s)
- [x] Widget flotante en visitante (esquina inferior izquierda): aparece cuando admin envía primer mensaje
- [x] Widget muestra badge "Soporte IAMET" con avatar, estado "En línea", burbuja de mensajes
- [x] Widget permite al visitante responder al agente humano
- [x] Panel LiveChatPanel en AdminConsole: lista de sesiones activas con preview del último mensaje
- [x] Panel admin: caja de texto para escribir y enviar mensaje al visitante seleccionado
- [x] Botón "Tomar control" en cada conversación del historial (ConversationRow)
- [x] Indicador visual en admin cuando una sesión está siendo atendida por humano (badge verde "Intervenida")
- [x] Contador de mensajes no leídos del visitante en la lista de sesiones activas

## E-Commerce — Catálogo y Solicitud de Cotización

- [x] Tabla `store_categories`: id, name, slug, icon, description, order
- [x] Tabla `store_products`: id, categoryId, name, slug, description, shortDesc, sku, priceRef, unit, imageUrl, tags, featured, active, createdAt
- [x] Tabla `quote_requests`: id, visitorName, company, email, phone, notes, status, createdAt
- [x] Tabla `quote_items`: id, quoteRequestId, productId, productName, quantity, notes
- [x] Seed de categorías: Seguridad, Redes, Cómputo, Cableado, Software, Energía, Servicios
- [x] Seed de ~25 productos de ejemplo con precios de referencia
- [x] tRPC procedure `store.getCategories`
- [x] tRPC procedure `store.getProducts` (filtro por categoría, búsqueda, featured)
- [x] tRPC procedure `store.getProduct` (detalle por slug)
- [x] tRPC procedure `store.submitQuote` (crea solicitud + ítems + notifica owner)
- [x] tRPC procedure `adminStore.getQuotes` (con ítems y producto)
- [x] tRPC procedure `adminStore.updateQuoteStatus`
- [x] tRPC procedure `adminStore.upsertProduct` (crear/editar producto)
- [x] tRPC procedure `adminStore.toggleProductActive`
- [x] Página /tienda: hero, filtros por categoría, grid de productos, búsqueda
- [x] Tarjeta de producto: imagen, nombre, categoría, precio ref, botón "Agregar a cotización"
- [x] Carrito lateral (drawer): lista de ítems, cantidades editables, botón "Solicitar cotización"
- [x] Modal de solicitud de cotización: nombre, empresa, email, teléfono, notas
- [x] Confirmación de solicitud enviada con número de referencia
- [x] Enlace a /tienda en el navbar principal
- [x] Sección "Cotizaciones" en panel admin: tabla con estado y detalle expandible
- [x] Imágenes de productos subidas al storage (cámara, switch, laptop, UPS, rack, access point)

## Página de Detalle de Producto (/tienda/:slug)

- [x] Campo `specs` (JSON) en tabla `store_products` para especificaciones técnicas
- [x] Migración Drizzle y actualización del seed con specs por producto
- [x] tRPC procedure `store.getProductBySlug` (getStoreProductBySlug): retorna producto con specs + relacionados
- [x] Página `/tienda/:slug`: hero con imagen grande, nombre, categoría, precio de referencia
- [x] Sección de especificaciones técnicas en tabla (clave/valor desde JSON)
- [x] Sección de productos relacionados (misma categoría, máx 4)
- [x] Botón "Agregar a cotización" directo (abre drawer del carrito)
- [x] Breadcrumb: Inicio > Tienda > Categoría > Producto
- [x] Ruta /tienda/:slug registrada en App.tsx
- [x] Tarjetas de Tienda.tsx navegan al detalle al hacer clic en imagen/nombre

## PDF de Solicitud de Cotización

- [x] Instalar jsPDF en el cliente para generación de PDF en el navegador
- [x] Función `downloadQuotePdf(snapshot)` en el frontend con tipo `QuoteSnapshot`
- [x] PDF incluye: header IAMET con color cian, número de referencia, fecha, datos de contacto, tabla de productos con SKU/cantidad/precio, total referencial, nota de validez y footer
- [x] Botón "Descargar resumen en PDF" en la pantalla de confirmación de Tienda.tsx

## Módulo Admin de Tienda — CRUD de Productos

- [x] Campo `deliveryTime` (string) en `store_products`: ej. "3-5 días hábiles"
- [x] Campo `dataSheetUrl` (string) en `store_products`: URL del PDF de ficha técnica en S3
- [x] Campo `imageUrl` (string) en `store_products`: URL de imagen subida por admin
- [x] Campo `description` (text) en `store_products`: descripción larga del producto
- [x] tRPC procedure `adminStore.upsertProduct`: crear/editar producto con todos los campos
- [x] tRPC procedure `adminStore.uploadProductImage`: recibe base64/buffer, sube a S3, retorna URL (adminStoreV2.uploadFile)
- [x] tRPC procedure `adminStore.uploadDataSheet`: recibe PDF buffer, sube a S3, retorna URL (adminStoreV2.uploadFile)
- [x] tRPC procedure `adminStore.toggleProductActive`: habilitar/deshabilitar producto
- [x] tRPC procedure `adminStore.deleteProduct`: eliminar producto
- [x] tRPC procedure `adminStore.getProducts`: lista paginada con filtros para el admin
- [x] Página `/admin/tienda`: tabla de productos con acciones (AdminTienda.tsx)
- [x] Formulario de producto: nombre, SKU, categoría, precio ref, tiempo entrega, descripción corta, descripción larga, specs (editor clave/valor), imagen (drag & drop), ficha técnica PDF (upload)
- [x] Vista previa de imagen al subir
- [x] Botón de toggle activo/inactivo por producto
- [x] Botón de eliminar con confirmación

## Registro Obligatorio para Acceder a la Tienda

- [x] Tabla `store_visitors`: id, name, email, phone, verifiedAt, verificationToken, tokenExpiry, createdAt
- [x] tRPC procedure `storeAuth.register`: crea visitante, genera token, envía email de verificación
- [x] tRPC procedure `storeAuth.verify`: valida token, marca verifiedAt, retorna JWT de sesión de tienda
- [x] tRPC procedure `storeAuth.checkSession`: verifica si el visitante tiene sesión activa — implementado en useStoreAuth hook (localStorage)
- [x] Email de verificación con link único (válido 24h) usando Resend desde noreply@iamet.mx
- [x] Modal de registro en `/tienda`: nombre, correo, teléfono — aparece antes de ver el catálogo
- [x] Página `/tienda/verificar?token=xxx`: confirma el email y redirige a la tienda
- [x] Guard en `/tienda` y `/tienda/:slug`: si no hay sesión verificada, mostrar modal de registro
- [x] Mensaje de "revisa tu correo" con opción de reenviar verificación
- [x] Sesión de tienda persistida en localStorage (no requiere login de Manus)
- [x] En admin: ver lista de visitantes registrados con fecha de verificación y actividad (pestaña Visitantes en /admin/tienda)

## Rediseño Página Principal — Layout tipo Copilot

- [x] Actualizar index.css con paleta modo oscuro (negro+azul+amarillo) y claro (gris claro+negro+azul)
- [x] Crear LanguageContext.tsx con soporte ES/EN y hook useLanguage
- [x] Rediseñar Navbar.tsx como sidebar izquierda colapsable con botón toggle, idioma y tema
- [x] Rediseñar Home.tsx: layout tipo Copilot con prompt central, saludo IAMET, chips de servicios debajo
- [x] Toggle de idioma ES/EN en la barra lateral
- [x] Toggle de modo oscuro/claro en la barra lateral

## Correo de Verificación — Resend

- [x] Instalar paquete resend en el proyecto
- [x] Crear server/email.ts con helper sendVerificationEmail y plantilla HTML
- [x] Actualizar storeAuth.register para enviar correo real al visitante
- [x] Actualizar storeAuth.resend para reenviar correo real al visitante
- [x] Configurar RESEND_API_KEY como variable de entorno
- [x] Verificar dominio iamet.mx en Resend (DKIM, SPF, MX)
- [x] Test de envío exitoso desde noreply@iamet.mx

## Migración PostgreSQL + Infraestructura Docker VPS

- [x] Migrar driver de mysql2 a postgres (postgres-js) en server/db.ts
- [x] Actualizar drizzle/schema.ts de mysqlTable a pgTable con tipos PostgreSQL
- [x] Actualizar drizzle.config.ts dialect: "mysql" → "postgresql"
- [x] Reemplazar onDuplicateKeyUpdate → onConflictDoUpdate en db.ts
- [x] Reemplazar insertId → .returning({ id }) en db.ts
- [x] Crear Dockerfile multi-stage (builder + production)
- [x] Crear docker-compose.staging.yml con PostgreSQL 16, Redis 7 y app en infra_network
- [x] Crear .env.staging.example con todas las variables documentadas
- [x] Crear .dockerignore
- [x] Crear infra/nginx/staging.iamet.mx.conf para Nginx global
- [x] Crear infra/scripts/deploy.sh, migrate.sh, rollback.sh
- [x] Reescribir DEPLOYMENT.md alineado a arquitectura VPS del usuario

## Plan de Remediación y Certificación Final

- [x] Instalar helmet, cors, express-rate-limit
- [x] Implementar Helmet en Express (sin romper OAuth/tRPC/SSE/WebSockets)
- [x] Implementar CORS explícito con VITE_APP_URL
- [x] Implementar Rate Limiting en OAuth, login, formularios públicos y leads
- [x] Optimizar body parser: 10MB general, 50MB solo en rutas de upload
- [x] Regenerar pnpm-lock.yaml limpio sin mysql2 (mysql2 es dep transitiva opcional de drizzle-orm — no residuo)
- [x] Verificar Docker: multi-stage, usuario no-root, healthchecks, volúmenes
- [x] Validar scripts: deploy.sh, migrate.sh, rollback.sh
- [x] Generar CERTIFICACION_FINAL.md con dictamen de staging

## Separación LLM / Storage — VPS Standalone

- [x] Instalar @aws-sdk/client-s3 y @aws-sdk/s3-request-presigner
- [x] Actualizar server/_core/env.ts: agregar llmApiUrl, llmApiKey, llmModel, r2Endpoint, r2Region, r2Bucket, r2AccessKeyId, r2SecretAccessKey, r2PublicUrl
- [x] Actualizar server/_core/llm.ts: usar ENV.llmApiUrl/llmApiKey/llmModel (separado de forgeApiUrl)
- [x] Reescribir server/storage.ts: implementación S3-compatible con @aws-sdk/client-s3 (R2/S3/MinIO)
- [x] Reescribir server/_core/storageProxy.ts: soporte para bucket público (301), privado (presigned 307) y fallback 503 sin R2
- [x] Actualizar .env.staging.example con bloques LLM_* y R2_* documentados
- [x] TypeScript: 0 errores
- [x] Build producción: dist/index.js 121.4 KB generado

## Login con Manus OAuth en la Tienda + Perfil de Usuario

- [x] Reemplazar StoreAuthModal (email/verificación) por guard de Manus OAuth en `/tienda` y `/tienda/:slug`
- [x] Botón "Iniciar sesión" visible en el navbar de la tienda para usuarios no autenticados
- [x] Avatar + nombre del usuario autenticado en el navbar de la tienda con dropdown (Mis cotizaciones / Cerrar sesión)
- [x] Columna `userId` (FK a `users.id`) en tabla `quote_requests` para vincular cotizaciones al usuario
- [x] Tabla `saved_carts`: id, userId, items (JSON), updatedAt
- [x] tRPC procedure `store.getMyQuotes`: retorna historial de cotizaciones del usuario autenticado
- [x] tRPC procedure `store.saveCart`: guarda el carrito actual del usuario en BD (upsertSavedCart)
- [x] tRPC procedure `store.getSavedCart`: recupera el carrito guardado del usuario
- [x] Página `/tienda/perfil`: datos del usuario, historial de cotizaciones con estado y fecha, carrito guardado
- [x] Auto-guardar carrito en BD cuando el usuario autenticado agrega/quita productos (debounced 2s)
- [x] Al hacer login, restaurar el carrito guardado automáticamente
- [x] Migración SQL: agregar columna `userId` a `quote_requests` y crear tabla `saved_carts`
