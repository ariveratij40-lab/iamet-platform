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

## Notificación por Email en Nueva Cotización + Migración VPS

- [x] Función `sendQuoteNotificationEmail` en server/email.ts con plantilla HTML profesional
- [x] Envío a alvaro.rivera@iamet.mx desde noreply@iamet.mx al recibir cada cotización
- [x] Llamada a `sendQuoteNotificationEmail` en `store.submitQuote` (no bloquea la respuesta)
- [x] Archivo SQL de migración VPS: `infra/scripts/migrate-vps-20260626.sql`
- [x] Migración incluye: columna `userId` en `quote_requests` + tabla `saved_carts`

## Autenticación Propia en Tienda (sin Manus OAuth)

- [x] Tabla `store_users`: id, name, email, passwordHash, phone, company, emailVerified, verificationToken, resetToken, createdAt, updatedAt
- [x] Migración SQL VPS para tabla `store_users` (en infra/scripts/migrate-vps-20260626.sql)
- [x] tRPC procedure `storeAuth.register`: crea cuenta, hashea password, envía email de verificación
- [x] tRPC procedure `storeAuth.login`: valida email+password, retorna JWT de 30 días
- [x] tRPC procedure `storeAuth.verifyEmail`: valida token, marca emailVerified
- [x] tRPC procedure `storeAuth.forgotPassword`: envía link de reset por email (válido 2h)
- [x] tRPC procedure `storeAuth.resetPassword`: valida token y actualiza contraseña
- [x] tRPC procedure `storeAuth.me`: retorna datos del usuario autenticado por JWT
- [x] tRPC procedure `storeAuth.getMyQuotes`: cotizaciones del usuario con JWT de tienda
- [x] tRPC procedure `storeAuth.getSavedCart`: carrito guardado con JWT de tienda
- [x] tRPC procedure `storeAuth.saveCart`: guarda carrito con JWT de tienda
- [x] Hook `useStoreSession`: maneja JWT en localStorage, expone user/isAuthenticated/loading/logout
- [x] Página `/tienda/login`: formulario email+password con tabs Login/Registro, identidad IAMET
- [x] Página `/tienda/verificar-email?token=xxx`: confirma email y redirige al login
- [x] Página `/tienda/nueva-contrasena?token=xxx`: formulario de nueva contraseña
- [x] Guard en `/tienda`, `/tienda/:slug` y `/tienda/perfil`: redirige a `/tienda/login` si no hay sesión
- [x] Navbar de tienda actualizado: botón "Iniciar sesión" → `/tienda/login`, avatar+dropdown cuando autenticado
- [x] Página `/tienda/perfil` usa `useStoreSession` y procedures `storeAuth.*` con JWT

## Historial de Solicitudes en Perfil de Tienda

- [x] Vincular `quote_requests.storeUserId` a `store_users.id` al enviar cotización (QuoteForm en Tienda.tsx)
- [x] Agregar columna `storeUserId` en `quote_requests` (migración SQL)
- [x] Procedure `storeAuth.getMyQuotes`: retorna cotizaciones con items, estado, fecha y refCode vinculadas al storeUserId
- [x] Página `/tienda/perfil`: sección "Mis Solicitudes" con tarjetas expandibles por cotización
- [x] Cada tarjeta muestra: refCode, fecha, estado con badge de color, lista de productos con cantidad
- [x] Estado con badge: Pendiente (amarillo), En revisión (azul), Cotizado (verde), Cerrado (gris)
- [x] Botón "Nueva solicitud" que navega a la tienda para iniciar nueva cotización
- [x] Estado vacío cuando no hay solicitudes previas

## Rediseño IAMET 2026 — Engineering Operating System

### Home — Asistente Inteligente (Hero)
- [x] Rediseñar Home.tsx: hero full-screen con asistente como elemento principal
- [x] Título poderoso + subtítulo enterprise (no "¿en qué puedo ayudarte?")
- [x] Botón de voz (placeholder UI con toast "próximamente")
- [x] Botón adjuntar documentos (placeholder UI con toast "próximamente")
- [x] Sección de Especialistas IA: grid de chips seleccionables (10 especialistas)
- [x] Al seleccionar especialista, el asistente adopta su personalidad y contexto
- [x] Ejemplos de prompts mejorados (6 ejemplos del documento)
- [x] Secciones post-scroll: Soluciones, Industrias, Partners, Normativas, Centro de Conocimiento, CTA de Contacto

### Especialistas IA (Backend)
- [x] Crear server/specialists.ts con 10 perfiles de especialistas (personalidad, keywords, system prompt)
- [x] Especialistas: Infraestructura, CCTV, Control de Acceso, RFID, Redes, Energía, Software, IA, Data Centers, Industria 4.0
- [x] Actualizar agent.sendMessage para aceptar specialistId y usar el prompt del especialista seleccionado
- [x] Cada especialista hace preguntas, recomienda arquitectura, fabricantes, genera propuesta y lista de materiales

### Soluciones — 9 Verticales
- [x] Actualizar DB seed: 9 verticales (agregar Control de Acceso, CCTV, Audio y Voceo, Salas de Juntas, Cómputo y Licenciamiento, Pólizas y Servicios Administrados)
- [x] Actualizar VerticalLanding.tsx con contenido para las 9 verticales
- [x] Actualizar Navbar.tsx: 9 verticales en el submenú de Soluciones
- [x] Actualizar LanguageContext.tsx con labels de las 9 verticales
- [x] Actualizar routers.ts: lista de slugs válidos para lead scoring

### Secciones Post-Scroll en Home
- [x] Sección Industrias: grid de sectores (manufactura, salud, educación, gobierno, retail, hotelería, finanzas)
- [x] Sección Partners/Fabricantes: logos de marcas (Panduit, Cisco, Hikvision, Dahua, HID, Zebra, etc.)
- [x] Sección Normativas: ISO 27001, TIA-568, NFPA, NOM, etc.
- [x] Sección Centro de Conocimiento: cards de recursos (guías, whitepapers, casos de éxito)
- [x] Sección Contacto al final de la Home

### Navegación
- [x] Agregar sección "Industrias" como ruta /industrias con página propia
- [x] Agregar sección "Centro de Conocimiento" como ruta /conocimiento (pendiente página dedicada)

