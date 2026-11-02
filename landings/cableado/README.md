# Landing IAMET de cableado y fibra óptica

Preparación local del 1 de noviembre de 2026. Astro 7.4.4 genera HTML estático; no utiliza React ni alojamiento Sites. La vista previa NO está conectada al CRM del VPS. No se ha desplegado ni activado ninguna campaña.

## Ejecutar y revisar

```sh
npm ci
ASTRO_TELEMETRY_DISABLED=1 npm run build
ASTRO_TELEMETRY_DISABLED=1 npm run preview -- --port 4321
npm test
```

Vista local: http://127.0.0.1:4321/. Astro 7 mantiene el proceso de preview; para detenerlo: `npx astro preview stop`.

El formulario está deshabilitado por defecto y la página lo informa. `PUBLIC_CAPTURE_ENABLED=true` y una URL de privacidad válida son condiciones de compilación, no pruebas de integración. No habilitarlas hasta validar el backend de pruebas. El destino previsto es `https://cableadoestructurado.iamet.mx/`.

El backend está en la raíz del repositorio (`../..`), basada en `feature/iamet-v2`, commit `2add1ca72cf0ab8641bd9e2b3a07c21d2a3d8348`. La copia anterior `iamet-preview` no tenía cambios locales y estaba 68 commits detrás. No se modificó, no se cambió a main ni se hizo push.

## Entregables

- `src/pages/index.astro`: contenido para empresas industriales en Tijuana, intención Panduit, formulario sin registro y WhatsApp complementario.
- `public/brand`: cinco SVG entregados, copiados sin reconstruir geometría ni letras.
- `src/scripts/form.js`: envío REST, reintentos, confirmación y medición sujeta a consentimiento.
- `Dockerfile`, `compose.yaml`, `deploy/`: preparación de despliegue, segura y deshabilitada por defecto.
- `docs/contrato-rest.md`: contrato propuesto, mapeo y límites.
- `docs/despliegue.md`: procedimiento y pendientes de infraestructura.
- `docs/resultados.md`: evidencia de pruebas y criterios pendientes.

La sección Panduit responde a la intención de búsqueda sin anunciar como vigente una acreditación aún no verificada. El documento corporativo confirma el antecedente; el distintivo disponible está fechado 2025. Falta respaldo vigente para afirmar certificación actual o mostrar ese distintivo como actual.
