# Resultados y pendientes de la preparación local

Fecha: 1 de noviembre de 2026, America/Tijuana. No se ha publicado en VPS, hecho push ni activado campañas.

## Revisión del repositorio

La copia original iamet-preview apunta a https://github.com/ariveratij40-lab/iamet-platform.git, rama feature/iamet-v2. Commit local 3e7f737d93538d17cf33b30c20416cfc6661b42b, sin cambios locales al inicio y al final. La rama remota descargada en la copia aislada está en 2add1ca72cf0ab8641bd9e2b3a07c21d2a3d8348, 68 commits por delante. No se utilizó main ni se sobrescribió la copia original.

Se confirmó Node/TypeScript, Express, tRPC, Drizzle y postgres-js. El CRM v2 existente ofrece captureCrmV2Lead y consultas sobre leads. No había un endpoint REST de captación con idempotencia. Se preparó esa extensión exclusivamente en la copia aislada. La versión realmente ejecutada en /opt/apps/iamet/v2-staging no fue inspeccionada porque no se accedió al VPS.

## Pruebas realizadas

| Verificación | Resultado y alcance |
|---|---|
| Astro build | Correcto: una página HTML estática; sin runtime React |
| JavaScript y estilos | 3,187 bytes JS y 6,817 bytes CSS compilados antes del ajuste textual Panduit; sin etiquetas externas. No es medición de Core Web Vitals |
| Pruebas frontend | 7 aprobadas: preview sin transmisión, confirmación válida, deduplicación, pérdida de conexión y reintento con misma clave/cuerpo, rechazo, consentimiento y ausencia de datos personales en el evento |
| Pruebas backend | 7 aprobadas con PostgreSQL embebido PGlite: captura visible mediante consultas reales del CRM v2, reintento, conflicto, concurrencia, rollback, validación y HTTP |
| REST local | Respuestas 201/200 tras guardado, 409 por cambio de contenido, 422 inválidos, 403 origen no permitido, 503 deshabilitado |
| Regresión CRM v2 | 7 pruebas existentes aprobadas |
| TypeScript backend | tsc --noEmit aprobado |
| Código | git diff --check y node --check aprobados |
| Compose | docker compose config --quiet aprobado |
| Contenedor y Nginx | Pendientes: Docker está instalado, pero su daemon no está iniciado |
| Diseño | Revisión de 360, 390, 768 y 1440 px sin overflow horizontal; capturas de escritorio y móvil guardadas. Tras añadir Panduit se revisaron nuevamente las vistas principales |
| Formulario visible | Etiquetas, campos, estado deshabilitado, enlace al formulario móvil y correo inválido comprobados en navegador |
| WhatsApp | wa.me abrió la página oficial con +52 664 331 4515 y texto de cableado/fibra en Tijuana. No se envió mensaje ni se verificó atención humana |
| Logo | SHA-256 del SVG principal coincide exactamente con el original; no se reconstruyó |
| Documentos | Perfil CORP-01 actualizado a 1.1 y guía de identidad a definitiva; tres páginas del DOCX renderizadas y revisadas. Originales actualizados y respaldados en referencias/anteriores |

Los tests de frontend usan un entorno controlado de formulario/fetch. Los de backend usan almacenamiento PostgreSQL embebido y la ruta HTTP real, con datos ficticios. No equivalen a una prueba completa del navegador contra el CRM del VPS. La vista previa visible permanece sin envío; no muestra una simulación como si fuera una conexión real.

## Pendientes concretos

1. Acreditación Panduit vigente y autorización del distintivo. La búsqueda “integrador certificado Panduit en Tijuana” ya tiene sección y FAQ; no se afirma vigencia sin documentación. Antecedente disponible: distintivo 2025.
2. Aprobar aviso de privacidad y URL; definir consentimiento y conectar gestor/etiquetas. lead_captured es el único evento de captura, condicionado al guardado confirmado y al consentimiento para analítica.
3. Revisar contrato y migración REST; confirmar CRM_ENGINE=v2, PostgreSQL y versión desplegada; integrar la extensión en el entorno de pruebas autorizado.
4. Definir responsable o cola comercial, horario, notificaciones y seguimiento. El CRM v2 actual no los automatiza en su función de captura; no se activó la vía heredada.
5. Encender Docker para validar build, nginx -t y ejecución local; verificar redes, upstream, número de proxies, DNS, TLS y entorno final. No se ha solicitado ni ejecutado despliegue.
6. Ejecutar prueba completa navegador → API → PostgreSQL → CRM → agradecimiento → medición en pruebas. Validar recuperación tras recarga con recepción incierta y deduplicación con el sistema analítico real.
7. Completar auditoría de teclado/accesibilidad, contraste y rendimiento con evidencia de laboratorio. La automatización del navegador no pudo accionar el desplegable FAQ; requiere comprobación manual adicional. No se declara conformidad WCAG ni puntuación PageSpeed.
8. Validar producción y reversión con respaldo. Revisar noindex, robots y cabeceras solo al autorizar publicación, manteniendo staging protegido.

## Archivos de entrega

Proyecto Astro: landing-cableado. Backend: raíz de este repositorio. Documentación técnica: docs/contrato-rest.md y docs/despliegue.md. Evidencia visual: docs/previews/escritorio.jpg, pagina-completa.jpg y movil-390.jpg. Referencias actualizadas y copias actualizadas: ../../docs/marketing/referencias-iamet; los respaldos anteriores permanecen únicamente en el espacio local.
