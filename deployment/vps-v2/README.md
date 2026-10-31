# Reemplazo de IAMET en el VPS de pruebas

Destino: https://staging.iamet.mx/ · VPS 108.175.9.162 · usuario alvaro.

## Qué reemplaza y qué conserva

La nueva versión se instala en **/opt/apps/iamet/v2-staging** desde feature/iamet-v2. El dominio pasa a servir esa versión. La carpeta anterior /opt/apps/iamet/staging y sus modificaciones (incluido crm-sync), contenedores y volúmenes permanecen disponibles como respaldo operativo; no se mezclan con el código nuevo ni se borran. No se ejecuta git pull/reset en la carpeta antigua. No se reinician ni modifican SKIA, BAJANET, KAIROS, POLISYS u otros proyectos. Solo se sustituye el archivo Nginx 30-iamet-staging.conf y se recarga el proxy compartido después de validarlo.

Nuevo stack: Node 22, PostgreSQL 16, Redis 7 y Docker Compose, conectado al global_nginx existente mediante infra_network. PostgreSQL/Redis tienen una red privada propia y no publican puertos al servidor. Los nombres son iamet_v2_app_staging, iamet_v2_db_staging e iamet_v2_redis_staging; los volúmenes nuevos son iamet_v2_pg_staging e iamet_v2_redis_staging.

El CRM se construye de nuevo: pantalla y API crmV2 propias para resumen comercial, prospectos, filtros, fichas, notas y etapas del embudo, además del tablero nuevo de conversaciones. No utiliza el pipeline visual antiguo, scores automáticos, briefings ni sincronizador anterior. Con CRM_ENGINE=v2, los formularios guardan prospectos por la ruta nueva, sin activar scoring, avisos ni seguimientos heredados.

La base **iamet_v2_staging** empieza vacía: el esquema actual de 38 tablas, columnas de acceso local, siete verticales de servicio y la cuenta **alvaro.rivera@iamet.mx**. No se importan cuentas, leads, tickets, pedidos, cursos, productos o conversaciones antiguos. Tampoco se generan ingenieros ni horarios ficticios de demostración. El script pide una contraseña nueva y su confirmación (mínimo 16 caracteres), sin mostrarla ni guardarla en archivos. No hay una contraseña predeterminada. La inicialización rechaza bases que ya tengan tablas.

## Instalación desde Termius

Se requiere Docker Compose v2 con `up --wait`, Python 3, curl, git y permiso sudo. Se necesita espacio para una imagen nueva, volumen nuevo y respaldos del sitio y base anterior. La compilación ocurre con la versión anterior todavía en servicio. No ejecute docker compose down -v, docker system prune ni borre los volúmenes antiguos.

Primero revise recursos y reserve las carpetas:

```bash
free -h
df -h /opt
docker compose version
sudo install -d -m 755 -o alvaro -g "$(id -gn alvaro)" /opt/apps/iamet/v2-staging
sudo install -d -m 700 -o alvaro -g "$(id -gn alvaro)" /opt/apps/iamet/backups
```

Descargue el repositorio con el mismo origen configurado en la instalación anterior. La carpeta destino debe estar vacía; git clone se detiene si ya contiene archivos.

```bash
git clone --single-branch --branch feature/iamet-v2 -- \
  "$(git -C /opt/apps/iamet/staging remote get-url origin)" \
  /opt/apps/iamet/v2-staging
cd /opt/apps/iamet/v2-staging
bash deployment/vps-v2/deploy.sh
```

El script realiza estos pasos en orden:

