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

- [ ] Campo `specs` (JSON) en tabla `store_products` para especificaciones técnicas
- [ ] Migración Drizzle y actualización del seed con specs por producto
- [ ] tRPC procedure `store.getProductBySlug`: retorna producto con specs + relacionados
- [ ] Página `/tienda/:slug`: hero con imagen grande, nombre, categoría, precio de referencia
- [ ] Sección de especificaciones técnicas en tabla (clave/valor desde JSON)
- [ ] Sección de productos relacionados (misma categoría, máx 4)
- [ ] Botón "Agregar a cotización" directo (abre drawer del carrito)
- [ ] Breadcrumb: Inicio > Tienda > Categoría > Producto
- [ ] Ruta /tienda/:slug registrada en App.tsx
- [ ] Tarjetas de Tienda.tsx navegan al detalle al hacer clic en imagen/nombre

## PDF de Solicitud de Cotización

- [x] Instalar jsPDF en el cliente para generación de PDF en el navegador
- [x] Función `downloadQuotePdf(snapshot)` en el frontend con tipo `QuoteSnapshot`
- [x] PDF incluye: header IAMET con color cian, número de referencia, fecha, datos de contacto, tabla de productos con SKU/cantidad/precio, total referencial, nota de validez y footer
- [x] Botón "Descargar resumen en PDF" en la pantalla de confirmación de Tienda.tsx
