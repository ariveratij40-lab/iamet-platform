/**
 * Test de validación de credenciales Cloudflare R2
 * Verifica que las variables de entorno están configuradas y el bucket es accesible.
 */
import { describe, it, expect } from "vitest";
import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const R2_ENDPOINT = process.env.R2_ENDPOINT ?? "";
const R2_BUCKET = process.env.R2_BUCKET ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_REGION = process.env.R2_REGION ?? "auto";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

describe("Cloudflare R2 — Validación de credenciales", () => {
  it("Las variables de entorno R2 están definidas", () => {
    expect(R2_ENDPOINT).toBeTruthy();
    expect(R2_BUCKET).toBeTruthy();
    expect(R2_ACCESS_KEY_ID).toBeTruthy();
    expect(R2_SECRET_ACCESS_KEY).toBeTruthy();
    expect(R2_PUBLIC_URL).toBeTruthy();
  });

  it("El endpoint tiene el formato correcto de Cloudflare R2", () => {
    expect(R2_ENDPOINT).toMatch(/^https:\/\/[a-f0-9]+\.r2\.cloudflarestorage\.com$/);
  });

  it("Puede conectarse al bucket R2 y listar objetos", async () => {
    const s3 = new S3Client({
      region: R2_REGION,
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const result = await s3.send(
      new ListObjectsV2Command({ Bucket: R2_BUCKET, MaxKeys: 5 })
    );
    expect(result.$metadata.httpStatusCode).toBe(200);
  }, 15000);

  it("Puede subir y eliminar un objeto de prueba en R2", async () => {
    const s3 = new S3Client({
      region: R2_REGION,
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    const testKey = `test/r2-validation-${Date.now()}.txt`;
    const testContent = "IAMET R2 validation test";

    // Subir
    const putResult = await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: testKey,
        Body: Buffer.from(testContent),
        ContentType: "text/plain",
      })
    );
    expect(putResult.$metadata.httpStatusCode).toBe(200);

    // Limpiar
    await s3.send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: testKey })
    );
  }, 15000);
});