## Auditoría MySQL/TiDB y mejoras de agente

- [x] Auditar db.ts completo: identificar .returning(), onConflictDoUpdate, y otros patrones PostgreSQL-only
- [x] Corregir todos los .returning() en db.ts para usar insertId en MySQL
- [x] Corregir onConflictDoUpdate → onDuplicateKeyUpdate para MySQL
- [x] Mejorar frontend: toast de error con botón "Reintentar" cuando falla el agente
- [x] Mejorar frontend: log del error real en consola para debugging
- [x] Mejorar backend: log estructurado del error real en el servidor
- [x] Probar flujo completo: createConversation, createLead, createAdvisorSession, createEnrollment
- [x] Probar envío de mensaje con cada especialista IA (10 especialistas)

## Fase 2 — Estabilización y QA Funcional

### 1. Especialistas IA
- [x] Prueba automatizada: los 10 especialistas responden con contexto correcto (vitest)
- [x] Validar que el specialistId se persiste correctamente en la conversación
- [x] Verificar que el especialista auto-detectado funciona cuando no se selecciona ninguno

### 2. Formularios y Leads
- [x] Validar formulario de contacto: campos requeridos, mensajes de error claros
- [x] Validar formulario de cotización en tienda: items, notas, envío
- [x] Verificar que createLead guarda correctamente en BD con score calculado
- [x] Verificar que se envía el email de notificación al admin al recibir cotización

### 3. Navegación
- [x] Verificar que todas las rutas de Soluciones (9 verticales) cargan sin 404
- [x] Verificar que /industrias carga correctamente
- [x] Verificar que /soluciones carga correctamente
- [x] Verificar que el Navbar submenú de Soluciones muestra los 9 items
- [x] Verificar que los links del footer apuntan a rutas válidas

### 4. Responsive Móvil
- [x] Hero de Home: asistente y especialistas visibles en 375px
- [x] Navbar: menú hamburguesa funcional en móvil
- [x] Tienda: grid de productos responsive en móvil
- [x] Tienda Perfil: tarjetas de historial legibles en móvil
- [x] VerticalLanding: layout correcto en móvil
- [x] Industrias y Soluciones: grids responsive en móvil

### 5. Logs sin Errores
- [x] Revisar devserver.log: sin errores críticos al inicio
- [x] Revisar browserConsole.log: sin errores JS no controlados
- [x] Revisar networkRequests.log: sin 4xx/5xx inesperados
- [x] Verificar que los logs del agente muestran [Agent] OK correctamente

### 6. SEO Básico
- [x] Meta title y description únicos por página (Home, Soluciones, Industrias, Verticales)
- [x] Open Graph tags: og:title, og:description, og:image, og:url
- [x] sitemap.xml generado con todas las rutas públicas
- [x] robots.txt configurado correctamente
- [x] Canonical URLs en todas las páginas

### 7. Seguridad
- [x] Rate limiting en endpoints del agente (30 msgs/5min por IP)
- [x] Rate limiting en endpoints de tienda (registro, login, cotización)
- [x] Sanitización de inputs en el agente (trim, maxLength ya en zod)
- [x] Variables de entorno: ninguna expuesta en el bundle del cliente
- [x] Errores del servidor: nunca exponer stack traces al cliente
- [x] Headers de seguridad: Helmet activo (X-Content-Type-Options, X-Frame-Options, HSTS)

## Fase 7 — Configuración Cloudflare R2 Storage

- [x] Configurar variables de entorno R2 (R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL, R2_REGION)
- [x] Verificar que server/storage.ts usa R2_PUBLIC_URL para generar URLs públicas
- [x] Verificar que server/_core/storageProxy.ts sirve assets correctamente desde R2
- [x] Subir logo IAMET al bucket R2 y actualizar URL en el código
- [x] Subir imágenes de productos al bucket R2 y actualizar URLs en la BD
- [x] Subir PDFs y recursos del Academy al bucket R2
- [x] Verificar que el logo carga correctamente en el Navbar en producción
- [x] Verificar que las imágenes de productos cargan en la Tienda
- [x] Checkpoint y entrega

## Calendario Inteligente — Agente SDR

### Base de Datos
- [x] Tabla `engineers`: id, name, email, specialty, avatarUrl, timezone, active
- [x] Tabla `availability_slots`: id, engineerId, date, startTime, endTime, isBooked
- [x] Tabla `meetings`: id, slotId, engineerId, clientName, clientEmail, clientPhone, company, topic, specialistId, status (pending/confirmed/cancelled), notes, cancelToken, createdAt
- [x] Migración SQL aplicada en BD

### Backend (tRPC)
- [x] `calendar.getAvailableDates(daysAhead)`: retorna fechas con slots disponibles en los próximos 14 días
- [x] `calendar.getSlotsByDate(date)`: retorna slots disponibles por fecha con datos del ingeniero
- [x] `calendar.bookMeeting(slotId, clientData, topic)`: reserva el slot, crea el meeting, marca slot como booked, envía emails
- [x] `calendar.cancelMeeting(token)`: cancela reunión por token único
- [x] `adminCalendar.getMeetings(status?, limit?)` (admin): lista todas las reuniones con filtros
- [x] `adminCalendar.updateMeetingStatus(id, status)` (admin): confirmar/cancelar desde el panel
- [x] Seed de disponibilidad: lunes a viernes 9-18h, slots de 1 hora, próximas 4 semanas (ejecutado en startup)

### Agente IA — SDR Flow
- [x] Detectar intención de agendar reunión en el mensaje del usuario (keywords: reunión, agendar, cita, hablar, ingeniero, demo, visita)
- [x] Cuando el agente ofrece agendar: retorna `action: "schedule_meeting"` en la respuesta tRPC
- [x] Frontend detecta `action: "schedule_meeting"` y muestra el componente CalendarPicker inline en el chat
- [x] IAMET_BASE_PROMPT actualizado: el agente ofrece proactivamente agendar reunión cuando detecta interés
- [x] Confirmar reserva desde el chat sin salir de la conversación

