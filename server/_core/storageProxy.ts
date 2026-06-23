/**
 * Proxy Express para rutas /manus-storage/*
 *
 * Comportamiento según configuración:
 *
 * 1. R2_PUBLIC_URL configurado (bucket público):
 *    → Redirección 301 permanente a la URL pública del objeto en R2.
 *    → No genera presigned URL. Ideal para imágenes de productos.
 *
 * 2. R2_PUBLIC_URL vacío (bucket privado):
 *    → Genera presigned URL temporal (1 hora) y redirige 307.
 *    → Requiere R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
 *
 * 3. Sin configuración R2 (legacy Manus Forge):
 *    → Devuelve 503 con mensaje claro. No rompe el servidor.
 */

import type { Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as Record<string, string>)[0];

    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    // ── Caso 1: bucket público con R2_PUBLIC_URL ──────────────────────────
    if (ENV.r2PublicUrl) {
      const directUrl = `${ENV.r2PublicUrl.replace(/\/+$/, "")}/${key}`;
      res.set("Cache-Control", "public, max-age=86400");
      res.redirect(301, directUrl);
      return;
    }

    // ── Caso 2: bucket privado — generar presigned URL ────────────────────
    if (ENV.r2Endpoint && ENV.r2AccessKeyId && ENV.r2SecretAccessKey && ENV.r2Bucket) {
      try {
        const { storageGetSignedUrl } = await import("../storage");
        const signedUrl = await storageGetSignedUrl(key, 3600);
        res.set("Cache-Control", "no-store");
        res.redirect(307, signedUrl);
      } catch (err) {
        console.error("[StorageProxy] Failed to generate signed URL:", err);
        res.status(502).send("Storage proxy error");
      }
      return;
    }

    // ── Caso 3: sin configuración R2 (legacy / no configurado) ───────────
    console.warn(
      `[StorageProxy] R2 not configured. Set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY. Key: ${key}`
    );
    res.status(503).send(
      "Storage not configured. Set R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY."
    );
  });
}
