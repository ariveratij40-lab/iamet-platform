# IAMET · Genetec — seguridad integral

Destino: https://genetec.iamet.mx/ . Versión local para revisión, 11 de noviembre de 2026. No publicada; no se modificaron DNS, VPS, CRM de producción ni campañas.

## Arquitectura

Misma base de `landings/cableado`: Astro 7.4.4, salida estática, Docker multietapa y Nginx. Se conservaron los SVG y colores aprobados de IAMET. No requiere React, hosting Sites ni otra base de datos.

El formulario usa `/api/leads`, con confirmación únicamente después de recibir un recibo persistido, protección contra duplicados y atribución condicionada al consentimiento de analítica. Identificadores: `seguridad-genetec`, `genetec-tijuana`, vertical CRM `genetec`. La vista previa no transmite datos.

## Ejecutar

```sh
npm ci
ASTRO_TELEMETRY_DISABLED=1 npm run build
npm test
ASTRO_TELEMETRY_DISABLED=1 npm run dev -- --port 4324
```

Astro mantiene el servidor en segundo plano. Detener con `npx astro dev stop` desde esta carpeta.

## Integración preparada

En el repositorio padre:

- `server/landing-capture.ts`: acepta las tres campañas, valida sus pares servicio/landing y conserva el comportamiento de cableado.
- `server/landing-capture.test.ts`: prueba la persistencia de Genetec con URL y vertical correctas, reintentos y validación.
- `deployment/cableado-mail/worker.mjs`: adapta el asunto interno y la confirmación al cliente según la landing. Conserva las referencias de deduplicación y trabajos ya almacenados. No se ejecutó ni envió correo.

No se requiere migración de esquema: se utilizan las tablas existentes de prospectos y recibos. El despliegue debe actualizar el backend y el worker antes de habilitar captación Genetec.

## Activación pendiente tras revisión

1. Comparar la configuración activa de cableado con `deploy/genetec.conf.example`. El upstream `iamet_v2_app_prod:3000` es el previsto por el Compose disponible, no una verificación del servicio activo. Confirmar el backend que actualmente recibe `/api/leads`, su red y su configuración de proxy confiable.
2. Agregar `https://genetec.iamet.mx` a `LANDING_ALLOWED_ORIGINS` conservando los orígenes existentes. Verificar `LANDING_CAPTURE_ENABLED=true` y `CRM_ENGINE=v2` en el backend destinado a captación.
3. Actualizar backend y worker con los cambios probados. Validar el worker sin enviar con su modo `--check`; revisar la cola antes de iniciarlo.
4. Apuntar el subdominio al mismo proxy de producción que cableado y emitir un certificado exclusivo. Validar DNS y HTTPS antes de cargar la configuración TLS. No reutilizar el certificado de otro dominio.
5. Construir el contenedor mediante `compose.yaml`; inicialmente con captación e indexación deshabilitadas. Verificar `nginx -t`, página, recursos y aislamiento de otras rutas `/api/`.
6. Habilitar `PUBLIC_CAPTURE_ENABLED=true`, reconstruir y validar una solicitud controlada de extremo a extremo, incluidos recibo, CRM y correos, antes de campañas públicas.
7. Para lanzamiento indexable: `PUBLIC_INDEXABLE=true`, reemplazar `public/robots.txt` por `User-agent: *`, `Allow: /` y `Sitemap: https://genetec.iamet.mx/sitemap.xml`; retirar el encabezado noindex del proxy. Compilar y verificar el resultado.

No se instalaron etiquetas publicitarias. Los eventos existentes requieren consentimiento; medir campañas requiere conectar el mecanismo de consentimiento y la herramienta de analítica acordados.

## Investigación y recursos

Consulta del 11 de noviembre de 2026. Se usaron fuentes oficiales de Genetec y su documentación técnica.

| Necesidad | Solución | Fuente |
| --- | --- | --- |
| Plataforma unificada | Security Center | https://www.genetec.com/products/unified-security/security-center |
| Video | Omnicast | https://www.genetec.com/products/unified-security/omnicast |
| Accesos | Synergis | https://www.genetec.com/products/unified-security/synergis |
| Placas | AutoVu | https://www.genetec.com/products/unified-security/autovu |
| Comunicaciones | Sipelia | https://www.genetec.com/products/unified-security/sipelia |
| Gestión de incidentes | Mission Control | https://www.genetec.com/products/operations/mission-control |
| Intrusión | Integración de paneles | https://www.genetec.com/resources/feature-notes/intrusion-panel-integration |
| Gestión de identidades | ClearID | https://techdocs.genetec.com/r/en-US/Genetec-ClearIDTM-User-Guide/How-the-ClearID-plugin-works-with-Security-Center |
| Evidencia digital | Clearance | https://techdocs.genetec.com/r/en-US/Security-Center-SaaS-Setup-Guide/About-Clearance-in-Security-Center-SaaS |
| Nube e híbrido | Security Center SaaS | https://www.genetec.com/products/unified-security/security-center-saas/ |
| Arquitectura SaaS | Guía oficial | https://techdocs.genetec.com/r/en-US/Security-Center-SaaS-Setup-Guide/Understanding-the-Security-Center-SaaS-architecture |

La topología es funcional y simplificada, no un diagrama de cableado. El núcleo ilustrado es Security Center; SaaS se presenta por separado y no se presume paridad de funciones. Los equipos de campo requieren compatibilidad, controladores, infraestructura y licencias según el proyecto. El escenario de visita es ilustrativo; no promete apertura automática por reconocimiento de placa.

Fotografías obtenidas de las páginas oficiales de Omnicast, Synergis, AutoVu y Sipelia, con atribución en la landing. El logo Genetec procede de los recursos corporativos existentes. No se afirma una categoría de partner IAMET ni se inventan certificaciones.

La versión especializada de Synergis permanece en `../synergis`.

## Validación

- Compilación correcta, 8 pruebas de formulario y 9 de backend aprobadas.
- Imágenes verificadas en navegador; vista de escritorio a 1280 px y móvil a 390 px sin desbordamiento horizontal.
- Formulario de revisión deshabilitado. No se enviaron correos ni solicitudes reales.
- DNS, HTTPS, contenedores e integración de producción pendientes de activación y validación.