### UI — CalendarPicker en el Chat
- [x] Componente `CalendarPicker.tsx`: selector de fecha (próximos 14 días con slots disponibles)
- [x] Al seleccionar fecha, mostrar slots de hora disponibles agrupados por ingeniero
- [x] Formulario inline: nombre, email, teléfono, empresa, tema del proyecto
- [x] Confirmación visual con resumen de la reunión agendada (paso 4 de 4)
- [x] Botón "Volver" para navegar entre pasos
- [x] Animación de entrada/salida con framer-motion en el chat

### Panel Admin `/admin/reuniones`
- [x] Página `/admin/reuniones` con lista de reuniones expandible por fila
- [x] Filtros por estado (pendiente/confirmada/completada/cancelada)
- [x] Tarjetas de métricas: total, confirmadas, pendientes, completadas, canceladas
- [x] Botones de cambio de estado: Pendiente, Confirmada, Completada, Cancelada
- [x] Badge de estado con colores (pendiente=amarillo, confirmada=azul, completada=verde, cancelada=rojo)
- [x] Detalle expandible: fecha, hora, ingeniero, datos de contacto, tema, especialista IA
- [x] Enlace en sidebar del DashboardLayout

### Emails
- [x] Email al cliente: confirmación con fecha, hora, ingeniero asignado, link de cancelación (sendMeetingConfirmationEmail)
- [x] Email al ingeniero: notificación de nueva reunión con datos del cliente y tema
- [x] Email al admin (alvaro.rivera@iamet.mx): resumen de nueva reunión agendada
- [x] Email de cancelación al cliente (sendMeetingCancellationEmail)

## Sprint 1 — Conversión

### Flujo de Cancelación
- [x] Página `/cancelar-reunion?token=xxx`: muestra detalles de la reunión y botón de confirmar cancelación
- [x] tRPC `calendar.getMeetingByToken(token)`: consulta detalles antes de cancelar
- [x] tRPC `calendar.cancelMeeting(token)`: cancela reunión, libera slot (isBooked=false), envía email
- [x] Email de cancelación al cliente con confirmación
- [x] Ruta `/cancelar-reunion` registrada en App.tsx
- [x] Estado de error si el token es inválido o ya fue cancelado
- [x] Flujo de 4 estados: loading → confirm → cancelling → success/error

### Ingenieros Reales
- [x] Columnas `certifications` y `languages` agregadas a tabla engineers (migración SQL aplicada)
- [x] Seed actualizado con 5 perfiles reales: Álvaro Rivera, Marco Reyes, Luis Hernández, Diego Castillo, Sofía Morales
- [x] Ingenieros insertados en BD con especialidad, certificaciones e idiomas
- [x] Slots de disponibilidad regenerados para los 5 ingenieros

### Cloudflare R2
- [x] Diagnóstico: R2 funciona correctamente (HTTP 200 en todos los assets)
- [x] Variables R2_* correctamente configuradas en el entorno
- [x] Bucket público accesible en https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev
- [x] 20 objetos en R2: logos, services, store (verificado con S3 SDK)
- [x] imageUrl de los 25 productos de la tienda actualizada con URLs directas de R2
- [x] Seed de productos actualizado para incluir imageUrl de R2 en futuros reseeds

## Sprint 2 — Adquisición de Clientes

### Landing Factory (Motor Reutilizable)
- [x] Archivo `client/src/data/landings.ts` con 14 configuraciones de verticales (hero, pain points, beneficios, casos de uso, CTA)
- [x] Componente `LandingPage.tsx` reutilizable con secciones: Hero, Pain Points, Beneficios, Especialista IA inline, CTA de reunión
- [x] Ruta dinámica `/landing/:vertical` en App.tsx
- [x] Verticales: cableado, cctv, control-acceso, rfid, data-center, redes, wifi-industrial, ia-empresarial, software, servicios-administrados, audio-voceo, salas-juntas, automatizacion, fabricantes

### Especialista IA Contextual
- [x] Parámetro `vertical` en `sendMessage` del agente: selecciona system prompt especializado
- [x] 14 system prompts especializados en specialists.ts (uno por vertical)
- [x] Frontend: al entrar desde `/landing/:vertical`, el agente inicia con contexto de esa vertical
- [x] Mensaje de bienvenida personalizado por vertical en el chat

### Analítica GA4 + GTM
- [x] Script de GTM en `client/index.html` (dataLayer init + gtag)
- [x] Hook `useAnalytics.ts`: trackEvent envia a dataLayer + backend (fire-and-forget, no bloquea UI)
- [x] Tabla `analytics_events` en BD: id, event, vertical, sessionId, utmSource, utmMedium, utmCampaign, metadata, createdAt
- [x] Eventos instrumentados en LandingPage: vertical_viewed, chat_started, meeting_intent, meeting_booked, lead_captured, cta_clicked
- [x] tRPC `analytics.trackEvent` (public) para persistir eventos
- [x] tRPC `analytics.getSummary` (admin) para el Dashboard Comercial

### Dashboard Comercial
- [x] Tab "Analítica" en AdminDashboard actualizado con KPIs de conversión
- [x] Tarjetas: Reuniones Agendadas, Leads Generados, Sesiones de Chat, Total de Eventos
- [x] Barras animadas: Eventos por tipo (meeting_booked, lead_captured, chat_started...)
- [x] Barras animadas: Interacción por vertical (qué landing genera más engagement)
- [x] Tabla de actividad reciente: últimos 50 eventos con timestamp, tipo y vertical
- [x] Score Distribution heredado (Hot/Warm/Cold leads)

## Sprint 3 — Inteligencia Comercial

### Attribution Completa
- [x] 10 campos en tabla `leads`: utmTerm, utmContent, gclid, fbclid, msclkid, referrer, landingUrl, firstPage, sessionId + utmSource/Medium/Campaign
- [x] 12 campos en tabla `meetings`: mismos UTM + meetingUrl, firstPage, sessionId
- [x] Hook `useAttribution.ts`: captura UTM + click IDs + referrer + landing_url + first_page al cargar la app, persiste en sessionStorage
- [x] tRPC procedures actualizados: leads.create y calendar.bookMeeting aceptan attribution
- [x] Schema Drizzle actualizado con los nuevos campos
- [x] Dashboard Comercial: tabla por fuente, campaña y top keywords (utm_term)

