# Preparación Docker y Nginx

No se accedió ni se escribió en /opt/apps/iamet/v2-staging. La instalación de pruebas indicada por IAMET sigue intacta. No se conocen aún el DNS efectivo, la red Docker, el nombre de servicio del backend ni el dominio final de API/CRM.

## Contenedor local

`docker compose build` compila Astro con Node 24 y copia dist a Nginx. `docker compose up -d` serviría exclusivamente en 127.0.0.1:4322. Estos comandos no se ejecutaron porque el servicio Docker está apagado. `docker compose config --quiet` sí validó la sintaxis.

El archivo por defecto mantiene noindex, CSP, formulario deshabilitado y /api/ con respuesta 503. No contiene credenciales ni conexiones directas a PostgreSQL. No requiere Node en ejecución después de compilar.

## Integración futura con pruebas

1. Revisar cambios de la copia aislada contra la rama remota vigente. Confirmar versión desplegada en el VPS, sin sustituir el sitio ni el CRM.
2. Respaldar PostgreSQL y validar restauración. Aplicar la migración aditiva de referencias solo después de revisión y autorización del despliegue.
3. Configurar en el backend LANDING_CAPTURE_ENABLED=true, CRM_ENGINE=v2 y LANDING_ALLOWED_ORIGINS con el origen exacto de pruebas. PostgreSQL conserva sus credenciales existentes únicamente en el servidor.
4. Preparar una imagen inmutable con etiqueta de versión; fijar digest de imágenes base en la liberación. Configurar PUBLIC_CAPTURE_ENABLED, PUBLIC_LEAD_ENDPOINT y PUBLIC_PRIVACY_URL al compilar, pues el resultado es estático.
5. Conectar Nginx a la red privada verificada del backend. Sustituir el bloque /api/ de vista previa por `api-location.conf.example`, reemplazando el nombre de servicio ilustrativo. No publicar el puerto del backend.
6. Revisar la cadena real de proxies y TRUST_PROXY_HOPS: la configuración actual presupone un proxy; añadir un Nginx adicional podría cambiar ese número. No copiar valores sin comprobarlos.
7. Añadir el virtual host exclusivo para cableadoestructurado.iamet.mx y HTTPS en el proxy de entrada real. Verificar DNS, certificado y destino antes de modificarlo. No reemplazar virtual hosts corporativos.
8. Validar desde el navegador una captura, su presencia en CRM, reintento, fallo, duplicado, permisos, consentimiento y evento. Confirmar responsables de atención.

## Producción y reversión

La configuración entregada es deliberadamente de pruebas. Antes de una publicación autorizada, revisar noindex en HTML, robots.txt y X-Robots-Tag del proxy; validar HTTPS, canonical y acceso de rastreadores del destino público. No retirar controles de staging.

Registrar imagen, commit, variables no secretas y respaldo. Para revertir, deshabilitar nueva captura y restaurar la imagen/configuración anterior de la landing y backend. Conservar leads y referencias ya guardados; no borrar la tabla ni la base como parte de la reversión. El frontend trata un 503 como falta de confirmación y nunca inventa una captura.

Pendientes: arranque y build Docker real, nginx -t dentro del contenedor, versiones base/digests, red y upstream efectivos, política de logs, TLS, respaldos, supervisión, rate limit compartido si hay más de una réplica, retención y recuperación. Las imágenes oficiales `node:24-alpine` y `nginx:stable-alpine` son bases propuestas, no una verificación del VPS.
