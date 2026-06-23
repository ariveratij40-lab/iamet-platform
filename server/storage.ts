/**
 * Storage helpers — Cloudflare R2 / AWS S3 (S3-compatible)
 *
 * Variables de entorno requeridas:
 *   R2_ENDPOINT         → https://<ACCOUNT_ID>.r2.cloudflarestorage.com
 *   R2_REGION           → "auto" para R2, "us-east-1" para AWS S3
 *   R2_BUCKET           → nombre del bucket
 *   R2_ACCESS_KEY_ID    → Access Key ID del token R2
 *   R2_SECRET_ACCESS_KEY → Secret Access Key del token R2
 *   R2_PUBLIC_URL       → (opcional) URL pública del bucket
 *                          Si está configurada, las URLs devueltas apuntan
 *                          directamente al bucket sin pasar por el proxy local.
 *                          Ejemplo: https://pub-XXXX.r2.dev
 *                                   https://files.iamet.mx (dominio custom)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

// ─── S3 client factory ────────────────────────────────────────────────────────

function getS3Client(): S3Client {
  if (!ENV.r2Endpoint || !ENV.r2AccessKeyId || !ENV.r2SecretAccessKey) {
    throw new Error(
      "Storage config missing: set R2_ENDPOINT, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY"
    );
  }
  if (!ENV.r2Bucket) {
    throw new Error("Storage config missing: set R2_BUCKET");
  }

  return new S3Client({
    region: ENV.r2Region,
    endpoint: ENV.r2Endpoint,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
    // Requerido para Cloudflare R2: deshabilitar virtual-hosted-style
    forcePathStyle: true,
  });
}

// ─── Helpers internos ────────────────────────────────────────────────────────

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/**
 * Construye la URL pública de un objeto.
 * - Si R2_PUBLIC_URL está configurado: URL directa al bucket (sin proxy).
 * - Si no: ruta local /manus-storage/{key} servida por storageProxy.ts.
 */
function buildPublicUrl(key: string): string {
  if (ENV.r2PublicUrl) {
    return `${ENV.r2PublicUrl.replace(/\/+$/, "")}/${key}`;
  }
  return `/manus-storage/${key}`;
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Sube un archivo al bucket R2/S3.
 * Devuelve { key, url } donde url es la URL pública o la ruta del proxy local.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const s3 = getS3Client();
  const key = appendHashSuffix(normalizeKey(relKey));
  const body =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.from(data as Uint8Array);

  await s3.send(
    new PutObjectCommand({
      Bucket: ENV.r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return { key, url: buildPublicUrl(key) };
}

/**
 * Devuelve la URL pública de un objeto ya subido (sin verificar existencia).
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: buildPublicUrl(key) };
}

/**
 * Genera una URL firmada temporal para acceso privado a un objeto.
 * Útil cuando el bucket NO tiene acceso público habilitado.
 * @param expiresIn segundos de validez (default: 3600 = 1 hora)
 */
export async function storageGetSignedUrl(
  relKey: string,
  expiresIn = 3600
): Promise<string> {
  const s3 = getS3Client();
  const key = normalizeKey(relKey);
  const command = new GetObjectCommand({
    Bucket: ENV.r2Bucket,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn });
}
