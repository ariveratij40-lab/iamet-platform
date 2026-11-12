# Confirmación de formularios del sitio principal

Incidente confirmado: lead 9 (RFID, 12 nov 2026) guardado sin avisos porque el worker solo seleccionaba landing_capture_receipts.

Esta corrección amplía el selector a source=form e id>=9. Crea ambos avisos usando la misma cola persistente y UNIQUE(lead_id,kind), sin reenviar los leads históricos 1, 2, 4 y 5. Mantiene el procesamiento de todas las landings con comprobante. No modifica el registro, la precalificación ni la transferencia manual al CRM empresarial.

Los mensajes del sitio principal tienen plantilla propia, referencia IAMET-id y respuesta dirigida a IAMET. La plantilla previa de las landings y los payloads de avisos existentes no se alteran. Se preservan reintentos, claves de idempotencia y la revisión manual tras errores.

patch-worker.py prepara una copia del worker instalado, conservando extensiones recientes de otras landings. Se detiene si los puntos de integración cambiaron o la corrección ya existe. deploy.sh verifica el incidente y el montaje, respalda el archivo y reinicia solo iamet_cableado_mail. No requiere migración, rebuild de imagen ni reinicio del sitio. Si se revierte, conservar la cola y sus estados accepted para evitar duplicar envíos.

Pruebas: mensajes RFID/genérico, selección SQL con base temporal, exclusión histórica, deduplicación y compatibilidad con worker original y extendido.
