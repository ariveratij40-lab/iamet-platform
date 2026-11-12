# Confirmaciones IAMET

HTML de la vista aprobada, logo PNG público y alternativa de texto. Se aplica a las confirmaciones de clientes de todos los leads capturados por formularios del sitio (source=form, desde lead 9) y las landings con comprobante. Se mantiene el aviso interno, con la misma referencia nueva.

Referencia: EMPRESA-SOLUCION-ID. Empresa normalizada sin acentos y hasta 32 caracteres; solución según landing/vertical; ID global del lead, relleno a cinco dígitos, sin truncar si supera 99999. El ID puede tener saltos por transacciones; no se reinicia por cliente. No es una credencial de acceso. Se congela en payload al crear el aviso, igual que su contenido.

Solo Recibida aparece completada. Las etapas siguientes son una guía, no un seguimiento automático. No se reenvían ni modifican payloads existentes. No cambia la captura ni la transferencia manual al CRM.

El instalador incluye la corrección previa de formularios si falta, preserva las plantillas de landings existentes y respalda el worker instalado. Reinicia solo el worker. Reversión automática ante error de validación o arranque; conservar estados accepted para evitar duplicados. No modifica Compose, secretos, base ni sitio.

La activación requiere sudo en IONOS. Revisar recepción real en el próximo envío; la aceptación de Resend no certifica bandeja principal. El diseño no garantiza evitar Spam. DNS/remitente no se modifican en este cambio.
