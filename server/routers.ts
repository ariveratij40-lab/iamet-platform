import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import {
  getVerticals, getVerticalBySlug,
  createLead, getLeads, updateLeadStatus, calculateLeadScore,
  createConversation, getConversationBySession, updateConversation, getConversations,
  addMessage, getMessagesByConversation,
  createAdvisorSession, getAdvisorSession, updateAdvisorSession,
  getCourses, getCourseBySlug, createEnrollment,
  getAnalytics,
} from "./db";
import { nanoid } from "nanoid";

// ─── Admin Procedure ──────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso restringido a administradores." });
  }
  return next({ ctx });
});

// ─── IAMET System Prompt ──────────────────────────────────────────────────────
const IAMET_SYSTEM_PROMPT = `Eres el Agente Virtual IAMET, el asesor tecnológico digital de IAMET Evolución Tecnológica, una empresa mexicana especializada en infraestructura tecnológica, seguridad electrónica, RFID, automatización, software, inteligencia artificial y servicios administrados.

Tu misión es:
1. Identificar las necesidades tecnológicas del usuario mediante preguntas estratégicas.
2. Diagnosticar problemas tecnológicos actuales de su empresa.
3. Recomendar soluciones específicas de IAMET según el perfil del usuario.
4. Calificar el interés y urgencia del prospecto (lead scoring).

Verticales de IAMET:
- Infraestructura Tecnológica: redes, servidores, cableado, cloud
- Seguridad Electrónica: CCTV, control de acceso, alarmas
- RFID y Automatización: inventarios, activos, IoT
- Software e IA: desarrollo a medida, agentes IA, RPA
- Servicios Administrados: NOC 24/7, pólizas, soporte
- Educación Tecnológica: IAMET Academy, cursos, certificaciones
- Compliance y Auditoría: ISO 27001, NIST, gestión de riesgos

Instrucciones de comportamiento:
- Responde siempre en español, de forma profesional pero cercana.
- Haz preguntas específicas para entender el sector, tamaño de empresa y problemas actuales.
- Cuando identifiques una necesidad clara, recomienda la vertical o solución de IAMET más adecuada.
- Si el usuario muestra interés en contratar, invítalo a dejar sus datos de contacto o agendar una reunión.
- Mantén respuestas concisas (máximo 3 párrafos) a menos que se solicite más detalle.
- No menciones competidores. Enfócate en el valor de IAMET.`;

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Verticals ─────────────────────────────────────────────────────────────
  verticals: router({
    list: publicProcedure.query(() => getVerticals()),
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => getVerticalBySlug(input.slug)),
  }),

  // ─── Leads ─────────────────────────────────────────────────────────────────
  leads: router({
    create: publicProcedure
      .input(
        z.object({
          company: z.string().min(2),
          contactName: z.string().min(2),
          email: z.string().email(),
          phone: z.string().optional(),
          industry: z.string().optional(),
          companySize: z.enum(["1-10", "11-50", "51-200", "201-500", "500+"]).optional(),
          problemDescription: z.string().optional(),
          verticalSlug: z.string().optional(),
          source: z.enum(["form", "agent", "advisor", "academy"]).default("form"),
        })
      )
      .mutation(async ({ input }) => {
        const leadId = await createLead(input);
        // Notify owner
        const { score } = calculateLeadScore(input);
        await notifyOwner({
          title: `🎯 Nuevo Lead IAMET — Score: ${score}/100`,
          content: `**Empresa:** ${input.company}\n**Contacto:** ${input.contactName}\n**Email:** ${input.email}\n**Vertical:** ${input.verticalSlug ?? "No especificada"}\n**Fuente:** ${input.source}\n**Score:** ${score}/100`,
        }).catch(() => {});
        return { id: leadId, score };
      }),

    list: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          verticalSlug: z.string().optional(),
          limit: z.number().optional(),
        }).optional()
      )
      .query(({ input }) => getLeads(input ?? {})),

    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.string(), notes: z.string().optional() }))
      .mutation(({ input }) => updateLeadStatus(input.id, input.status, input.notes)),

    scorePreview: publicProcedure
      .input(
        z.object({
          companySize: z.string().optional(),
          industry: z.string().optional(),
          problemDescription: z.string().optional(),
          verticalSlug: z.string().optional(),
          source: z.string().optional(),
        })
      )
      .query(({ input }) => calculateLeadScore(input)),
  }),

  // ─── Agente Virtual IAMET ──────────────────────────────────────────────────
  agent: router({
    startSession: publicProcedure
      .input(z.object({ visitorId: z.string().optional() }))
      .mutation(async ({ input }) => {
        const sessionId = nanoid(16);
        await createConversation({
          sessionId,
          visitorId: input.visitorId,
          status: "active",
        });
        return { sessionId };
      }),

    sendMessage: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          message: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ input }) => {
        const conversation = await getConversationBySession(input.sessionId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Sesión no encontrada." });
        }

        // Save user message
        await addMessage({
          conversationId: conversation.id,
          role: "user",
          content: input.message,
        });

        // Get conversation history
        const history = await getMessagesByConversation(conversation.id);
        const llmMessages = [
          { role: "system" as const, content: IAMET_SYSTEM_PROMPT },
          ...history.slice(-12).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        // Call LLM
        const response = await invokeLLM({ messages: llmMessages });
        const rawContent = response?.choices?.[0]?.message?.content;
        const assistantContent =
          typeof rawContent === "string" ? rawContent : "Disculpa, ocurrió un error. ¿Puedes repetir tu pregunta?";

        // Save assistant message
        await addMessage({
          conversationId: conversation.id,
          role: "assistant",
          content: assistantContent,
        });

        // Update conversation metadata
        const messageCount = history.length + 2;
        if (messageCount >= 4) {
          const scoreMessages = [
            {
              role: "system" as const,
              content: `Analiza la conversación y responde SOLO con un JSON: {"score": número del 0 al 100, "intent": "string describiendo la necesidad principal", "vertical": "slug de la vertical más relevante de: infraestructura|seguridad|rfid|software-ia|servicios-administrados|educacion|compliance"}`,
            },
            ...llmMessages.slice(1),
          ];
          try {
            const scoreResp = await invokeLLM({ messages: scoreMessages });
            const rawScore = scoreResp?.choices?.[0]?.message?.content;
            const scoreText = typeof rawScore === "string" ? rawScore : "{}";
            const parsed = JSON.parse(scoreText.replace(/```json|```/g, "").trim());
            await updateConversation(input.sessionId, {
              leadScore: parsed.score ?? 0,
              detectedIntent: parsed.intent ?? "",
              verticalSlug: parsed.vertical ?? null,
            });
          } catch {
            // Score update is non-critical
          }
        }

        return { reply: assistantContent };
      }),

    getHistory: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const conversation = await getConversationBySession(input.sessionId);
        if (!conversation) return { messages: [] };
        const msgs = await getMessagesByConversation(conversation.id);
        return { messages: msgs.filter((m) => m.role !== "system") };
      }),

    listAll: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(({ input }) => getConversations(input?.limit ?? 50)),
  }),

  // ─── IAMET Tech Advisor ────────────────────────────────────────────────────
  advisor: router({
    startSession: publicProcedure
      .input(z.object({ visitorId: z.string().optional() }))
      .mutation(async ({ input }) => {
        const sessionId = nanoid(16);
        await createAdvisorSession({ sessionId, visitorId: input.visitorId });
        return { sessionId };
      }),

    updateStep: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          sector: z.string().optional(),
          companySize: z.string().optional(),
          currentProblems: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateAdvisorSession(input.sessionId, {
          sector: input.sector,
          companySize: input.companySize,
          currentProblems: input.currentProblems as any,
        });
        return { ok: true };
      }),

    generateRecommendations: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          sector: z.string(),
          companySize: z.string(),
          currentProblems: z.array(z.string()),
        })
      )
      .mutation(async ({ input }) => {
        const prompt = `Eres el Agente Virtual IAMET. Un prospecto tiene el siguiente perfil:
- Sector: ${input.sector}
- Tamaño de empresa: ${input.companySize} empleados
- Problemas actuales: ${input.currentProblems.join(", ")}

Genera recomendaciones personalizadas en JSON con este formato exacto:
{
  "summary": "párrafo de 2-3 oraciones resumiendo el diagnóstico",
  "recommendations": [
    {
      "vertical": "slug de la vertical",
      "verticalName": "nombre completo",
      "priority": "alta|media|baja",
      "solution": "nombre de la solución específica",
      "description": "descripción de 1-2 oraciones de por qué esta solución aplica",
      "benefit": "beneficio principal esperado"
    }
  ],
  "nextStep": "recomendación de acción inmediata"
}
Incluye entre 2 y 4 recomendaciones ordenadas por prioridad.`;

        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
        });

        const rawAdvisorContent = response?.choices?.[0]?.message?.content;
        const content = typeof rawAdvisorContent === "string" ? rawAdvisorContent : "{}";
        let recommendations: any = {};
        try {
          recommendations = JSON.parse(content.replace(/```json|```/g, "").trim());
        } catch {
          recommendations = { summary: "No se pudieron generar recomendaciones.", recommendations: [], nextStep: "" };
        }

        await updateAdvisorSession(input.sessionId, {
          sector: input.sector,
          companySize: input.companySize,
          currentProblems: input.currentProblems as any,
          recommendations: recommendations as any,
          recommendedVerticals: (recommendations.recommendations ?? []).map((r: any) => r.vertical) as any,
          completed: true,
        });

        return recommendations;
      }),

    getSession: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => getAdvisorSession(input.sessionId)),
  }),

  // ─── IAMET Academy ─────────────────────────────────────────────────────────
  academy: router({
    listCourses: publicProcedure
      .input(z.object({ verticalSlug: z.string().optional() }).optional())
      .query(({ input }) => getCourses(input?.verticalSlug)),

    getCourse: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => getCourseBySlug(input.slug)),

    enroll: publicProcedure
      .input(
        z.object({
          courseId: z.number(),
          name: z.string().min(2),
          email: z.string().email(),
          company: z.string().optional(),
          phone: z.string().optional(),
          message: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const enrollmentId = await createEnrollment(input);
        // Also create a lead
        await createLead({
          company: input.company ?? "No especificada",
          contactName: input.name,
          email: input.email,
          phone: input.phone,
          source: "academy",
          verticalSlug: "educacion",
        });
        await notifyOwner({
          title: `📚 Nueva inscripción IAMET Academy`,
          content: `**Nombre:** ${input.name}\n**Email:** ${input.email}\n**Empresa:** ${input.company ?? "N/A"}\n**Curso ID:** ${input.courseId}`,
        }).catch(() => {});
        return { id: enrollmentId };
      }),
  }),

  // ─── Analytics (Admin) ─────────────────────────────────────────────────────
  analytics: router({
    dashboard: adminProcedure.query(() => getAnalytics()),
  }),
});

export type AppRouter = typeof appRouter;
