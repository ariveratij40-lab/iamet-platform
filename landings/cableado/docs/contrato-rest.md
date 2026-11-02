# Contrato de captura propuesto y preparado localmente

Estado: implementación en copia aislada, no instalada en el VPS. Repositorio verificado: ariveratij40-lab/iamet-platform, rama feature/iamet-v2, commit 2add1ca. Backend Node.js/TypeScript, Express 4, tRPC 11, Drizzle y postgres-js. El código conserva una vía MySQL heredada; la nueva captura exige PostgreSQL y CRM_ENGINE=v2.

## Solicitud

`POST /api/leads`, JSON, máximo 16 KiB. Cabecera `Idempotency-Key`: UUID generado por el navegador. `Origin` debe coincidir exactamente con LANDING_ALLOWED_ORIGINS. Sin cuenta ni cookies. Solo mismo origen a través de Nginx; no se habilita CORS general para esta ruta.

| Campo | Validación | Destino |
|---|---|---|
| contactName | 2–128 caracteres | leads.contactName |
| company | 2–256 caracteres | leads.company |
| email | formato válido, hasta 320 | leads.email |
| phone | opcional, hasta 32 | leads.phone |
| problemDescription | 10–3000; ciudad y alcance | leads.problemDescription |
| service | cableado-fibra | registro de recepción |
| landing | cableado-tijuana | registro de recepción |
| brand | IAMET | registro de recepción |
| website | vacío; señuelo antispam | no se guarda |
| attribution | opcional; campos permitidos de hasta 255 | columnas UTM e identificadores existentes |

El servidor fija source=form, verticalSlug=cableado, landingUrl=https://cableadoestructurado.iamet.mx/ y firstPage=/. No confía en una URL ni un usuario enviado por el cliente. `firstPage` refleja la página de esta captura, no una atribución histórica de primera visita. La política de primera visita versus conversión requiere definición antes del lanzamiento. Actualmente se leen los parámetros de la URL de conversión solo cuando `window.iametAnalyticsConsent === true`; sin consentimiento no se guardan identificadores publicitarios ni se impide cotizar.

## Persistencia y respuesta

El módulo `server/landing-capture.ts` utiliza `getDb()` y una transacción del mismo PostgreSQL del CRM. Un bloqueo transaccional por clave serializa reintentos concurrentes. Si la clave existe, verifica el hash del contenido y devuelve la misma referencia. Para una solicitud nueva llama a `captureCrmV2Lead(data, tx)` y guarda la recepción antes del commit.

La función existente acepta ahora una transacción opcional; el resto de sus llamadas conserva su comportamiento. El CRM sigue consultando `leads`, sin cambiar su interfaz. La migración aditiva `deployment/vps-v2/landing-capture.sql` crea una tabla técnica de referencias en la misma base; no crea otra base ni otro CRM. No se ha aplicado fuera de las pruebas locales.

- 201: nueva solicitud guardada; `{"status":"saved","receipt":"UUID opaco"}`.
- 200: reintento idéntico ya guardado; misma respuesta.
- 400/422: JSON o campos inválidos; recepción rechazada.
- 403: origen no permitido.
- 409: misma clave con datos distintos; no crea otro lead.
- 413: cuerpo excedido.
- 429: límite de 10 intentos por IP en 15 minutos.
- 503: función deshabilitada, motor incorrecto o almacenamiento no disponible. Un corte de red o error de servidor se trata como recepción incierta desde el navegador.

La referencia solo sale tras completar la transacción. Los reintentos conservan clave y contenido. El navegador guarda únicamente clave pendiente y última referencia medida en sessionStorage; no persiste datos de contacto. Después de recargar, debe volver a introducirse el mismo contenido para resolver una recepción incierta; un cambio provoca 409, sin duplicar. Falta diseñar recuperación asistida de solicitudes inciertas para una experiencia más completa.

## Medición y operación

`lead_captured` es el único evento de captura confirmada de esta landing. Solo se añade a dataLayer tras 200/201 con status=saved y una referencia válida, cuando el consentimiento analítico está concedido. La ausencia de consentimiento no cambia el guardado ni el agradecimiento. No se cargan etiquetas externas. El adaptador al gestor de consentimiento y GTM sigue pendiente; no se declara medición publicitaria operativa.

Se deduplica por referencia en la página y sesión. No hay conversión por visita, recarga o URL de agradecimiento. No se envían datos personales al evento. `click_whatsapp` es secundario. El antiguo `lead_created` encontrado en el timeline del backend heredado no se usa como conversión ni se activa por esta nueva ruta; se conserva sin modificar el CRM existente.

CRM v2 guarda estado new sin scoring, correos ni recordatorios heredados. Asignación de responsable, cola formal y notificación deben definirse e implementarse conforme al flujo aprobado; no se simulan. No se enviaron correos de prueba.

## Pendiente antes de integrar en pruebas

Validar contrato y migración con el responsable del CRM; confirmar CRM_ENGINE=v2 y PostgreSQL en la instalación vigente; aplicar la migración en pruebas autorizadas; configurar origen y proxy; verificar límites y número real de proxies; completar responsable, notificaciones y privacidad; ejecutar el recorrido de navegador a CRM real. No activar LANDING_CAPTURE_ENABLED por la sola existencia de estos archivos.