1. Comprueba rutas, red y contenedores existentes; impide reutilizar accidentalmente volúmenes v2 existentes.
2. Crea respaldo privado con código y archivos locales (incluido .env), diff, commit, metadatos del contenedor y pg_dump. Verifica que el archivo de restauración sea legible por pg_restore.
3. Genera secretos nuevos para PostgreSQL, Redis y JWT en deployment/vps-v2/.env.v2, con permisos 600. No imprime secretos. Solo conserva las opciones existentes de Resend, LLM y R2 de una lista explícita; no copia credenciales de base, Redis, JWT, OAuth ni Forge del sitio anterior. Si falta proveedor LLM, el asistente trabaja en modo guía y sí registra sus intercambios cuando el servidor está disponible. Verificar correo/IA con sus proveedores es una aceptación posterior al despliegue.
4. Construye una imagen etiquetada con el commit actual y solicita la nueva contraseña administrativa.
5. Arranca infraestructura aislada, inicializa la base y arranca la aplicación con controles de salud.
6. Comprueba login real, cookie local, permisos del CRM comercial nuevo, tablero del asistente y rutas públicas. El proveedor IA no se invoca en esta comprobación.
7. Comprueba comunicación Nginx→aplicación, genera el vhost desde el respaldo que ya funcionaba (conservando sus rutas y opciones TLS), cambia el upstream, valida y recarga Nginx.
8. Verifica HTTPS y que /api/health entregue el identificador de la versión nueva; si falla el cambio, restaura el vhost anterior automáticamente.

El script se detiene ante errores; no ignora migraciones fallidas. Si se detiene antes del cambio de Nginx, el sitio antiguo sigue siendo el público. Después de crear contenedores/volúmenes v2, **no repita la instalación a ciegas ni elimine datos**: comparta la última etapa y el error para continuar desde ese punto. El archivo .env.v2 conserva las credenciales necesarias para recuperar esa ejecución.

La versión v2 **sustituye** al comportamiento antiguo de crm-sync; el código de ese sincronizador se respalda pero no se incorpora automáticamente porque sus cambios no están en el repositorio. Si esa integración sigue siendo necesaria, revisarla y añadirla como tarea separada con el nuevo esquema.

## Acceso y aceptación

- https://staging.iamet.mx/admin/login con alvaro.rivera@iamet.mx y la nueva contraseña.
- https://staging.iamet.mx/admin/crm incluye estadísticas e historial del asistente.
- Abra el asistente en otra pestaña pública, envíe una consulta y pulse Actualizar en el tablero. Debe aparecer una conversación con pregunta y respuesta. Este es el inicio del nuevo historial.
- Haga una cotización de prueba, compruebe que aparece como lead y pruebe cerrar/iniciar sesión. Verifique después correo de registro, portal de garantías y entrega real del proveedor IA si sus claves están configuradas.
- Staging lleva X-Robots-Tag noindex para que esta instalación de pruebas no compita con el dominio de producción. Antes de campañas reales hay que preparar el dominio final, indexación, medición y aviso de privacidad.

La prueba interna no envía correos, no llama al proveedor IA y no crea pedidos o tickets ficticios. Una base nueva no incluye productos, cursos ni datos comerciales anteriores.

## Volver al sitio anterior

```bash
cd /opt/apps/iamet/v2-staging
bash deployment/vps-v2/rollback.sh
```

Restaura la configuración Nginx anterior y comprueba que la aplicación antigua siga accesible. No borra la base nueva ni el historial capturado desde el cambio. Se perderá la visibilidad pública de los datos nuevos al volver atrás, pero los datos siguen conservados en el volumen v2. La reversión no copia registros entre bases.

Para administrar v2 después de la instalación:

```bash
cd /opt/apps/iamet/v2-staging
export RELEASE_ID="$(cat deployment/vps-v2/release-id)"
docker compose --env-file deployment/vps-v2/.env.v2 \
  -f deployment/vps-v2/compose.yml ps
```

Los respaldos están en /opt/apps/iamet/backups/pre-v2-FECHA. Contienen datos privados y secretos: no subirlos a GitHub ni compartirlos en el chat. Conservar la instalación anterior hasta finalizar la aceptación. Definir después una política de respaldo diario de la nueva base y retención de conversaciones antes de uso público continuo.

## Renovación del certificado

Tras comprobar el despliegue, instalar el temporizador para este dominio (no renueva los de otros sitios):

```bash
cd /opt/apps/iamet/v2-staging
bash deployment/vps-v2/install-renewal.sh
```

