# Visitor assistant

Public widget: VisitorAssistantV2, mounted by the public application shell. It appears on home, about, service, brand, blog, quote and contact pages. It does not mount in login, account, warranty or administrator areas. The launcher invites visitors to ask; the panel opens only on request. It supports quick suggestions, typed messages, Escape to close, a fresh-conversation button and contextual actions. Browser messages remain in component memory. Accepted server exchanges are now stored privately for the CRM.

Verified profile: shared/iamet-profile.ts is used by corporate pages and the assistant. shared/visitor-assistant.ts provides approved service, brand and coverage guidance and builds the generative system instructions. Do not add unverified experience, response-time, warranty, pricing or certification claims.

API: visitorAssistant.chat accepts the latest eight user/assistant turns, up to 2,000 characters each. System messages are rejected by the input schema. A procedure-level per-IP limit of 12 calls/minute also covers batched tRPC calls. No tools or account access are granted to the model. The server stores the actual last question and generated reply in dedicated transcript tables. Action links come from the approved catalog, never model-generated URLs. Model replies render as plain text.

AI uses the existing server LLM_API_URL, LLM_API_KEY and LLM_MODEL settings (legacy Forge fallback remains available through the shared LLM adapter). Requests carry a 12-second abort signal and a 450-token reply budget. Validate the configured provider/model in staging before rollout; implementation tests mock the provider, rather than making a paid live call. No credentials have been configured or exposed by this change.

If the server has no model key or the model fails, it returns mode=guide with deterministic approved guidance. The browser uses the same clearly labeled guide if the API cannot be reached (including Vite-only local previews). The guide is a service orientation fallback, not a substitute for generative conversation. The UI distinguishes guide mode from AI responses.

Quote links include origen=asistente and the service slug when detected. QuoteV2 then submits LeadForm with source=agent. Contact details are collected on the existing quote form and remain subject to that form's CRM/backend setup; the chat does not create leads or send messages to IAMET staff on its own. Warranty requests route to /garantias and the authenticated customer flow.

Validation: pnpm check; pnpm exec vitest run server/visitor-assistant.test.ts server/warranty.test.ts; pnpm build. Browser verification covers guide fallback, contextual service-to-quote routing, mobile panel bounds, Escape, and exclusion from the private portal. No VPS deployment was performed.

## Invitación discreta

El botón utiliza el símbolo de procesador IAMET. Tras 20 segundos en una página pública se muestra una invitación adaptada a la solución, sin abrir el chat ni mover el foco. Se muestra una sola vez por sesión de pestaña; abrir el asistente o descartar el saludo también suprime futuras invitaciones. Se usa sessionStorage con respaldo en memoria si el navegador bloquea el almacenamiento. La conversación no se guarda en el navegador; los intercambios aceptados por el servidor sí se registran en el CRM. El brillo respeta la preferencia de movimiento reducido.

## CRM de conversaciones

El tablero integrado en /admin/crm requiere rol admin tanto para estadísticas como para detalles. Incluye periodos de 7/30/90 días, paginación de 20 conversaciones, soluciones consultadas y actividad diaria UTC. Las cifras cuentan intercambios registrados y conversaciones activas en el periodo; no cuentan visitantes únicos ni conversiones. El detalle muestra el historial completo de la conversación seleccionada. No se reconstruyen conversaciones anteriores a esta implementación.

Aplicar drizzle/0006_assistant-conversations.sql en staging antes de validar y después promover a producción. No se aplicó en los VPS. Si no hay base de datos o la migración falta, el chat sigue respondiendo y avisa que la respuesta no se guardó; esos intercambios no aparecen en estadísticas. El modo de vista previa sin API tampoco guarda conversaciones.

Cada conversación usa una capacidad aleatoria que solo vive en memoria del cliente, con hash en la base. La API pública solo permite añadir el nuevo intercambio con esa capacidad; no permite leer transcripciones. El servidor nunca persiste como historial los turnos previos enviados por el navegador. No se guardan IP ni datos de cuenta en estas tablas. El texto puede contener datos que el visitante escriba voluntariamente: se muestra un aviso antes del envío y se recomienda no compartir datos sensibles. Acordar retención y actualizar el aviso de privacidad antes del despliegue público; no hay borrado automático configurado.

Validación adicional: server/assistant-history.test.ts usa PostgreSQL local con PGlite para comprobar persistencia, capacidad de conversación, estadísticas, periodos, paginación y restricciones de acceso.
