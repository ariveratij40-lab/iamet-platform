# Asistente IA del sitio — guía de integración

**Rama:** `feat/asistente-ia-barato`
**Qué hace:** enriquece el asistente del sitio (`visitorAssistant`) con lo mejor
del asistente del CRM y del asistente anterior de la landing, SIN reemplazarlo.

## Qué cambió (2 archivos de código + 2 de prueba)

- `shared/visitor-assistant.ts`
  - `visitorClosureGuidance(turno)` — cierre por turnos: el chat deja de
    preguntar conforme avanza y empuja a dejar datos en /cotizacion.
  - Conocimiento técnico de cableado (Cat6/6A, fibra mono/multimodo, Fluke,
    racks/TR, TIA-568, Panduit/Commscope/Belden) dentro del system prompt.
  - Regla anti-complacencia (no abrir con "excelente pregunta").
  - `visitorSystemPrompt(turno)` ahora recibe el número de turno.
- `server/routers/visitorAssistant.ts`
  - Calcula el turno del visitante (mensajes suyos en la ventana) y lo pasa
    al prompt. Nada más cambió: mismo contrato tRPC, misma salida.
- `server/visitor-closure.test.ts` + `server/visitor-closure-handler.test.ts`
  (8 pruebas nuevas; las 16 del asistente siguen pasando).

## Lo que NO cambió (a propósito, se conserva lo bueno del sitio)

- Rate-limit por IP, persistencia de conversaciones en BD, chips calculados
  por código (`visitorGuidance`), defensa anti-inyección. El widget del front
  NO se toca: el contrato de entrada/salida es idéntico.

## Pasar a OpenRouter (solo variables de entorno, SIN código)

En el `.env` de la app (producción: `/opt/apps/iamet/prod/config` o el
env_file del compose; staging: su equivalente), definir:

    LLM_API_URL=https://openrouter.ai/api
    LLM_API_KEY=<la API key de OpenRouter>
    LLM_MODEL=openai/gpt-4o-mini

El código arma el endpoint `${LLM_API_URL}/v1/chat/completions`, que resuelve a
`https://openrouter.ai/api/v1/chat/completions` (correcto para OpenRouter).
`LLM_API_URL` tiene prioridad sobre el Forge por defecto; no hay que borrar nada.

## Despliegue (el sitio corre por IMAGEN Docker, no por archivos montados)

Editar archivos NO basta: hay que reconstruir la imagen y relanzar.

1. Integrar la rama (coordinar con arivera CONTRA QUÉ rama — producción corre
   `feature/iamet-v9-dynamic-hero`, que NO está en GitHub; `main` no es lo vivo).
2. En el server: `git pull` en `/opt/apps/iamet/prod/source` sobre la rama viva.
3. Reconstruir: `docker build -f Dockerfile.prod -t iamet-v2-prod:<nuevo-tag> .`
4. Actualizar `image:` en `compose.yaml` y `docker compose up -d`.
5. Smoke test: abrir el widget y mandar 4-5 mensajes; verificar que a partir
   del 3er/4º turno deja de preguntar y sugiere dejar datos.

## Verificado localmente antes de entrar

- `pnpm build` → OK (el bundle de producción incluye el cambio).
- Suite del asistente: 24 pruebas en verde (16 previas + 8 nuevas).
- Los 14 fallos de la suite completa son de infraestructura (RESEND/R2/JWT/DB
  sin credenciales en el clon) y existen igual en el commit base: no son del cambio.
