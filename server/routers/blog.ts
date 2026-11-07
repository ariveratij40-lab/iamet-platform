/**
 * routers/blog.ts — El blog, de cara al sitio y al panel de administración.
 *
 * Público: lista de artículos publicados y lectura por slug (lo que ve el
 * visitante). Admin: generar ahora, listar todos, editar, despublicar y borrar.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import {
  listarPublicados,
  obtenerPorSlug,
  listarTodos,
  editarPost,
  borrarPost,
} from "../blog/store";
import { generarBlogDelDia, ejecutarBlogDiario } from "../blog/generate";
import { blogAutoEncendido, ponerBlogAuto } from "../blog/settings";

export const blogRouter = router({
  // ── Público (el sitio) ──
  publicados: publicProcedure.query(() => listarPublicados(30)),

  porSlug: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(80) }))
    .query(async ({ input }) => {
      const post = await obtenerPorSlug(input.slug);
      if (!post || post.status !== "published")
        throw new TRPCError({ code: "NOT_FOUND", message: "Artículo no encontrado" });
      return post;
    }),

  // ── Admin ──
  adminListar: adminProcedure.query(() => listarTodos(100)),

  // Botón manual: siempre funciona, aunque el automático esté apagado.
  generarAhora: adminProcedure.mutation(() => generarBlogDelDia()),

  // Estado del interruptor de publicación diaria automática.
  autoEstado: adminProcedure.query(async () => ({ encendido: await blogAutoEncendido() })),

  // Prender/apagar la publicación diaria automática.
  setAuto: adminProcedure
    .input(z.object({ encendido: z.boolean() }))
    .mutation(async ({ input }) => {
      await ponerBlogAuto(input.encendido);
      return { encendido: input.encendido };
    }),

  // Entrypoint para el cron diario: respeta el interruptor. Protegido por admin;
  // un cron externo lo invoca con credenciales o se corre vía comando interno.
  ejecutarDiario: adminProcedure.mutation(() => ejecutarBlogDiario()),

  editar: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(200).optional(),
        intro: z.string().max(320).optional(),
        body: z.string().min(1).optional(),
        metaDescription: z.string().max(220).optional(),
        imageUrl: z.string().url().max(1000).nullable().optional(),
        status: z.enum(["published", "draft", "archived"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...cambios } = input;
      const ok = await editarPost(id, cambios as any);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Artículo no encontrado" });
      return { ok: true };
    }),

  borrar: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const ok = await borrarPost(input.id);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND", message: "Artículo no encontrado" });
      return { ok: true };
    }),
});
