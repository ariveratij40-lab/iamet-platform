import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { leads, type InsertLead } from "../../drizzle/schema";
const stage = z.enum([
  "new",
  "contacted",
  "qualified",
  "proposal",
  "closed_won",
  "closed_lost",
]);
const days = z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30);
async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "Base de datos no disponible",
    });
  return db;
}
// New CRM capture path: no inherited scoring, reminders or external sync.
export async function captureCrmV2Lead(data: InsertLead): Promise<number> {
  const db = await database();
  const [created] = await db
    .insert(leads)
    .values({
      ...data,
      score: 0,
      scoreBreakdown: null,
      status: "new",
      notes: null,
    })
    .returning({ id: leads.id });
  if (!created)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "No se pudo registrar la solicitud",
    });
  return created.id;
}
export const crmV2Router = router({
  overview: adminProcedure
    .input(z.object({ days }))
    .query(async ({ input }) => {
      const db = await database();
      const filter = gte(
        leads.createdAt,
        new Date(Date.now() - input.days * 86400000)
      );
      const stages = await db
        .select({ status: leads.status, count: sql<number>`count(*)::int` })
        .from(leads)
        .where(filter)
        .groupBy(leads.status);
      const sources = await db
        .select({ source: leads.source, count: sql<number>`count(*)::int` })
        .from(leads)
        .where(filter)
        .groupBy(leads.source);
      const latest = await db
        .select({
          id: leads.id,
          company: leads.company,
          contactName: leads.contactName,
          status: leads.status,
          createdAt: leads.createdAt,
        })
        .from(leads)
        .where(filter)
        .orderBy(desc(leads.createdAt), desc(leads.id))
        .limit(5);
      return { stages, sources, latest };
    }),
  list: adminProcedure
    .input(
      z.object({
        days,
        page: z.number().int().min(0).default(0),
        status: stage.optional(),
        search: z.string().trim().max(150).default(""),
      })
    )
    .query(async ({ input }) => {
      const db = await database();
      const filter = and(
        gte(leads.createdAt, new Date(Date.now() - input.days * 86400000)),
        input.status ? eq(leads.status, input.status) : undefined,
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
        .where(filter);
      const items = await db
        .select({
          id: leads.id,
          company: leads.company,
          contactName: leads.contactName,
          email: leads.email,
          source: leads.source,
          status: leads.status,
          verticalSlug: leads.verticalSlug,
          createdAt: leads.createdAt,
        })
        .from(leads)
        .where(filter)
        .orderBy(desc(leads.createdAt), desc(leads.id))
        .limit(20)
        .offset(input.page * 20);
      return { total: total.count as number, items };
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
      return lead;
    }),
  update: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: stage,
        notes: z.string().trim().max(5000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await database();
      const result = await db
        .update(leads)
        .set({
          status: input.status,
          notes: input.notes,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.id))
        .returning({ id: leads.id });
      if (!result.length)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prospecto no encontrado",
        });
      return { success: true };
    }),
});
