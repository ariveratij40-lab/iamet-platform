/**
 * Script para actualizar las URLs de imágenes de productos en la BD
 * a las URLs de Cloudflare R2.
 * 
 * Ejecutar con: npx tsx update-image-urls.ts
 */
import { getDb } from "./server/db";
import { storeProducts } from "./drizzle/schema";
import { eq } from "drizzle-orm";

const R2_BASE = "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev";

// Mapa de slug de producto → URL R2 (slugs reales de la BD)
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  // Redes
  "access-point-wifi6-techo": `${R2_BASE}/store/access-point.png`,
  "switch-24p-poe-plus": `${R2_BASE}/store/switch-poe.jpg`,
  "router-empresarial-vpn": `${R2_BASE}/store/switch-rack.jpg`,
  "firewall-ngfw-1gbps": `${R2_BASE}/store/switch-rack.jpg`,
  // CCTV
  "camara-ip-domo-4mp": `${R2_BASE}/store/cam-domo.jpg`,
  "camara-ptz-4k-ia": `${R2_BASE}/store/cam-ptz.png`,
  "nvr-16-canales-4k": `${R2_BASE}/store/switch-rack.jpg`,
  // Control de Acceso
  "control-acceso-biometrico": `${R2_BASE}/store/access-point.png`,
  "kit-alarma-inalambrica-8z": `${R2_BASE}/store/cam-domo.jpg`,
  // Infraestructura
  "rack-abierto-42u": `${R2_BASE}/store/rack-42u.jpg`,
  "ups-online-3kva-torre": `${R2_BASE}/store/ups-tower.jpg`,
  "regulador-voltaje-2000va": `${R2_BASE}/store/ups-tower.jpg`,
  "cable-utp-cat6a-305m": `${R2_BASE}/store/switch-poe.jpg`,
  "patch-panel-24p-cat6a": `${R2_BASE}/store/switch-rack.jpg`,
  "fibra-optica-monomodo-12h": `${R2_BASE}/store/switch-rack.jpg`,
  // Cómputo
  "laptop-empresarial-i7-16gb": `${R2_BASE}/store/laptop-biz.jpg`,
  "servidor-torre-xeon-32gb": `${R2_BASE}/store/laptop-biz.jpg`,
  "workstation-cad-diseno": `${R2_BASE}/store/laptop-biz.jpg`,
  // Software
  "microsoft-365-business-standard": `${R2_BASE}/services/software.jpg`,
  "antivirus-empresarial-25": `${R2_BASE}/services/software.jpg`,
  "backup-nube-1tb": `${R2_BASE}/services/software.jpg`,
  // Servicios
  "instalacion-configuracion-red": `${R2_BASE}/services/cableado.jpg`,
  "poliza-mantenimiento-preventivo": `${R2_BASE}/services/mantenimiento.jpg`,
  "consultoria-ciberseguridad": `${R2_BASE}/services/proyectos.jpg`,
  "soporte-tecnico-remoto": `${R2_BASE}/services/software.jpg`,
};

async function main() {
  console.log("🔄 Actualizando URLs de imágenes en la BD...\n");

  const db = await getDb();
  if (!db) { console.error("❌ No se pudo conectar a la BD"); process.exit(1); }

  // Obtener todos los productos
  const products = await db.select({
    id: storeProducts.id,
    name: storeProducts.name,
    slug: storeProducts.slug,
    imageUrl: storeProducts.imageUrl,
  }).from(storeProducts);

  console.log(`📦 Total de productos: ${products.length}`);
  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const newUrl = PRODUCT_IMAGE_MAP[product.slug];
    
    if (newUrl && product.imageUrl !== newUrl) {
      await (db as any).update(storeProducts)
        .set({ imageUrl: newUrl })
        .where(eq(storeProducts.id, product.id));
      console.log(`  ✅ ${product.name} (${product.slug})`);
      console.log(`     → ${newUrl}`);
      updated++;
    } else if (!newUrl) {
      console.log(`  ⚠️  Sin imagen mapeada: ${product.slug}`);
      skipped++;
    } else {
      console.log(`  ✓  Ya actualizado: ${product.slug}`);
    }
  }

  console.log(`\n📊 Resultado: ${updated} actualizados, ${skipped} sin imagen mapeada`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