Se ejecuta dos veces al día con un retraso aleatorio. Solo recarga Nginx cuando cambia el certificado. No detiene el proxy. Consultar errores con `sudo journalctl -u iamet-staging-certificate.service --no-pager -n 40`. Antes de instalarlo, revisar si el administrador ya tiene otro trabajo de renovación para no duplicar tareas.

## Esquema inicial y siguientes versiones

schema.sql es una **línea base nueva** exportada de drizzle/schema.ts más las columnas de autenticación local mantenidas por el código antiguo. No ejecuta las migraciones históricas 0000–0006 ni reutiliza la migración local 0005_crm_sync.sql. Guarda un hash del esquema en iamet_deployment_state. No debe ejecutar `drizzle-kit migrate` sobre esta base como si tuviera el historial antiguo: las futuras actualizaciones requieren migraciones incrementales específicas para esta línea base y respaldo previo. No ejecutar init-vps-v2.mjs de nuevo para actualizar un sitio con datos.

Validación local: TypeScript, compilación de cliente/servidor, sintaxis de scripts y pruebas PostgreSQL compatibles con PGlite para el esquema completo, acceso local al CRM, separación de tokens de clientes, permisos, garantías y registro de conversaciones. Las pruebas de CRM nuevo cubren estadísticas vacías, prospectos, etapas, notas, filtros, paginación y acceso administrativo. La construcción Docker y el cambio real de Nginx se verifican en el VPS por el script; no se ha ejecutado el despliegue desde esta sesión.

Referencias de compatibilidad: [ciclo de soporte de Node.js](https://github.com/nodejs/Release/blob/main/README.md) y [arranque con comprobaciones de salud en Docker Compose](https://docs.docker.com/compose/how-tos/startup-order/).

## Continuar si la instalación terminó pero el cambio de Nginx falló

Si los contenedores v2 están sanos y el login/CRM ya pasaron, no vuelva a ejecutar deploy.sh. Actualice únicamente los scripts y ejecute:

```bash
cd /opt/apps/iamet/v2-staging
git pull --ff-only origin feature/iamet-v2
bash deployment/vps-v2/activate.sh
```

activate.sh conserva la imagen instalada (release-id), la base, la cuenta y sus contraseñas. Reconstruye el vhost a partir del respaldo original, sustituyendo solo el upstream IAMET y añadiendo el aviso noindex si falta. No necesita options-ssl-nginx.conf ni ssl-dhparams.pem salvo que el vhost anterior ya los utilizara. Si la verificación falla, restaura la configuración activa antes del intento. La plantilla nginx.conf queda como referencia; los scripts no la instalan directamente.

## Actualizar solo la aplicación: acceso común «Mi cuenta»

El menú público y los encabezados de soluciones enlazan a /acceso. La misma pantalla permite elegir Clientes o Equipo IAMET. Clientes conserva su autenticación verificada y accede al portal de garantías/pedidos/órdenes; Equipo IAMET usa la sesión local de administrador y accede al CRM. Cada API mantiene la comprobación de permisos en el servidor. No se unen tablas de usuarios ni se asignan permisos por correo, elección de perfil o datos del navegador. Los enlaces anteriores /admin/login y /tienda/login siguen funcionando; registro y recuperación de clientes conservan sus procesos de verificación de correo. No hay autorregistro de administradores. Los destinos returnTo se restringen a rutas locales permitidas.

Para actualizar una instalación v2 que ya está activa, conservando cuentas y datos:

```bash
cd /opt/apps/iamet/v2-staging
git pull --ff-only origin feature/iamet-v2 && bash deployment/vps-v2/update.sh
```

update.sh construye solo la aplicación, respalda la base v2 y sustituye su contenedor. No ejecuta inicialización ni migraciones y no reemplaza el vhost TLS. Valida Nginx y lo recarga para resolver el nuevo contenedor. Si falla la aplicación o la comprobación pública, vuelve a la imagen anterior; la base permanece intacta. No usar este script para cambios de esquema sin una migración incremental específica.
