# Revisión manual de solicitudes

El mini CRM recibe solicitudes y permite revisarlas antes del alta manual en el CRM de la empresa.

Estados: Nuevo → Por completar / Calificado / Descartado. Solo un lead previamente guardado como Calificado puede marcarse Transferido. Para calificar se confirman contacto, necesidad, servicio y cobertura. Presupuesto no es un criterio obligatorio. Por completar y Descartado exigen motivo. Transferido exige referencia del registro empresarial y queda bloqueado para evitar duplicaciones; el seguimiento posterior ocurre en el CRM de la empresa.

La transferencia no envía datos: el administrador primero da de alta el prospecto en el CRM empresarial y luego registra aquí su referencia. Una sincronización histórica se muestra como advertencia de posible duplicado. Las funciones de sincronización automática y reintento están desactivadas centralmente, aun con credenciales presentes. IA ofrece sugerencias, nunca decide el estado manual.

La lista muestra todas las fechas por defecto para no ocultar pendientes antiguos. Los estados comerciales y notas anteriores permanecen intactos. Cada revisión guarda actor, fecha, versión y contenido. Escrituras concurrentes se rechazan en lugar de perder cambios. Solo administradores tienen acceso.

## Despliegue

1. Partir de a79de06 (incluye integración combinada, captura y recuperación).
2. Respaldo actualizado de base, Compose e imagen vigente.
3. Aplicar deployment/vps-v2/lead-reviews.sql con ON_ERROR_STOP. Es aditiva e idempotente; no reclasifica registros históricos ni modifica leads.
4. Construir imagen identificada por commit y actualizar solo app. No recrear base, Redis, landing o worker de correo.
5. Comprobar salud, autenticación, captura y revisión con sesión administrativa. Validar primero en base temporal.

Rollback: volver al Compose/imagen anterior; conservar las tablas nuevas y sus registros. No restaurar un respaldo viejo sobre solicitudes recibidas después del despliegue. No eliminar tablas durante una reversión.