### Seguimiento Automático de Leads (IA Comercial)
- [x] Tabla `lead_followups`: id, leadId, type (24h/48h/72h/7d), status (pending/sent/failed/skipped), scheduledAt, sentAt, emailSubject, emailBody
- [x] `server/followups.ts`: motor de seguimiento con IA (invokeLLM genera email personalizado)
- [x] `scheduleLeadFollowups(leadId)`: programa la secuencia de 4 emails al crear un lead
- [x] `processLeadFollowups()`: handler del heartbeat que envía los emails pendientes
- [x] Secuencia: 24h (check-in), 48h (caso de uso), 72h (urgencia), 7d (reactivación)
- [x] Email generado por IA: personalizado con nombre, empresa, vertical, pain points
- [x] Endpoint `POST /api/scheduled/lead-followups` registrado en index.ts
- [x] Heartbeat listo para configurar después del Deploy

### Recordatorios Inteligentes Multi-Canal
- [x] Tabla `meeting_reminders`: id, meetingId, reminderType (24h/2h/30min), recipient (client/engineer/vendor), scheduledAt, sentAt, status
- [x] `server/reminders.ts`: motor de recordatorios con emails HTML (3 colores según urgencia)
- [x] `scheduleMeetingReminders(meetingId, datetime)`: programa hasta 9 recordatorios al confirmar una reunión
- [x] `processMeetingReminders()`: handler del heartbeat que envía recordatorios pendientes
- [x] Recordatorio 24h: email a cliente + ingeniero + vendedor
- [x] Recordatorio 2h: email a cliente + ingeniero
- [x] Recordatorio 30min: email a cliente con link directo
- [x] Links en emails: Google Meet, Microsoft Teams, Google Calendar (.ics adjunto)
- [x] Campo `meetingUrl` en tabla `meetings` para guardar el link de la reunión virtual
- [x] Endpoint `POST /api/scheduled/meeting-reminders` registrado en index.ts
- [x] Heartbeat listo para configurar después del Deploy
- [x] `scheduleMeetingReminders` llamado automáticamente en `calendar.bookMeeting`

## Tareas Operativas Post-Sprint 3

### Schedules (Heartbeats)
- [x] Heartbeat `iamet-lead-followups`: cada hora — procesa emails de seguimiento pendientes
- [x] Heartbeat `iamet-meeting-reminders`: cada 30 minutos — procesa recordatorios de reuniones

### meetingUrl Editable
- [x] Campo de texto `meetingUrl` editable en el detalle de cada reunión en /admin/reuniones
- [x] tRPC `adminCalendar.updateMeetingUrl(meetingId, url)` para guardar el link
- [x] El link se inyecta automáticamente en los emails de recordatorio 24h/2h/30min

### Panel /admin/seguimientos
- [x] Página `/admin/seguimientos` con cola de automatizaciones de leads
- [x] Columnas: Lead, Secuencia, Estado, Programado, Enviado, Score IA, Acciones
- [x] Fila expandible: auditoría completa de tiempos, datos del lead, asunto del email
- [x] Botones: Ver correo (preview HTML), Enviar ahora, Cancelar, Reintentar fallidos
- [x] Filtros: por estado, vertical y búsqueda de lead/empresa
- [x] Indicador "Próximo envío en Xh Ym" para seguimientos pendientes
- [x] Dialog de preview con email HTML generado por IA y botón "Enviar ahora" desde el preview
- [x] tRPC `adminFollowups.list`, `getById`, `cancel`, `sendNow`, `retry`, `getStats`
- [x] Enlace en sidebar del DashboardLayout (icono Mail)
- [x] Auto-refresh cada 30 segundos

## Sprint 4 — CRM Inteligente con IA

### Lead Scoring Dinámico
- [x] Tabla `lead_scores`: id, leadId, score, factors (JSON), recommendation, updatedAt
- [x] `server/scoring.ts`: motor de scoring con múltiples variables (industria, vertical, empresa, tamaño, cargo, conversaciones IA, reuniones, fuente UTM, historial)
- [x] `calculateLeadScore(leadId)`: calcula y guarda el score en BD
- [x] tRPC `crm.getLeadScore(leadId)` y `crm.recalculateScore(leadId)`
- [x] Etiquetas: Hot (80+), Warm (60-79), Cool (40-59), Cold (<40)
- [x] Acción recomendada: "Llamar hoy", "Enviar propuesta", "Nutrir con contenido", "Reactivar"
- [x] Score visible en AdminCRM con badge de color

### Recomendaciones IA Post-Conversación
- [x] Tabla `ai_recommendations`: id, leadId, conversationId, vendorSuggestion, specialistSuggestion, products (JSON), crossSell (JSON), documents (JSON), reasoning, createdAt
- [x] `server/recommendations.ts`: genera recomendaciones con LLM después de cada conversación
- [x] LLM analiza: interés detectado, industria, tamaño, pain points → sugiere vendedor, especialista, productos, cross-sell
- [x] tRPC `crm.generateRecommendation(leadId, conversationId)` y `crm.getRecommendation(leadId)`
- [x] Tab "Recomendaciones" en modal de detalle del lead en AdminCRM

### Timeline Comercial
- [x] Tabla `lead_timeline`: id, leadId, type, title, description, metadata (JSON), createdAt
- [x] `server/timeline.ts`: funciones para agregar y consultar eventos de la timeline
- [x] 13 tipos de evento: lead_created, page_visit, conversation_started, meeting_scheduled, email_sent, followup_sent, reminder_sent, quote_requested, status_changed, score_updated, recommendation_generated, attribution_captured
- [x] tRPC `crm.getTimeline(leadId)` y `crm.addTimelineEvent(leadId, type, title, description)`
- [x] Tab "Timeline" en modal de detalle del lead en AdminCRM con línea de tiempo vertical

### Briefing Diario IA
- [x] Tabla `daily_briefings`: id, date, summary, hotLeads (JSON), meetingsToday (JSON), alerts (JSON), recommendations (JSON), campaignInsights (JSON), createdAt
- [x] `server/briefing.ts`: genera el briefing con LLM usando datos del día
- [x] Contenido: reuniones del día, leads calientes, leads sin seguimiento, insights de campañas
- [x] Heartbeat `iamet-daily-briefing`: ejecuta cada mañana a las 7am CST (13:00 UTC)
- [x] Endpoint `POST /api/scheduled/daily-briefing` registrado en index.ts
- [x] tRPC `crm.getBriefings(limit)` y `crm.generateBriefing()`
- [x] Modal de briefings en AdminCRM con los últimos 3 briefings y botón "Generar ahora"
- [x] Enlace en sidebar del DashboardLayout (icono TrendingUp en /admin/crm)

