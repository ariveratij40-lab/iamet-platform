/**
 * lead-routing-config.ts — El criterio del filtro: qué categorías de lead pasan
 * al CRM de IAMET (ventas) y cuáles se quedan solo en el CRM del sitio.
 *
 * El CRM del sitio recibe TODO. Este ajuste decide qué sube a ventas:
 *   - Por defecto: solo "proyecto" (venta potencial / requerimiento concreto).
 *   - Con el interruptor encendido: también "consulta" (interés legítimo).
 * "ruido" nunca sube.
 *
 * El admin lo prende y apaga desde el panel del CRM del sitio. Se guarda en la
 * tabla de ajustes (sin cambios de base de datos). Vive en su propio módulo,
 * sin imports pesados, para que tanto el enrutador como el barrido lo usen sin
 * dependencias circulares.
 */
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { appSettings } from "../drizzle/schema";
import type { LeadCategoria } from "./lead-qualification";

const CLAVE_CONSULTA = "leads_forward_consulta";

/** ¿Las consultas (no solo los proyectos) también suben al CRM de IAMET? */
export async function incluyeConsulta(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const [row] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, CLAVE_CONSULTA))
      .limit(1);
    // Sin registro = apagado por defecto (solo proyecto).
    return row ? row.value === "true" : false;
  } catch {
    // Ante cualquier fallo de lectura, el filtro más estricto: solo proyecto.
    return false;
  }
}

export async function ponerIncluyeConsulta(encendido: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const value = encendido ? "true" : "false";
  await db
    .insert(appSettings)
    .values({ key: CLAVE_CONSULTA, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

/** El conjunto de categorías que, según el ajuste, suben al CRM de IAMET. */
export async function categoriasPermitidas(): Promise<Set<LeadCategoria>> {
  const permitidas = new Set<LeadCategoria>(["proyecto"]);
  if (await incluyeConsulta()) permitidas.add("consulta");
  return permitidas;
}
