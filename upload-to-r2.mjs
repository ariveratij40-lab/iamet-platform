/**
 * Script para subir todos los assets de IAMET a Cloudflare R2
 * Ejecutar con: node upload-to-r2.mjs
 */
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { readFileSync, existsSync } from "fs";
import { extname, basename } from "path";

const R2_ENDPOINT = "https://57a96bec5c0895ff6b6d85d787e2898c.r2.cloudflarestorage.com";
const R2_BUCKET = "iamet-assets";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev";

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("❌ Faltan R2_ACCESS_KEY_ID o R2_SECRET_ACCESS_KEY en el entorno");
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

async function uploadFile(localPath, r2Key) {
  if (!existsSync(localPath)) {
    console.warn(`  ⚠️  No existe: ${localPath}`);
    return null;
  }
  const data = readFileSync(localPath);
  const contentType = getMimeType(localPath);
  
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    Body: data,
    ContentType: contentType,
  }));
  
  const url = `${R2_PUBLIC_URL}/${r2Key}`;
  console.log(`  ✅ ${r2Key} → ${url}`);
  return url;
}

const results = {};

console.log("\n🚀 Subiendo assets de IAMET a Cloudflare R2...\n");

// ── Logos ──────────────────────────────────────────────────────────────────────
console.log("📁 Logos:");
const logoFiles = [
  { local: "/home/ubuntu/webdev-static-assets/logo-iamet-v2-final.png", key: "logos/logo-iamet-v2-final.png" },
  { local: "/home/ubuntu/webdev-static-assets/logo-iamet-v2-hero.png", key: "logos/logo-iamet-v2-hero.png" },
  { local: "/home/ubuntu/webdev-static-assets/logo-iamet-2026-transparent.png", key: "logos/logo-iamet-2026-transparent.png" },
  { local: "/home/ubuntu/webdev-static-assets/logo-iamet-2026.jpg", key: "logos/logo-iamet-2026.jpg" },
];
for (const { local, key } of logoFiles) {
  const url = await uploadFile(local, key);
  if (url) results[key] = url;
}

// ── Imágenes de Tienda ─────────────────────────────────────────────────────────
console.log("\n📁 Productos de Tienda:");
const storeFiles = [
  { local: "/home/ubuntu/webdev-static-assets/store/access-point.png", key: "store/access-point.png" },
  { local: "/home/ubuntu/webdev-static-assets/store/cam-domo.jpg", key: "store/cam-domo.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/store/cam-ptz.png", key: "store/cam-ptz.png" },
  { local: "/home/ubuntu/webdev-static-assets/store/laptop-biz.jpg", key: "store/laptop-biz.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/store/rack-42u.jpg", key: "store/rack-42u.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/store/switch-poe.jpg", key: "store/switch-poe.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/store/switch-rack.jpg", key: "store/switch-rack.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/store/ups-tower.jpg", key: "store/ups-tower.jpg" },
];
for (const { local, key } of storeFiles) {
  const url = await uploadFile(local, key);
  if (url) results[key] = url;
}

// ── Imágenes de Servicios/Verticales ──────────────────────────────────────────
console.log("\n📁 Servicios y Verticales:");
const serviceFiles = [
  { local: "/home/ubuntu/webdev-static-assets/services/audiovisual.jpg", key: "services/audiovisual.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/services/cableado.jpg", key: "services/cableado.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/services/cctv.jpg", key: "services/cctv.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/services/computo.jpg", key: "services/computo.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/services/energia.jpg", key: "services/energia.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/services/mantenimiento.jpg", key: "services/mantenimiento.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/services/proyectos.jpg", key: "services/proyectos.jpg" },
  { local: "/home/ubuntu/webdev-static-assets/services/software.jpg", key: "services/software.jpg" },
];
for (const { local, key } of serviceFiles) {
  const url = await uploadFile(local, key);
  if (url) results[key] = url;
}

// ── Resumen ────────────────────────────────────────────────────────────────────
console.log("\n✅ Upload completado. URLs generadas:\n");
for (const [key, url] of Object.entries(results)) {
  console.log(`  ${key}: ${url}`);
}

console.log(`\n📊 Total: ${Object.keys(results).length} archivos subidos`);
console.log("\n🔑 URLs clave para el código:");
console.log(`  Logo principal: ${results["logos/logo-iamet-v2-final.png"] || "N/A"}`);
console.log(`  Logo hero: ${results["logos/logo-iamet-v2-hero.png"] || "N/A"}`);