## Sprint 4.5 — Automatización del CRM

### Triggers Internos
- [x] `leads.create`: llamar `calculateLeadScore(leadId)` + `addTimelineEvent(leadId, 'lead_created', ...)` + alerta Hot Lead si score >80
- [x] `calendar.bookMeeting`: llamar `addTimelineEvent(leadId, 'meeting_scheduled', ...)` + recalcular score
- [x] `adminCalendar.updateMeetingStatus`: llamar `addTimelineEvent(leadId, 'status_changed', ...)` + recalcular score
- [x] `processLeadFollowups`: llamar `addTimelineEvent(leadId, 'followup_sent', ...)` después de cada envío
- [x] `processMeetingReminders`: llamar `addTimelineEvent(leadId, 'reminder_sent', ...)` después de cada envío
- [x] `adminLeads.updateStatus`: llamar `addTimelineEvent(leadId, 'status_changed', ...)` + recalcular score

### Pipeline Editable en /admin/crm
- [x] Selector de estado inline en la lista de leads: new → contacted → qualified → proposal → won / lost
- [x] tRPC `crm.updateLeadStatus(leadId, status)`: actualiza estado + agrega evento a timeline + recalcula score
- [x] Badge de estado con colores: new=gris, contacted=azul, qualified=amarillo, proposal=naranja, won=verde, lost=rojo
- [x] Filtros por estado en la lista de leads del CRM
- [x] Contador de leads por estado en las tarjetas KPI

### Alertas Hot Lead (score >80)
- [x] Función `checkAndAlertHotLead(leadId, score)`: si score ≥ 80, enviar notificación al owner + email al admin
- [x] Notificación con título: "🔥 Lead Hot: [empresa] — [score]/100"
- [x] Email al admin con: nombre, empresa, score, acción recomendada, link al CRM
- [x] Alerta se dispara en: leads.create, recalculateScore, updateLeadStatus
- [x] No enviar alerta duplicada si ya se envió en las últimas 24h para el mismo lead

## Sprint 4.5 — Completado ✅

- [x] `leads.create`: llamar `calculateLeadScore(leadId)` + `addTimelineEvent(leadId, 'lead_created', ...)` + alerta Hot Lead si score ≥ 80 + `scheduleLeadFollowups`
- [x] `leads.updateStatus`: llamar `addTimelineEvent(leadId, 'status_changed', ...)` + recalcular score + alerta Hot Lead
- [x] `calendar.bookMeeting`: llamar `addTimelineEvent(leadId, 'meeting_scheduled', ...)` + recalcular score para lead vinculado
- [x] `adminCalendar.updateMeetingStatus`: llamar `addTimelineEvent(leadId, 'status_changed', ...)` + recalcular score para lead vinculado
- [x] tRPC `crm.updateLeadStatus(leadId, status, notes?)`: actualiza estado pipeline + timeline + recalcula score + alerta Hot Lead si score ≥ 80
- [x] Selector de estado inline (dropdown) en cada fila de lead en AdminCRM — con actualización optimista
- [x] Colores por estado: new=gris, contacted=azul, qualified=amarillo, proposal=naranja, won=verde, lost=rojo
- [x] Filtros por estado en la lista de leads del CRM (incluye Perdidos)
- [x] TypeScript: 0 errores | Tests: 23/23 pasados

## Sprint 5 — Agente Comercial Autónomo (Tool Orchestration)

### Capa de Herramientas (server/agent-tools.ts)
- [x] `searchKnowledge(query)`: busca en base de conocimiento IAMET + Panduit
- [x] `searchProducts(query, category?)`: busca productos en catálogo con precios de referencia
- [x] `recommendSolutions(needs, industry, size)`: genera arquitectura de solución con productos específicos
- [x] `createLead(data)`: crea lead en BD con todos los campos de precalificación
- [x] `updateLead(leadId, data)`: actualiza datos del lead (industria, tamaño, presupuesto, urgencia)
- [x] `calculateLeadScore(leadId)`: recalcula score y retorna resultado
- [x] `assignSalesperson(leadId, criteria)`: asigna vendedor según vertical e industria
- [x] `assignEngineer(leadId, criteria)`: asigna ingeniero según especialidad requerida
- [x] `bookMeeting(leadId, date, engineerId)`: agenda reunión y retorna confirmación
- [x] `sendEmail(to, subject, body, type)`: envía email usando Resend
- [x] `sendBrochure(leadId, vertical)`: envía brochure PDF del vertical por email
- [x] `generateProposal(leadId, items)`: genera estimación preliminar de proyecto con montos MXN
- [x] `reactivateLead(leadId, reason)`: reactiva lead frío con mensaje personalizado
- [x] `createTask(leadId, title, dueDate, assignee)`: crea tarea de seguimiento
- [x] `notifyOwner(title, content)`: notifica al owner con alerta de acción comercial

### Orquestador LLM (server/agent-orchestrator.ts)
- [x] Función `runAgentLoop(sessionId, userMessage, history)`: loop de razonamiento con tool_choice
- [x] Definición OpenAI-compatible de las 15 herramientas para el LLM (JSON Schema)
- [x] Parsing de tool_calls en la respuesta del LLM
- [x] Ejecución de herramientas y retorno de resultados al LLM
- [x] Máximo 5 iteraciones por turno para evitar loops infinitos
- [x] Respuesta final al usuario después de ejecutar herramientas

### Memoria Comercial (server/agent-memory.ts)
- [x] Tabla `agent_memory`: id, sessionId, leadId, key, value (JSON), createdAt, updatedAt (implementada via metadata JSON en conversations)
- [x] Función `getMemory(sessionId)`: recupera contexto acumulado de la sesión
- [x] Función `updateMemory(sessionId, key, value)`: actualiza campo de memoria
- [x] Función `buildMemoryContext(sessionId)`: construye string de contexto para el system prompt
- [x] Campos de memoria: industry, companySize, branches, budget, urgency, decisionMaker, competitors, needs, currentSystems, timeline
- [x] Herramienta `updateLeadMemory(sessionId, fields)` para que el agente actualice la memoria (via updateMemoryFromConversation post-turno)

