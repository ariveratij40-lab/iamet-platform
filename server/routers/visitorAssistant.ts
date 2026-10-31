import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  assistantConversations as conversations,
  assistantTurns as turns,
} from "../../drizzle/schema";
import { recordAssistantTurn } from "../assistant-history";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";
import { invokeLLM } from "../_core/llm";
import {
  visitorGuidance,
  visitorSystemPrompt,
} from "../../shared/visitor-assistant";
const visitorRequests = new Map<string, { until: number; count: number }>();
// Enforce the limit per procedure invocation, including calls inside a tRPC batch.
const visitorProcedure = publicProcedure.use(({ ctx, next }) => {
  const now = Date.now();
  if (visitorRequests.size > 1000)
    visitorRequests.forEach((value, key) => {
      if (value.until <= now) visitorRequests.delete(key);
    });
  const key = ctx.req.ip ?? ctx.req.socket?.remoteAddress ?? "unknown";
  const previous = visitorRequests.get(key);
  const entry =
    previous && previous.until > now
      ? previous
      : { until: now + 60000, count: 0 };
  if (entry.count >= 12 || (!previous && visitorRequests.size >= 10000))
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Espere un momento antes de continuar la conversación.",
    });
  entry.count++;
  visitorRequests.set(key, entry);
  return next();
});
export const visitorAssistantRouter = router({
  dashboard: adminProcedure
    .input(
      z.object({
        days: z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30),
        page: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "SERVICE_UNAVAILABLE",
          message: "Base de datos no disponible",
        });
      const since = new Date(Date.now() - input.days * 86400000);
      const filter = gte(turns.createdAt, since);
      const [totals] = await db
        .select({
          conversations: sql<number>`count(distinct ${turns.conversationId})::int`,
          exchanges: sql<number>`count(*)::int`,
          ai: sql<number>`count(*) filter (where ${turns.mode} = 'ai')::int`,
          guide: sql<number>`count(*) filter (where ${turns.mode} = 'guide')::int`,
        })
        .from(turns)
        .where(filter);
      const topics = await db
        .select({ topic: turns.topic, count: sql<number>`count(*)::int` })
        .from(turns)
        .where(filter)
        .groupBy(turns.topic)
        .orderBy(sql`count(*) desc`);
      const daily = await db
        .select({
          day: sql<string>`to_char(${turns.createdAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(turns)
        .where(filter)
        .groupBy(sql`to_char(${turns.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${turns.createdAt}, 'YYYY-MM-DD')`);
      const items = await db
        .select({
          id: conversations.id,
          page: conversations.page,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
          exchanges: sql<number>`count(${turns.id})::int`,
        })
        .from(conversations)
        .innerJoin(turns, eq(turns.conversationId, conversations.id))
        .where(filter)
        .groupBy(conversations.id)
        .orderBy(desc(conversations.updatedAt))
        .limit(20)
        .offset(input.page * 20);
      return { totals, topics, daily, items };
    }),
  transcript: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "SERVICE_UNAVAILABLE" });
      const [conversation] = await db
        .select({
          id: conversations.id,
          page: conversations.page,
          createdAt: conversations.createdAt,
        })
        .from(conversations)
        .where(eq(conversations.id, input.id));
      if (!conversation) throw new TRPCError({ code: "NOT_FOUND" });
      const messages = await db
        .select({
          id: turns.id,
          question: turns.question,
          answer: turns.answer,
          mode: turns.mode,
          createdAt: turns.createdAt,
        })
        .from(turns)
        .where(eq(turns.conversationId, input.id))
        .orderBy(turns.id);
      return { conversation, messages };
    }),
  chat: visitorProcedure
    .input(
      z.object({
        conversation: z
          .object({
            id: z.string().uuid(),
            token: z.string().regex(/^[a-f0-9]{64}$/),
          })
          .optional(),
        messages: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().trim().min(1).max(2000),
            })
          )
          .min(1)
          .max(8),
        contextPath: z
          .string()
          .max(180)
          .regex(/^\/(?:[a-z0-9\/-]*)$/)
          .default("/"),
      })
    )
    .mutation(async ({ input }) => {
      const last = input.messages.at(-1);
      if (last?.role !== "user")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Escriba su consulta para continuar.",
        });
      const guidance = visitorGuidance(last.content, input.contextPath);
      const finish = async (result: {
        reply: string;
        actions: typeof guidance.actions;
        mode: "ai" | "guide";
      }) => {
        try {
          const conversation = await recordAssistantTurn({
            conversation: input.conversation,
            page: input.contextPath,
            question: last.content,
            answer: result.reply,
            mode: result.mode,
            topic:
              guidance.actions
                .find(a => a.href.startsWith("/cotizacion?solucion="))
                ?.href.split("solucion=")[1] ?? "general",
          });
          return { ...result, conversation, recorded: !!conversation };
        } catch {
          return { ...result, conversation: null, recorded: false };
        }
      };
      if (!ENV.llmApiKey) return finish({ ...guidance, mode: "guide" });
      try {
        const result = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                visitorSystemPrompt() +
                `\nOrientación de la página: ${guidance.reply}`,
            },
            ...input.messages,
          ],
          maxTokens: 450,
          signal: AbortSignal.timeout(12000),
        });
        const content = result.choices?.[0]?.message?.content;
        const reply = typeof content === "string" ? content.trim() : "";
        if (!reply) return finish({ ...guidance, mode: "guide" });
        return finish({
          reply: reply.slice(0, 2200),
          actions: guidance.actions,
          mode: "ai",
        });
      } catch {
        return finish({ ...guidance, mode: "guide" });
      }
    }),
});
