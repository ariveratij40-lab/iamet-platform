import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { leads, leadReviews, leadReviewEvents } from "../../drizzle/schema";
import {
  emptyReview,
  reviewFields,
  reviewState,
  type ReviewStage,
} from "../../shared/lead-review";
const days = z
  .union([z.literal(0), z.literal(7), z.literal(30), z.literal(90)])
  .default(0);
const status = sql<ReviewStage>`coalesce(${leadReviews.status}, 'new')`;
const since = (d: number) =>
  d ? gte(leads.createdAt, new Date(Date.now() - d * 86400000)) : undefined;
async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Base de datos no disponible",
    });
  return db;
}
const summary = {
  id: leads.id,
  company: leads.company,
  contactName: leads.contactName,
  email: leads.email,
  source: leads.source,
  status,
  createdAt: leads.createdAt,
  scoreBreakdown: leads.scoreBreakdown,
};
export const leadReviewRouter = router({
  overview: adminProcedure
    .input(z.object({ days }))
    .query(async ({ input }) => {
      const db = await database();
      const stages = await db
        .select({ status, count: sql<number>`count(*)::int` })
        .from(leads)
        .leftJoin(leadReviews, eq(leads.id, leadReviews.leadId))
        .where(since(input.days))
        .groupBy(status);
      const sources = await db
        .select({ source: leads.source, count: sql<number>`count(*)::int` })
        .from(leads)
        .where(since(input.days))
        .groupBy(leads.source);
      const latest = await db
        .select(summary)
        .from(leads)
        .leftJoin(leadReviews, eq(leads.id, leadReviews.leadId))
        .where(since(input.days))
        .orderBy(desc(leads.createdAt), desc(leads.id))
        .limit(5);
      return { stages, sources, latest };
    }),
  list: adminProcedure
    .input(
      z.object({
        days,
        page: z.number().int().min(0).default(0),
        status: reviewState.optional(),
        search: z.string().trim().max(150).default(""),
      })
    )
    .query(async ({ input }) => {
      const db = await database();
      const filter = and(
        since(input.days),
        input.status ? eq(status, input.status) : undefined,
        input.search
          ? or(
              ilike(leads.company, `%${input.search}%`),
              ilike(leads.contactName, `%${input.search}%`),
              ilike(leads.email, `%${input.search}%`)
            )
          : undefined
      );
      const [total] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(leads)
        .leftJoin(leadReviews, eq(leads.id, leadReviews.leadId))
        .where(filter);
      const items = await db
        .select(summary)
        .from(leads)
        .leftJoin(leadReviews, eq(leads.id, leadReviews.leadId))
        .where(filter)
        .orderBy(desc(leads.createdAt), desc(leads.id))
        .limit(20)
        .offset(input.page * 20);
      return { total: total.count, items };
    }),
  detail: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await database();
      const [lead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, input.id));
      if (!lead)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prospecto no encontrado",
        });
      const [review] = await db
        .select()
        .from(leadReviews)
        .where(eq(leadReviews.leadId, input.id));
      const history = await db
        .select()
        .from(leadReviewEvents)
        .where(eq(leadReviewEvents.leadId, input.id))
        .orderBy(desc(leadReviewEvents.version));
      return {
        ...lead,
        review: review ?? {
          status: "new" as const,
          version: 0,
          fields: emptyReview,
          transferredAt: null,
          reviewerName: null,
        },
        history,
      };
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        version: z.number().int().min(0),
        status: reviewState,
        fields: reviewFields,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await database();
      return db.transaction(
        async (tx: NonNullable<Awaited<ReturnType<typeof getDb>>>) => {
          // Lock the parent even for first review: concurrent first saves cannot overwrite each other.
          const [lead] = await tx
            .select({ id: leads.id })
            .from(leads)
            .where(eq(leads.id, input.id))
            .for("update");
          if (!lead)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Prospecto no encontrado",
            });
          const [previous] = await tx
            .select()
            .from(leadReviews)
            .where(eq(leadReviews.leadId, input.id));
          if ((previous?.version ?? 0) !== input.version)
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "Otra persona actualizó la ficha. Ciérrala y vuelve a abrirla antes de guardar.",
            });
          if (previous?.status === "transferred")
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "La transferencia ya está registrada. El seguimiento continúa en el CRM de la empresa.",
            });
          const f = input.fields;
          if (
            ["qualified", "transferred"].includes(input.status) &&
            !(f.contactVerified && f.needConfirmed && f.serviceFit && f.areaFit)
          )
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Revisa los cuatro criterios antes de calificar.",
            });
          if (
            ["needs_info", "discarded"].includes(input.status) &&
            f.reason.length < 5
          )
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Indica qué información falta o el motivo del descarte.",
            });
          if (
            input.status === "transferred" &&
            (previous?.status !== "qualified" || !f.reference)
          )
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "Primero guarda el lead como calificado. Después registra la referencia del CRM de la empresa.",
            });
          const now = new Date();
          const fields = {
            ...f,
            reference: input.status === "transferred" ? f.reference : "",
          };
          const data = {
            leadId: input.id,
            status: input.status,
            version: input.version + 1,
            fields,
            reviewedBy: ctx.user.id,
            reviewerName:
              ctx.user.name || ctx.user.email || `Administrador ${ctx.user.id}`,
            updatedAt: now,
            transferredAt: input.status === "transferred" ? now : null,
          };
          await tx
            .insert(leadReviews)
            .values(data)
            .onConflictDoUpdate({ target: leadReviews.leadId, set: data });
          await tx.insert(leadReviewEvents).values({ ...data, createdAt: now });
          return { success: true };
        }
      );
    }),
});
