import { z } from "zod";
import { router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { subscribers, conversations } from "../../drizzle/schema";
import { eq, desc, sql, like, and, or } from "drizzle-orm";

// Admin-only guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acceso restringido a administradores.",
    });
  }
  return next({ ctx });
});

export const adminSubscribersRouter = router({
  // ── Listar suscriptores ──────────────────────────────────────────────────
  list: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(100).optional().default(20),
        search: z.string().optional(),
        plan: z.enum(["free", "pro", "enterprise"]).optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { subscribers: [], total: 0 };

      const offset = (input.page - 1) * input.limit;

      const conditions = [];
      if (input.search) {
        conditions.push(
          or(
            like(subscribers.email, `%${input.search}%`),
            like(subscribers.name, `%${input.search}%`),
            like(subscribers.company ?? subscribers.name, `%${input.search}%`)
          )
        );
      }
      if (input.plan) conditions.push(eq(subscribers.plan, input.plan));
      if (input.status) conditions.push(eq(subscribers.status, input.status));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select({
          id: subscribers.id,
          email: subscribers.email,
          name: subscribers.name,
          company: subscribers.company,
          phone: subscribers.phone,
          plan: subscribers.plan,
          status: subscribers.status,
          createdAt: subscribers.createdAt,
          updatedAt: subscribers.updatedAt,
        })
        .from(subscribers)
        .where(whereClause)
        .orderBy(desc(subscribers.createdAt))
        .limit(input.limit)
        .offset(offset);

      const [countRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(subscribers)
        .where(whereClause);

      const total = Number(countRow?.count ?? 0);

      return { subscribers: rows, total };
    }),

  // ── Estadísticas de suscriptores ──────────────────────────────────────────
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      return {
        total: 0,
        active: 0,
        free: 0,
        pro: 0,
        enterprise: 0,
        newThisWeek: 0,
      };

    const [totals] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscribers);

    const [activeCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscribers)
      .where(eq(subscribers.status, "active"));

    const [freeCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscribers)
      .where(eq(subscribers.plan, "free"));

    const [proCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscribers)
      .where(eq(subscribers.plan, "pro"));

    const [enterpriseCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscribers)
      .where(eq(subscribers.plan, "enterprise"));

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [newThisWeek] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(subscribers)
      .where(sql`${subscribers.createdAt} >= ${oneWeekAgo}`);

    return {
      total: Number(totals?.count ?? 0),
      active: Number(activeCount?.count ?? 0),
      free: Number(freeCount?.count ?? 0),
      pro: Number(proCount?.count ?? 0),
      enterprise: Number(enterpriseCount?.count ?? 0),
      newThisWeek: Number(newThisWeek?.count ?? 0),
    };
  }),

  // ── Actualizar plan/status ────────────────────────────────────────────────
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        plan: z.enum(["free", "pro", "enterprise"]).optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
        name: z.string().optional(),
        company: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.plan !== undefined) updateData.plan = input.plan;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.name !== undefined) updateData.name = input.name;
      if (input.company !== undefined) updateData.company = input.company;

      await db
        .update(subscribers)
        .set(updateData)
        .where(eq(subscribers.id, input.id));

      return { ok: true };
    }),

  // ── Eliminar suscriptor ───────────────────────────────────────────────────
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Desvincular conversaciones antes de eliminar
      await db
        .update(conversations)
        .set({ subscriberId: null })
        .where(eq(conversations.subscriberId, input.id));

      await db.delete(subscribers).where(eq(subscribers.id, input.id));
      return { ok: true };
    }),

  // ── Ver conversaciones de un suscriptor ──────────────────────────────────
  subscriberConversations: adminProcedure
    .input(z.object({ subscriberId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select({
          id: conversations.id,
          sessionId: conversations.sessionId,
          status: conversations.status,
          summary: conversations.summary,
          detectedIntent: conversations.detectedIntent,
          leadScore: conversations.leadScore,
          createdAt: conversations.createdAt,
        })
        .from(conversations)
        .where(eq(conversations.subscriberId, input.subscriberId))
        .orderBy(desc(conversations.createdAt))
        .limit(50);
    }),
});
