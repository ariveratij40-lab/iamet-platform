export const ENV = {
  // ─── App ──────────────────────────────────────────────────────────────────
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  appUrl: process.env.VITE_APP_URL ?? "https://staging.iamet.mx",

  // ─── LLM (Groq / OpenAI / cualquier API compatible con OpenAI) ────────────
  // Separado de Forge para que el Agente Virtual funcione en VPS standalone.
  // LLM_API_URL tiene prioridad; si no existe, cae a BUILT_IN_FORGE_API_URL.
  llmApiUrl:
    process.env.LLM_API_URL ??
    process.env.BUILT_IN_FORGE_API_URL ??
    "",
  llmApiKey:
    process.env.LLM_API_KEY ??
    process.env.BUILT_IN_FORGE_API_KEY ??
    "",
  llmModel:
    process.env.LLM_MODEL ?? "llama-3.3-70b-versatile",

  // ─── Storage — Cloudflare R2 / AWS S3 ────────────────────────────────────
  // R2_ENDPOINT   → https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  // R2_REGION     → "auto" para R2, "us-east-1" para AWS S3
  // R2_PUBLIC_URL → URL pública del bucket (https://pub-XXX.r2.dev o dominio custom)
  //                 Si está vacío, los archivos se sirven vía /manus-storage/* proxy.
  r2Endpoint: process.env.R2_ENDPOINT ?? "",
  r2Region: process.env.R2_REGION ?? "auto",
  r2Bucket: process.env.R2_BUCKET ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",

  // ─── Manus Forge (legacy — solo para servicios internos de Manus) ─────────
  // En VPS standalone dejar vacío. El servidor arranca sin ellos.
  // Usado por: notification.ts, imageGeneration.ts, map.ts, voiceTranscription.ts
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ─── Email ────────────────────────────────────────────────────────────────
  resendApiKey: process.env.RESEND_API_KEY ?? "",
};