### System Prompt del Agente SDR
- [x] Actualizar IAMET_BASE_PROMPT en routers.ts para modo SDR con tool orchestration (buildSDRSystemPrompt en agent-orchestrator.ts)
- [x] Instrucciones de precalificación: preguntar industria, tamaño, sucursales, presupuesto, urgencia
- [x] Instrucciones de descubrimiento: preguntar sobre sistemas actuales, competidores, decisores
- [x] Instrucciones de recomendación: construir arquitectura completa con productos específicos
- [x] Instrucciones de cotización: generar estimación preliminar antes de escalar al ingeniero
- [x] Instrucciones de agenda: ofrecer reunión cuando el lead esté calificado (score ≥ 50)

### Conexión en routers.ts
- [x] Reemplazar sendMessage para usar `runAgentLoop` del orquestador
- [x] Pasar historial de conversación al orquestador
- [x] Retornar `toolsUsed[]` en la respuesta para mostrar en UI

### UI del Chat (Home.tsx / AIChatBox)
- [x] Mostrar indicador de "Agente ejecutando acción..." cuando hay tool calls en progreso
- [x] Mostrar chips de acciones ejecutadas: "📅 Reunión agendada", "📧 Email enviado", "📊 Score calculado"
- [x] Mostrar tarjeta de propuesta preliminar cuando el agente genera `generateProposal`
- [x] Mostrar tarjeta de confirmación de reunión cuando el agente ejecuta `bookMeeting`

## Sprint 6 — Centro de Inteligencia Comercial + Enterprise RAG

### Módulo 1: Centro de Inteligencia Comercial (/admin/intelligence)
- [x] server/intelligence.ts: helpers de forecast, embudo, ROI por canal, verticales, vendedores, especialistas IA, tendencias
- [x] tRPC router intelligence.*: getForcast, getFunnel, getChannelROI, getVerticals, getSalespersons, getAgentStats, getTrends
- [x] Página AdminIntelligence.tsx: dashboard ejecutivo con 7 secciones
- [x] Tarjeta Forecast: Pipeline Total, ponderado, ventas esperadas, probabilidad de meta, forecast 30/90 días
- [x] Tarjeta Embudo Comercial: visitantes → conversaciones → leads → calificados → reuniones → propuestas → negociaciones → ganadas → perdidas
- [x] Tarjeta ROI por Canal: Google Ads, LinkedIn, Facebook, Referidos, Orgánico, Email, UTM — costo por lead/reunión/oportunidad/proyecto
- [x] Tarjeta Verticales: top verticales, conversión, ticket promedio, tiempo de cierre, pipeline por vertical
- [x] Tarjeta Vendedores: leads asignados, reuniones, cotizaciones, ventas, conversión, pipeline, tiempo de respuesta
- [x] Tarjeta Especialistas IA: conversaciones, leads generados, herramientas ejecutadas, tiempo promedio, conversión, score promedio
- [x] Tarjeta Tendencias: leads/día, reuniones, propuestas, ventas, heatmap por hora y día

### Módulo 2: Observabilidad del Agente (/admin/agent)
- [x] Tabla agent_traces: id, conversationId, sessionId, toolName, params (json), result (json), durationMs, success, error, iterationNum, createdAt
- [x] server/agent-traces.ts: helpers para guardar y consultar trazas de tool calls
- [x] Actualizar agent-orchestrator.ts para guardar trazas en agent_traces en cada tool call
- [x] tRPC router agentObs.*: getConversations (con métricas), getConversationDetail (con tool calls), getStats
- [x] Página AdminAgent.tsx: lista de conversaciones con métricas (tokens, costo, duración, lead, reunión, propuesta, score)
- [x] Vista detalle de conversación: secuencia completa de tool calls con hora, parámetros, resultado, duración, estado
- [x] Mostrar memoria utilizada, contexto enviado al modelo, número de iteraciones, latencia por herramienta, costo estimado

### Módulo 3: Enterprise RAG — Base de Conocimiento
- [x] Tablas: knowledge_collections, knowledge_documents, knowledge_chunks, knowledge_embeddings (simulado con JSON), knowledge_sources, knowledge_tags, knowledge_versions, knowledge_feedback
- [x] Migración SQL para todas las tablas de knowledge_*
- [x] server/knowledge.ts: helpers CRUD para documentos, chunks, colecciones
- [x] Importadores: PDF (pdf-parse), Word (mammoth), Excel (xlsx), PowerPoint (pptx), Markdown, Texto, CSV
- [x] Procesamiento automático: extraer texto → limpiar → generar chunks → generar embeddings (via LLM) → indexar → resumen IA → palabras clave → categorías
- [x] Página AdminKnowledge.tsx (/admin/knowledge): upload de documentos con metadatos (título, categoría, fabricante, producto, versión, fecha, autor, fuente, etiquetas)
- [x] tRPC router knowledge.*: upload, list, getDetail, delete, reprocess, search

### Módulo 4: Motor RAG — Búsqueda Híbrida
- [x] server/rag.ts: búsqueda híbrida (vector search simulado + keyword search + re-ranking via LLM)
- [x] Función ragSearch(query, topK): retorna chunks relevantes con score y fuente
- [x] Actualizar searchKnowledge en agent-tools.ts para usar ragSearch en lugar de base estática
- [x] El agente cita documentos internamente para fundamentar respuestas

### Módulo 5: Aprendizaje Comercial
- [x] Tabla commercial_learnings: id, leadId, outcome (won/lost), industry, employees, vertical, problem, pain, budget, competitor, productsSold, closingTime, lossReason, successReason, decisionMaker, channel, campaign, source, createdAt
- [x] Trigger en crm.updateLeadStatus: cuando status = won/lost, llamar extractCommercialLearning(leadId)
- [x] server/commercial-learning.ts: función extractCommercialLearning usa LLM para extraer datos estructurados de la conversación del lead
- [x] tRPC router learning.*: getInsights, getTopPatterns, getLossReasons, getSuccessFactors

