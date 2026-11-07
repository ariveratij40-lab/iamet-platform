/**
 * blog/store.ts — Guardar y leer los artículos del blog en la base de datos.
 * El admin usa estas mismas funciones para editar, despublicar o borrar.
 */
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "../db";
import { blogPosts, type BlogPost, type InsertBlogPost } from "../../drizzle/schema";

/** Asegura un slug único añadiendo un sufijo si ya existe. */
async function slugLibre(db: any, base: string): Promise<string> {
  let slug = base || `blog-${Date.now()}`;
  for (let i = 0; i < 20; i++) {
    const [existe] = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
    if (!existe) return slug;
    slug = `${base}-${i + 2}`.slice(0, 80);
  }
  return `${base}-${Date.now()}`.slice(0, 80);
}

export async function crearPost(data: InsertBlogPost): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const slug = await slugLibre(db, data.slug);
  const [row] = await db.insert(blogPosts).values({ ...data, slug }).returning({ id: blogPosts.id });
  return row?.id ?? null;
}

/** ¿Ya publicamos algo con este titular de origen hoy/recientemente? (anti-repetición) */
export async function yaCubierto(headline: string, dias = 10): Promise<boolean> {
  const db = await getDb();
  if (!db || !headline) return false;
  const desde = new Date(Date.now() - dias * 86400000);
  const [row] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(and(eq(blogPosts.sourceHeadline, headline), sql`${blogPosts.createdAt} >= ${desde}`))
    .limit(1);
  return !!row;
}

export async function listarPublicados(limit = 30): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.createdAt)).limit(limit);
}

export async function obtenerPorSlug(slug: string): Promise<BlogPost | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return row ?? null;
}

// ── Para el panel de administración ──────────────────────────────────────────
export async function listarTodos(limit = 100): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt)).limit(limit);
}

export async function editarPost(
  id: number,
  cambios: Partial<Pick<BlogPost, "title" | "intro" | "body" | "metaDescription" | "imageUrl" | "status">>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const res = await db.update(blogPosts)
    .set({ ...cambios, updatedAt: new Date() })
    .where(eq(blogPosts.id, id))
    .returning({ id: blogPosts.id });
  return res.length > 0;
}

export async function borrarPost(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const res = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning({ id: blogPosts.id });
  return res.length > 0;
}
