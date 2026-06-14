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