### Módulo 6: Inteligencia Predictiva
- [x] server/predictive.ts: modelos de probabilidad de cierre, tiempo esperado, valor esperado, riesgo, siguiente mejor acción, prioridad
- [x] Función predictLead(leadId): retorna { closeProbability, expectedDays, expectedValue, risk, nextBestAction, priority }
- [x] Actualizar calculateLeadScore para incluir predicción
- [x] tRPC router predictive.*: predictLead, getRecommendations, getTopOpportunities
- [x] Mostrar recomendaciones en AdminCRM: "Asignar a ingeniero especializado", "Incrementar presupuesto Google Ads"

### Módulo 7: Briefing Ejecutivo IA
- [x] Tabla daily_briefings: id, date, content (json), generatedAt, taskUid (varchar 65)
- [x] server/briefing.ts: actualizar/crear función generateDailyBriefing() con datos reales del Sprint 6
- [x] Handler /api/scheduled/daily-briefing: genera briefing, guarda en BD, notifica al owner
- [x] Heartbeat diario 07:00 AM (14:00 UTC) via manus-heartbeat CLI
- [x] Página AdminBriefing.tsx (/admin/briefing): muestra el briefing del día con secciones: nuevos leads, leads hot, reuniones del día, seguimientos, pipeline, forecast, riesgos, alertas, campañas, recomendaciones, top oportunidades, top vendedores, top verticales

### Módulo 8: Conexión RAG al Agente SDR
- [x] searchKnowledge en agent-tools.ts usa ragSearch() real en lugar de base de conocimiento estática
- [x] El agente incluye fuentes de documentos en respuestas cuando usa RAG

### Calidad Sprint 6
- [x] 0 errores TypeScript
- [x] Tests para intelligence.ts, knowledge.ts, rag.ts, commercial-learning.ts, predictive.ts
- [x] Todos los tests anteriores continúan pasando
- [x] Checkpoint Git generado

## Sprint 7 — Operación Comercial Real

### Módulo 1: Carga Masiva RAG (/admin/knowledge/batch)
- [x] tRPC procedure `knowledge.batchUpload`: acepta array de archivos base64 con metadatos, procesa en secuencia, retorna progreso
- [x] tRPC procedure `knowledge.getBatchStatus(batchId)`: retorna estado de cada archivo (pending/processing/done/error)
- [x] Tabla `knowledge_batch_jobs`: id, status, totalFiles, processedFiles, errors, createdAt, completedAt
- [x] Página AdminKnowledgeBatch.tsx (/admin/knowledge/batch): drag & drop múltiple, barra de progreso por archivo, log en tiempo real
- [x] Soporte para ZIP con múltiples documentos (extrae y procesa cada archivo internamente)
- [x] Categorías predefinidas: Panduit, HID, Genetec, APC, Cisco, Zebra, Hikvision, Avigilon, Casos de Éxito, Propuestas

### Módulo 2: Plantillas de Campañas con UTMs (/admin/campaigns)
- [x] Tabla `utm_campaigns`: id, name, source, medium, campaign, term, content, url, shortUrl, clicks, leads, conversions, revenue, createdAt
- [x] tRPC procedure `campaigns.create`: genera URL con UTM + shortlink
- [x] tRPC procedure `campaigns.list`: lista campañas con métricas
- [x] tRPC procedure `campaigns.getStats(campaignId)`: retorna clicks, leads, conversiones, CPL, ROI
- [x] Captura automática de UTMs en leads.create (leer de sessionStorage en frontend)
- [x] Página AdminCampaigns.tsx (/admin/campaigns): tabla de campañas, generador de URLs, métricas por campaña
- [x] Plantillas predefinidas: Google Ads, LinkedIn, Meta, Email, Referidos
- [x] Gráfica de conversión por canal (barras)

### Módulo 3: Simulador de Lead Completo (/admin/simulator)
- [x] tRPC procedure `simulator.runScenario(scenario)`: ejecuta flujo completo de un lead ficticio
- [x] Escenarios predefinidos: "Lead frío PYME", "Lead caliente Enterprise", "Lead perdido", "Lead reactivado"
- [x] El simulador ejecuta: crear lead → conversación IA → score → asignar vendedor → agendar reunión → enviar propuesta → cambiar estado
- [x] Retorna log paso a paso con tiempo, acción, resultado y score en cada etapa
- [x] Página AdminSimulator.tsx (/admin/simulator): selector de escenario, botón "Ejecutar", log animado en tiempo real
- [x] Opción "Limpiar datos del simulador" para eliminar leads/conversaciones de prueba
- [x] Exportar log del simulador como PDF

### Módulo 4: QA del Agente — Escenarios de Prueba (/admin/agent/qa)
- [x] Tabla `agent_qa_tests`: id, name, scenario, userMessage, expectedIntent, expectedTools, actualTools, passed, score, createdAt
- [x] tRPC procedure `agentQA.runTest(testId)`: ejecuta el mensaje de prueba contra el agente y compara con expected
- [x] tRPC procedure `agentQA.runSuite`: ejecuta todos los tests y retorna resumen de pass/fail
- [x] tRPC procedure `agentQA.listTests`: lista tests con último resultado
- [x] Tests predefinidos: "Saludo inicial", "Pregunta de precio", "Solicitud de reunión", "Consulta técnica CCTV", "Lead calificado", "Lead no calificado"
- [x] Página AdminAgentQA.tsx (/admin/agent/qa): lista de tests, botón "Ejecutar suite", resultado por test con diff de herramientas esperadas vs reales
- [x] Score de calidad del agente: % de tests pasados en la última ejecución

### Módulo 5: Monitor de Errores y Health (/admin/health)
- [x] Tabla `system_health_logs`: id, service, status (ok/warn/error), latencyMs, message, checkedAt
- [x] tRPC procedure `health.getStatus`: verifica DB, LLM, RAG, email, storage, heartbeats en paralelo
- [x] tRPC procedure `health.getLogs(service?, limit)`: retorna historial de checks
- [x] tRPC procedure `health.getErrorSummary`: agrupa errores por servicio en las últimas 24h
- [x] Heartbeat de health check cada 5 minutos (manus-heartbeat)
- [x] Página AdminHealth.tsx (/admin/health): semáforos por servicio, latencia, uptime %, últimos errores, log de eventos
- [x] Alerta al owner si algún servicio falla más de 3 veces en 15 minutos

