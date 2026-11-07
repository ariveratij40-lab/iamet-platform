/**
 * blog/settings.ts — El interruptor del blog automático diario.
 *
 * Guarda en la tabla de ajustes si la publicación diaria está encendida. El
 * admin lo prende y apaga desde el panel. Por defecto viene ENCENDIDO.
 *
 * Importante: este interruptor solo controla la generación AUTOMÁTICA (el cron
 * diario). El botón "Generar ahora" del panel siempre funciona, aunque esté
 * apagado, para que el admin pueda publicar a mano cuando quiera.
 */
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { appSettings } from "../../drizzle/schema";

const CLAVE_AUTO = "blog_auto_enabled";

export async function blogAutoEncendido(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, CLAVE_AUTO)).limit(1);
  // Sin registro = encendido por defecto.
  return row ? row.value === "true" : true;
}

export async function ponerBlogAuto(encendido: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const value = encendido ? "true" : "false";
  await db
    .insert(appSettings)
    .values({ key: CLAVE_AUTO, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}
