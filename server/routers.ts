import { TRPCError } from "@trpc/server";
import { storeAuthRouter as newStoreAuthRouter } from "./routers/storeAuth";
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
  createConversation,   getConversationBySession, getLatestConversationByVisitor, updateConversation, getConversations,
  addMessage, getMessagesByConversation,
  createAdvisorSession, getAdvisorSession, updateAdvisorSession,
  getCourses, getCourseBySlug, createEnrollment,
  getAnalytics,
  upsertVisitorSession,
  addPageEvent,
  getLiveVisitors,
  getVisitorEvents,
  getVisitorStats,
  addLiveChatMessage,
  getLiveChatMessages,
  markLiveChatRead,
  getActiveLiveSessions,
  getStoreCategories,
  getStoreProducts,
  getStoreProductBySlug,
  createQuoteRequest,
  getQuoteRequests,
  updateQuoteStatus,
  upsertStoreProduct,
  toggleStoreProductActive,
  seedStoreData,
  adminGetStoreProducts,
  adminUpsertProduct,
  adminToggleProductActive,
  adminDeleteProduct,
  createOrUpdateStoreVisitor,
  verifyStoreVisitorToken,
  getStoreVisitorByEmail,
  adminGetStoreVisitors,
  getSavedCart,
  upsertSavedCart,
  getQuotesByUser,
} from "./db";
import { nanoid } from "nanoid";
import { detectInfrastructureTopic, buildSystemPrompt } from "./panduit-utils";
import { buildSpecialistPrompt, detectSpecialist } from "./specialists";
import { sendVerificationEmail, sendQuoteNotificationEmail } from "./email";

// ─── Admin Procedure ──────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso restringido a administradores." });
  }
  return next({ ctx });
});