### Módulo 6: Roles y Permisos Avanzados
- [x] Extender enum `role` en tabla `users`: admin | manager | viewer | agent (SDR)
- [x] Migración SQL para actualizar el enum
- [x] Middleware `requireRole(roles[])` en tRPC para verificar roles permitidos
- [x] Tabla `role_permissions`: role, resource, action (read/write/delete)
- [x] tRPC procedure `admin.listUsers`: lista usuarios con rol
- [x] tRPC procedure `admin.updateUserRole(userId, role)`: cambia rol de usuario
- [x] Página AdminUsers.tsx (/admin/users): tabla de usuarios, selector de rol inline
- [x] Proteger rutas sensibles: /admin/intelligence (manager+), /admin/knowledge (manager+), /admin/health (admin only)

### Módulo 7: Exportación de Reportes Ejecutivos PDF
- [x] tRPC procedure `reports.generateExecutive(period)`: genera reporte ejecutivo del período (semana/mes/trimestre)
- [x] Contenido del reporte: portada IAMET, resumen ejecutivo, métricas clave, embudo, top leads, top verticales, ROI por canal, forecast, recomendaciones
- [x] Usar jsPDF en el cliente para generar el PDF con estilo IAMET (azul oscuro + cian)
- [x] tRPC procedure `reports.generateLeadReport(leadId)`: ficha completa de un lead con timeline, score, conversaciones, propuestas
- [x] Botón "Exportar PDF" en AdminIntelligence.tsx (reporte mensual)
- [x] Botón "Exportar ficha" en AdminCRM.tsx por cada lead

### Calidad Sprint 7
- [x] 0 errores TypeScript
- [x] Tests para simulator, campaigns, health, agentQA
- [x] Todos los tests anteriores continúan pasando (43+)
- [x] Checkpoint Git generado

## Autenticación Local VPS Standalone

### BD y Migración
- [x] Migración SQL: agregar columnas `passwordHash`, `status`, `lastLoginAt` a tabla `users`
- [x] Migración SQL: extender enum `role` con `manager`, `viewer` (si no existe)
- [x] Actualizar `drizzle/schema.ts`: agregar campos passwordHash, status, lastLoginAt al pgTable users
- [x] Actualizar `drizzle/schema.ts`: extender roleEnum con manager/viewer

### Backend — Endpoints REST
- [x] Instalar bcryptjs + @types/bcryptjs
- [x] Crear `server/local-auth.ts`: helpers hashPassword, verifyPassword, signJWT, verifyJWT
- [x] Crear `server/_core/local-auth-router.ts`: endpoints POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, POST /api/auth/create-admin
- [x] Rate limit específico en POST /api/auth/login (máx 10 req/15min por IP)
- [x] Mensaje genérico "Credenciales inválidas" — nunca revelar si email existe
- [x] No exponer passwordHash en ninguna respuesta
- [x] JWT firmado con JWT_SECRET, cookie HttpOnly + SameSite=Lax + Secure en producción
- [x] Expiración JWT configurable (default 7 días)
- [x] Registrar lastLoginAt al hacer login exitoso
- [x] Montar router en `server/_core/index.ts` bajo /api/auth

### Script de Admin Inicial
- [x] Crear `scripts/create-admin-user.mjs` (ES module)
- [x] Uso: `ADMIN_EMAIL=admin@iamet.mx ADMIN_PASSWORD='...' ADMIN_NAME='...' node scripts/create-admin-user.mjs`
- [x] El script verifica si ya existe un admin antes de crear
- [x] Hashea contraseña con bcrypt antes de insertar
- [x] Imprime resultado con email y rol asignado

### Frontend
- [x] Actualizar `client/src/_core/hooks/useAuth.ts`: intentar primero GET /api/auth/me (auth local), luego Manus OAuth como fallback
- [x] Crear `client/src/pages/Login.tsx`: formulario email + password, validación, error genérico, redirect a /admin tras login
- [x] Crear `client/src/pages/AdminLogin.tsx`: versión admin del login con branding IAMET
- [x] Registrar rutas /login y /admin/login en App.tsx
- [x] Guard en rutas /admin/*: si no hay sesión local, redirigir a /admin/login (no a Manus OAuth)
- [x] Botón "Cerrar sesión" llama POST /api/auth/logout y limpia cookie

### Calidad
- [x] TypeScript 0 errores
- [x] Tests: login exitoso, login fallido, logout, me autenticado, me sin sesión, create-admin
- [x] Todos los tests anteriores continúan pasando (43+)
- [x] Checkpoint Git generado

## Hotfix Staging — Paridad VPS (2026-07-01)

- [x] Eliminar `getLoginUrl()` de const.ts o redirigir a /admin/login
- [x] useAuth: quitar toda lógica de redirección a manus.im/app-auth
- [x] main.tsx: eliminar ManusAuthProvider o hacerlo no-op en modo local
- [x] Login.tsx: eliminar botón "Continuar con Manus"
- [x] AdminLogin.tsx: asegurar que nunca redirige a Manus OAuth
- [x] DashboardLayout.tsx: eliminar redirección a getLoginUrl() si no hay sesión
- [x] Navbar.tsx: sidebar público muestra menú completo igual que Manus
- [x] Navbar.tsx: sidebar admin muestra los 15 módulos admin cuando hay sesión
- [x] Dockerfile: agregar `COPY --from=builder /app/scripts ./scripts`
- [x] TypeScript 0 errores
- [x] 63+ tests pasando
- [x] Checkpoint Git generado

## Rediseño Sidebar — Limpio y Espacioso (2026-07-02)

- [x] Sidebar público: solo Home + secciones principales (Soluciones, Industrias, Tech Advisor, Academy, Tienda, Contacto) + controles (idioma, tema)
- [x] Botón "Iniciar sesión" prominente en la parte inferior del sidebar público (no-auth)
- [x] Sidebar admin: módulos agrupados en secciones colapsables (Operación, Inteligencia, Conocimiento, Herramientas)
- [x] Más espacio entre ítems, separadores visuales entre grupos
- [x] Versión mobile: mismo rediseño en el drawer lateral
- [x] TypeScript 0 errores
- [x] Checkpoint guardado
