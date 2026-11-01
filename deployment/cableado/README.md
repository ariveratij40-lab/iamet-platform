# Landing de cableado en subdominio

URL solicitada: https://cableado.iamet.mx/ . El logo y «Conocer IAMET» llevan al sitio corporativo https://iamet.mx/ . El subdominio muestra directamente la landing en la raíz; no requiere otro repositorio ni una base nueva.

## Primera activación en el VPS de pruebas

Esta configuración utiliza `iamet_v2_app_staging` y su CRM existente. Conserva `noindex` y no cambia el dominio corporativo ni el vhost de staging. Antes de campañas públicas debe acordarse la separación/operación de producción y completar privacidad y medición. No se considera una migración al VPS final.

1. En el proveedor DNS de iamet.mx, crear registro A: nombre `cableado`, valor `108.175.9.162`. Eliminar o corregir cualquier AAAA de ese nombre que apunte a otro servidor. Si hay proxy/CDN, validar su configuración antes de continuar; el script verifica resolución directa al VPS.
2. Actualizar la aplicación con el flujo normal, preservando la base:

```bash
cd /opt/apps/iamet/v2-staging
git pull --ff-only origin feature/iamet-v2
bash deployment/vps-v2/update.sh
bash deployment/cableado/activate.sh
```

3. Certbot puede pedir correo y aceptación de sus condiciones. El operador completa ese paso. Se usa HTTP-01 por el puerto 80 ya publicado por global_nginx.
4. Abrir el subdominio, enviar una solicitud de prueba y localizarla en https://staging.iamet.mx/admin/crm. Revisar además WhatsApp, errores, agradecimiento y metadatos.

El script respalda únicamente `31-iamet-cableado.conf`, valida Nginx, obtiene certificado propio y revierte ese archivo ante errores. Los otros sitios y las bases se conservan. No imprime secretos ni usa el certificado de staging para el nuevo dominio.

## Renovación y operación

Instalar el temporizador específico con `bash deployment/cableado/install-renewal.sh`. Verificar la fecha de expiración y el estado de ese temporizador después de activar el dominio. Una renovación manual utiliza `bash deployment/cableado/renew-certificate.sh` con sudo. Cambios de código siguen el flujo de update.sh y recarga del proxy, sin reinstalar datos.

Los accesos al CRM y a cuentas siguen en staging; no se comparten cookies entre los subdominios. Los visitantes pueden cotizar sin registro. Las rutas corporativas ajenas a la campaña redirigen a iamet.mx.
