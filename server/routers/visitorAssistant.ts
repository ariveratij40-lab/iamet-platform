import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
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
  chat: visitorProcedure
    .input(
      z.object({
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
      if (!ENV.llmApiKey) return { ...guidance, mode: "guide" as const };
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
        if (!reply) return { ...guidance, mode: "guide" as const };
        return {
          reply: reply.slice(0, 2200),
          actions: guidance.actions,
          mode: "ai" as const,
        };
      } catch {
        return { ...guidance, mode: "guide" as const };
      }
    }),
});