// ─── Admin Store Router (CRUD de productos) ───────────────────────────────────
const adminStoreRouter = router({
  getProducts: adminProcedure
    .input(z.object({ page: z.number().optional(), limit: z.number().optional(), categoryId: z.number().optional() }))
    .query(async ({ input }) => {
      return adminGetStoreProducts(input);
    }),
  upsertProduct: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      categoryId: z.number(),
      name: z.string().min(1),
      shortDesc: z.string().optional(),
      description: z.string().optional(),
      sku: z.string().optional(),
      priceRef: z.number().optional(),
      unit: z.string().optional(),
      imageUrl: z.string().optional(),
      dataSheetUrl: z.string().optional(),
      deliveryTime: z.string().optional(),
      featured: z.boolean().optional(),
      active: z.boolean().optional(),
      specs: z.record(z.string(), z.string()).optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      return adminUpsertProduct(input as any);
    }),
  toggleActive: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const newActive = await adminToggleProductActive(input.id);
      return { active: newActive };
    }),
  deleteProduct: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await adminDeleteProduct(input.id);
      return { ok: true };
    }),
  getVisitors: adminProcedure.query(async () => {
    return adminGetStoreVisitors(100);
  }),
  uploadFile: adminProcedure
    .input(z.object({ base64: z.string(), mimeType: z.string(), fileName: z.string() }))
    .mutation(async ({ input }) => {
      const { storagePut } = await import("./storage");
      const buffer = Buffer.from(input.base64, "base64");
      const key = `store/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
});

// ─── Store Auth Router (LEGACY — reemplazado por ./routers/storeAuth.ts) ─────────────────
const _legacyStoreAuthRouter = router({
  register: publicProcedure
    .input(z.object({ name: z.string().min(1), email: z.string().email(), phone: z.string().optional(), origin: z.string().url().optional() }))
    .mutation(async ({ input }) => {
      const { visitor, isNew } = await createOrUpdateStoreVisitor(input);
      const baseUrl = (input.origin ?? process.env.VITE_APP_URL ?? "https://iamettech-ssx5e88n.manus.space").replace(/\/+$/, "");
      const verifyUrl = `${baseUrl}/tienda/verificar?token=${visitor.verificationToken}`;

      // Enviar correo de verificación al visitante
      const emailResult = await sendVerificationEmail({
        to: input.email,
        name: input.name,
        verifyUrl,
      });

      // Notificar al owner con copia del registro
      await notifyOwner({
        title: `Nuevo registro en Tienda IAMET: ${input.name}`,
        content: `Nombre: ${input.name}\nEmail: ${input.email}\nTeléfono: ${input.phone ?? "—"}\n\nCorreo enviado: ${emailResult.ok ? "✅ Sí" : "❌ No — " + (emailResult.error ?? "")}\n\nLink de verificación: ${verifyUrl}`,
      }).catch(() => {});

      return { ok: true, email: input.email, isNew, emailSent: emailResult.ok };
    }),
  verify: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const visitor = await verifyStoreVisitorToken(input.token);
      if (!visitor) throw new TRPCError({ code: "BAD_REQUEST", message: "Token inválido o expirado" });
      // Return a simple session token (email + timestamp signed)
      const sessionToken = Buffer.from(JSON.stringify({ email: visitor.email, name: visitor.name, ts: Date.now() })).toString("base64");
      return { ok: true, visitor: { name: visitor.name, email: visitor.email }, sessionToken };
    }),
  checkEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      const visitor = await getStoreVisitorByEmail(input.email);
      if (!visitor) return { exists: false, verified: false };
      return { exists: true, verified: !!visitor.verifiedAt };
    }),
  resend: publicProcedure
    .input(z.object({ email: z.string().email(), origin: z.string().url().optional() }))
    .mutation(async ({ input }) => {
      const visitor = await getStoreVisitorByEmail(input.email);
      if (!visitor) throw new TRPCError({ code: "NOT_FOUND", message: "Email no registrado" });
      const { visitor: updated } = await createOrUpdateStoreVisitor({ name: visitor.name, email: visitor.email, phone: visitor.phone ?? undefined });
      const baseUrl = (input.origin ?? process.env.VITE_APP_URL ?? "https://iamettech-ssx5e88n.manus.space").replace(/\/+$/, "");
      const verifyUrl = `${baseUrl}/tienda/verificar?token=${updated.verificationToken}`;

      // Enviar correo de verificación al visitante
      const emailResult = await sendVerificationEmail({
        to: input.email,
        name: visitor.name,
        verifyUrl,
      });

      await notifyOwner({
        title: `Reenvío de verificación Tienda IAMET: ${visitor.name}`,
        content: `Email: ${visitor.email}\n\nCorreo enviado: ${emailResult.ok ? "✅ Sí" : "❌ No — " + (emailResult.error ?? "")}\n\nLink de verificación: ${verifyUrl}`,
      }).catch(() => {});

      return { ok: true, emailSent: emailResult.ok };
    }),
});

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
          specialistId: z.string().optional(),
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

        // Build system prompt: use specialist if provided, else auto-detect
        const specialistId = input.specialistId ?? detectSpecialist(history);
        const systemPrompt = specialistId
          ? buildSpecialistPrompt(specialistId)
          : buildSystemPrompt(history);
        const llmMessages = [
          { role: "system" as const, content: systemPrompt },
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

        // Detect if infrastructure topic is active for frontend indicator
        const isInfraMode = detectInfrastructureTopic(history);
        const activeSpecialistId = specialistId ?? detectSpecialist([...history, { role: 'assistant', content: assistantContent }]);

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

        return { reply: assistantContent, isInfraMode, specialistId: activeSpecialistId };
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

  // ─── Visitor Tracking (público) ──────────────────────────────────────────────
  tracking: router({
    heartbeat: publicProcedure
      .input(
        z.object({
          visitorId: z.string(),
          currentPage: z.string().optional(),
          currentSection: z.string().optional(),
          chatActive: z.boolean().optional(),
          chatDuration: z.number().optional(),
          chatMessages: z.number().optional(),
          referrer: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const ip =
          (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          (ctx.req.socket as any)?.remoteAddress ||
          "";
        const userAgent = ctx.req.headers["user-agent"] ?? "";
        let geoData: { country?: string; city?: string; countryCode?: string } = {};
        if (ip && ip !== "::1" && ip !== "127.0.0.1") {
          try {
            const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,countryCode,status`);
            const geo = await geoRes.json() as any;
            if (geo.status === "success") {
              geoData = { country: geo.country, city: geo.city, countryCode: geo.countryCode };
            }
          } catch { /* silencioso */ }
        }
        await upsertVisitorSession({
          visitorId: input.visitorId,
          currentPage: input.currentPage,
          currentSection: input.currentSection,
          chatActive: input.chatActive,
          chatDuration: input.chatDuration,
          chatMessages: input.chatMessages,
          referrer: input.referrer,
          ip,
          userAgent,
          ...geoData,
        });
        return { ok: true };
      }),

    logEvent: publicProcedure
      .input(
        z.object({
          visitorId: z.string(),
          event: z.enum(["page_view", "section_change", "chat_open", "chat_message", "service_click", "heartbeat"]),
          page: z.string().optional(),
          section: z.string().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await addPageEvent({
          visitorId: input.visitorId,
          event: input.event,
          page: input.page,
          section: input.section,
          metadata: input.metadata as any,
        });
        return { ok: true };
      }),
  }),

  // ─── Admin Console (protegido) ────────────────────────────────────────────────
    adminConsole: router({
    liveVisitors: adminProcedure
      .input(z.object({ windowMinutes: z.number().optional() }).optional())
      .query(({ input }) => getLiveVisitors((input?.windowMinutes ?? 2) * 60 * 1000)),
    visitorEvents: adminProcedure
      .input(z.object({ visitorId: z.string(), limit: z.number().optional() }))
      .query(({ input }) => getVisitorEvents(input.visitorId, input.limit)),
    stats: adminProcedure.query(() => getVisitorStats()),
    chatHistory: adminProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
      .query(({ input }) => getConversations(input?.limit ?? 50)),
    conversationMessages: adminProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(({ input }) => getMessagesByConversation(input.conversationId)),
    }),

  // ─── Live Chat ────────────────────────────────────────────────────────────────────────────────────────────
  liveChat: router({
    // Admin: tomar control de una sesión
    takeOver: adminProcedure
      .input(z.object({ sessionId: z.string(), agentName: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const agentName = input.agentName ?? ctx.user.name ?? "Soporte IAMET";
        await updateConversation(input.sessionId, { humanTookOver: true, humanAgentName: agentName });
        return { ok: true, agentName };
      }),

    // Admin: liberar sesión (vuelve al agente IA)
    release: adminProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        await updateConversation(input.sessionId, { humanTookOver: false, humanAgentName: null as any });
        return { ok: true };
      }),

    // Admin: enviar mensaje al visitante
    sendMessage: adminProcedure
      .input(z.object({ sessionId: z.string(), content: z.string(), agentName: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const agentName = input.agentName ?? ctx.user.name ?? "Soporte IAMET";
        await updateConversation(input.sessionId, { humanTookOver: true, humanAgentName: agentName });
        await addLiveChatMessage({
          sessionId: input.sessionId,
          role: "human",
          content: input.content,
          agentName,
          read: true,
        });
        return { ok: true };
      }),

    // Admin: obtener sesiones activas intervenidas
    getActiveSessions: adminProcedure.query(() => getActiveLiveSessions()),

    // Admin: obtener mensajes de una sesión
    getMessages: adminProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        await markLiveChatRead(input.sessionId);
        return getLiveChatMessages(input.sessionId);
      }),

    // Público: visitante verifica si hay mensajes nuevos del humano (polling cada 3s)
    // Acepta sessionId (si ya inició chat) O visitorId (para detectar intervención antes de que inicie chat)
    pollMessages: publicProcedure
      .input(z.object({
        sessionId: z.string().optional(),
        visitorId: z.string().optional(),
        since: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const since = input.since ? new Date(input.since) : undefined;
        // Buscar la conversación por sessionId o por visitorId (la más reciente)
        let conv = input.sessionId ? await getConversationBySession(input.sessionId) : undefined;
        if (!conv && input.visitorId) {
          conv = await getLatestConversationByVisitor(input.visitorId);
        }
        if (!conv) return { messages: [], humanTookOver: false, humanAgentName: null, sessionId: null };
        const msgs = await getLiveChatMessages(conv.sessionId, since);
        return {
          messages: msgs,
          humanTookOver: conv.humanTookOver ?? false,
          humanAgentName: conv.humanAgentName ?? null,
          sessionId: conv.sessionId,
        };
      }),

    // Público: visitante envía mensaje de respuesta al humano
    visitorReply: publicProcedure
      .input(z.object({ sessionId: z.string(), content: z.string() }))
      .mutation(async ({ input }) => {
        await addLiveChatMessage({
          sessionId: input.sessionId,
          role: "user",
          content: input.content,
          read: false,
        });
        return { ok: true };
      }),
  }),

  // ─── Tienda IAMET (E-Commerce) ───────────────────────────────────────────────
  store: router({
    seedData: publicProcedure.mutation(async () => {
      return seedStoreData();
    }),
    getCategories: publicProcedure.query(async () => {
      return getStoreCategories();
    }),
    getProducts: publicProcedure
      .input(z.object({
        categorySlug: z.string().optional(),
        search: z.string().optional(),
        featuredOnly: z.boolean().optional(),
      }))
      .query(async ({ input }) => {
        return getStoreProducts(input);
      }),
    getProduct: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getStoreProductBySlug(input.slug);
      }),
    submitQuote: publicProcedure
      .input(z.object({
        visitorName: z.string().min(2),
        company: z.string().optional(),
        email: z.string().email(),
        phone: z.string().optional(),
        notes: z.string().optional(),
        userId: z.number().optional(), // usuario autenticado (opcional)
        storeUserId: z.number().optional(), // usuario de tienda propia (opcional)
        items: z.array(z.object({
          productId: z.number().optional(),
          productName: z.string(),
          productSku: z.string().optional(),
          quantity: z.number().min(1).default(1),
          notes: z.string().optional(),
        })).min(1),
      }))
      .mutation(async ({ input }) => {
        const refCode = `IAMET-${Date.now().toString(36).toUpperCase()}`;
        const quote = await createQuoteRequest(
          {
            refCode,
            userId: input.userId,
            storeUserId: input.storeUserId,
            visitorName: input.visitorName,
            company: input.company,
            email: input.email,
            phone: input.phone,
            notes: input.notes,
            status: "pending",
          } as any,
          input.items.map((i) => ({
            quoteRequestId: 0,
            productId: i.productId,
            productName: i.productName,
            productSku: i.productSku,
            quantity: i.quantity,
            notes: i.notes,
          }))
        );
        const itemList = input.items.map((i) => `- ${i.productName} x${i.quantity}`).join("\n");
        await notifyOwner({
          title: `Nueva solicitud de cotización: ${refCode}`,
          content: `**${input.visitorName}** (${input.company ?? "sin empresa"}) solicitó cotización.\n\nEmail: ${input.email}\nTeléfono: ${input.phone ?? "N/A"}\n\n**Productos:**\n${itemList}\n\nNotas: ${input.notes ?? "ninguna"}`,
        }).catch(() => {});
        // Notificación por email a alvaro.rivera@iamet.mx
        sendQuoteNotificationEmail({
          refCode,
          visitorName: input.visitorName,
          company: input.company,
          email: input.email,
          phone: input.phone,
          notes: input.notes,
          items: input.items.map((i) => ({
            productName: i.productName,
            productSku: i.productSku,
            quantity: i.quantity,
          })),
        }).catch(() => {});
        return { refCode, id: quote.id };
      }),
    // Carrito guardado (requiere autenticación)
    saveCart: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          productId: z.number(),
          productName: z.string(),
          productSku: z.string().optional(),
          quantity: z.number().min(1),
          imageUrl: z.string().optional(),
          priceRef: z.number().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertSavedCart(ctx.user.id, input.items);
        return { ok: true };
      }),
    getSavedCart: protectedProcedure.query(async ({ ctx }) => {
      const cart = await getSavedCart(ctx.user.id);
      return { items: (cart?.items as any[]) ?? [] };
    }),
    getMyQuotes: protectedProcedure.query(async ({ ctx }) => {
      return getQuotesByUser(ctx.user.id);
    }),
  }),

  // ─── Admin: Tienda y Cotizaciones ────────────────────────────────────────────
  adminStore: router({
    getQuotes: adminProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getQuoteRequests(input.limit ?? 50);
      }),
    updateQuoteStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "reviewed", "quoted", "closed"]) }))
      .mutation(async ({ input }) => {
        await updateQuoteStatus(input.id, input.status);
        return { ok: true };
      }),
    upsertProduct: adminProcedure
      .input(z.object({
        id: z.number().optional(),
        categoryId: z.number(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        shortDesc: z.string().optional(),
        sku: z.string().optional(),
        priceRef: z.number().optional(),
        unit: z.string().optional(),
        imageUrl: z.string().optional(),
        featured: z.boolean().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        await upsertStoreProduct(input as any);
        return { ok: true };
      }),
    toggleProductActive: adminProcedure
      .input(z.object({ id: z.number(), active: z.boolean() }))
      .mutation(async ({ input }) => {
        await toggleStoreProductActive(input.id, input.active);
        return { ok: true };
      }),
    getProducts: adminProcedure.query(async () => {
      return getStoreProducts({});
    }),
  }),
  adminStoreV2: adminStoreRouter,
  storeAuth: newStoreAuthRouter,
});
export type AppRouter = typeof appRouter;
