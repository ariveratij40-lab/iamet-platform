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
  getAvailableSlots,
  getAvailableDates,
  bookMeeting,
  getMeetings,
  cancelMeeting,
  getMeetingByCancelToken,
  trackAnalyticsEvent,
  getAnalyticsSummary,
  getAttributionSummary,
  adminGetFollowups,
  adminCancelFollowup,
  adminGetFollowupById,
} from "./db";
import { nanoid } from "nanoid";
import { detectInfrastructureTopic, buildSystemPrompt } from "./panduit-utils";
import { buildSpecialistPrompt, detectSpecialist } from "./specialists";
import { sendVerificationEmail, sendQuoteNotificationEmail, sendMeetingConfirmationEmail, sendMeetingCancellationEmail } from "./email";
import { scheduleMeetingReminders } from "./reminders";
import { scheduleLeadFollowups } from "./followups";
import { calculateLeadScore as calcScore, getLeadScore } from "./scoring";
import { addTimelineEvent } from "./timeline";
import { runAgentLoop } from "./agent-orchestrator";

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
          // Attribution
          utmSource: z.string().optional(),
          utmMedium: z.string().optional(),
          utmCampaign: z.string().optional(),
          utmTerm: z.string().optional(),
          utmContent: z.string().optional(),
          gclid: z.string().optional(),
          fbclid: z.string().optional(),
          msclkid: z.string().optional(),
          referrer: z.string().optional(),
          landingUrl: z.string().optional(),
          firstPage: z.string().optional(),
          sessionId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const leadId = await createLead(input);
        // Trigger: timeline + scoring + followups (fire-and-forget)
        Promise.all([
          addTimelineEvent(leadId, 'lead_created', 'Lead creado',
            `${input.contactName} de ${input.company ?? 'empresa desconocida'} se registró como lead`,
            { source: input.source, vertical: input.verticalSlug, email: input.email }
          ),
          calcScore(leadId).then(async (result) => {
            // Alert if Hot Lead (score >= 80)
            if (result.score >= 80) {
              await notifyOwner({
                title: `🔥 Lead Hot: ${input.company ?? input.contactName} — ${result.score}/100`,
                content: `**Empresa:** ${input.company}\n**Contacto:** ${input.contactName}\n**Score:** ${result.score}/100\n**Acción:** ${result.recommendation}\n**Vertical:** ${input.verticalSlug ?? 'No especificada'}\n**Fuente:** ${input.source}`,
              }).catch(() => {});
            } else {
              await notifyOwner({
                title: `🎯 Nuevo Lead IAMET — Score: ${result.score}/100`,
                content: `**Empresa:** ${input.company}\n**Contacto:** ${input.contactName}\n**Email:** ${input.email}\n**Vertical:** ${input.verticalSlug ?? 'No especificada'}\n**Fuente:** ${input.source}\n**Score:** ${result.score}/100`,
              }).catch(() => {});
            }
            return result;
          }),
          scheduleLeadFollowups(leadId).catch(() => {}),
        ]).catch(() => {});
        return { id: leadId };
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
      .mutation(async ({ input }) => {
        await updateLeadStatus(input.id, input.status, input.notes);
        // Trigger: timeline + recalculate score (fire-and-forget)
        Promise.all([
          addTimelineEvent(input.id, 'status_changed', 'Estado actualizado',
            `Estado del lead cambiado a: ${input.status}${input.notes ? ` — ${input.notes}` : ''}`,
            { newStatus: input.status }
          ),
          calcScore(input.id).then(async (result) => {
            if (result.score >= 80) {
              await notifyOwner({
                title: `🔥 Lead Hot: Score ${result.score}/100`,
                content: `**Lead ID:** ${input.id}\n**Nuevo estado:** ${input.status}\n**Score:** ${result.score}/100\n**Acción:** ${result.recommendation}`,
              }).catch(() => {});
            }
          }),
        ]).catch(() => {});
        return { ok: true };
      }),

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
        const t0 = Date.now();
        console.log(`[Agent] sendMessage session=${input.sessionId} specialist=${input.specialistId ?? 'auto'} msgLen=${input.message.length}`);

        const conversation = await getConversationBySession(input.sessionId);
        if (!conversation) {
          console.error(`[Agent] Session not found: ${input.sessionId}`);
          throw new TRPCError({ code: "NOT_FOUND", message: "Sesión no encontrada." });
        }

        // Save user message
        await addMessage({
          conversationId: conversation.id,
          role: "user",
          content: input.message,
        });

        // Get conversation history for context
        const history = await getMessagesByConversation(conversation.id);

        // ─── Sprint 5: Agente SDR con Tool Orchestration ────────────────────
        let agentResult: Awaited<ReturnType<typeof runAgentLoop>>;
        try {
          agentResult = await runAgentLoop(
            input.sessionId,
            input.message,
            history.slice(-10).map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            conversation.leadId ?? undefined
          );
        } catch (llmErr: unknown) {
          const llmErrMsg = llmErr instanceof Error ? llmErr.message : String(llmErr);
          console.error(`[Agent] Orchestrator failed session=${input.sessionId} error=${llmErrMsg}`);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Error al contactar el modelo de IA: ${llmErrMsg}` });
        }

        const assistantContent = agentResult.reply;
        console.log(`[Agent] SDR OK session=${input.sessionId} tools=${agentResult.toolsUsed.length} elapsed=${Date.now()-t0}ms replyLen=${assistantContent.length}`);

        // Save assistant message
        await addMessage({
          conversationId: conversation.id,
          role: "assistant",
          content: assistantContent,
        });

        // Detect if infrastructure topic is active for frontend indicator
        const isInfraMode = detectInfrastructureTopic(history);
        const activeSpecialistId = input.specialistId ?? detectSpecialist([...history, { role: 'assistant', content: assistantContent }]);

        // Update conversation metadata (score + intent) — non-critical
        const messageCount = history.length + 2;
        if (messageCount >= 4) {
          const scoreMessages = [
            {
              role: "system" as const,
              content: `Analiza la conversación y responde SOLO con un JSON: {"score": número del 0 al 100, "intent": "string describiendo la necesidad principal", "vertical": "slug de la vertical más relevante de: infraestructura|seguridad|rfid|software-ia|servicios-administrados|educacion|compliance"}`,
            },
            ...history.slice(-6).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
            { role: "user" as const, content: input.message },
            { role: "assistant" as const, content: assistantContent },
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

        return {
          reply: assistantContent,
          isInfraMode,
          specialistId: activeSpecialistId,
          action: agentResult.action,
          toolsUsed: agentResult.toolsUsed,
          proposalData: agentResult.proposalData,
          meetingData: agentResult.meetingData,
        };
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
    // Landing Factory — tracking de eventos de conversión
    trackEvent: publicProcedure
      .input(z.object({
        event: z.string(),
        vertical: z.string().optional(),
        sessionId: z.string().optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        await trackAnalyticsEvent(input);
        return { ok: true };
      }),
    getSummary: adminProcedure.query(async () => {
      return getAnalyticsSummary();
    }),
    getAttributionSummary: adminProcedure.query(async () => {
      return getAttributionSummary();
    }),
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

  // ─── Smart Calendar ──────────────────────────────────────────────────────────────────────────────
  calendar: router({
    getAvailableDates: publicProcedure
      .input(z.object({ daysAhead: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const dates = await getAvailableDates(input?.daysAhead ?? 14);
        return { dates };
      }),

    getSlotsByDate: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        const slots = await getAvailableSlots({ date: input.date });
        return { slots };
      }),

    bookMeeting: publicProcedure
      .input(z.object({
        slotId: z.number(),
        engineerId: z.number(),
        clientName: z.string().min(2).max(100),
        clientEmail: z.string().email(),
        clientPhone: z.string().optional(),
        company: z.string().optional(),
        topic: z.string().min(5).max(500),
        specialistId: z.string().optional(),
        conversationId: z.string().optional(),
        origin: z.string().optional(),
        // Attribution
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmTerm: z.string().optional(),
        utmContent: z.string().optional(),
        gclid: z.string().optional(),
        fbclid: z.string().optional(),
        msclkid: z.string().optional(),
        referrer: z.string().optional(),
        landingUrl: z.string().optional(),
        sessionId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const meeting = await bookMeeting(input);
        // Fetch slot details for email
        const slots = await getAvailableSlots({ date: undefined });
        const slot = slots.find((s) => s.id === input.slotId) ?? { date: '', startTime: '', endTime: '', engineerName: input.engineerId.toString(), engineerSpecialty: null };
        const allSlots = await getAvailableSlots({});
        const bookedSlot = allSlots.find((s) => s.id === input.slotId);
        // Get engineer email from DB
        const meetings = await getMeetings({ status: 'confirmed', limit: 1 });
        const latestMeeting = meetings[0];
        // Send confirmation email
        await sendMeetingConfirmationEmail({
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          engineerName: latestMeeting?.engineerName ?? 'Nuestro Ingeniero',
          engineerEmail: 'alvaro.rivera@iamet.mx',
          date: latestMeeting?.date ?? '',
          startTime: latestMeeting?.startTime ?? '',
          endTime: latestMeeting?.endTime ?? '',
          topic: input.topic,
          cancelToken: meeting.cancelToken ?? '',
          baseUrl: input.origin,
        });
        // Schedule smart reminders (24h, 2h, 30min before meeting)
        if (latestMeeting?.date && latestMeeting?.startTime) {
          try {
            const [year, month, day] = latestMeeting.date.split('-').map(Number);
            const [hour, minute] = latestMeeting.startTime.split(':').map(Number);
            // Mexico City is UTC-6 (CDT) or UTC-7 (CST); use UTC-6 as approximation
            const meetingDatetime = new Date(Date.UTC(year, month - 1, day, hour + 6, minute));
            await scheduleMeetingReminders(meeting.id, meetingDatetime);
          } catch (e) {
            console.warn('[Reminders] Error scheduling reminders:', e);
          }
        }
        // Trigger: timeline + score recalculation for the lead (fire-and-forget)
        // Try to find a lead by email to link the meeting to the timeline
        Promise.resolve().then(async () => {
          try {
            const { getDb } = await import('./db');
            const { sql } = await import('drizzle-orm');
            const db = await getDb();
            if (!db) return;
            const emailSafe = input.clientEmail.replace(/'/g, "''");
            const rows = await db.execute(sql.raw(`SELECT id FROM leads WHERE email = '${emailSafe}' ORDER BY createdAt DESC LIMIT 1`));
            const rowArr = (rows as any)[0] ?? rows as any;
            const leadId = Array.isArray(rowArr) ? rowArr[0]?.id : (rowArr as any)?.id;
            if (leadId) {
              await addTimelineEvent(leadId, 'meeting_scheduled', 'Reunión agendada',
                `Reunión agendada con ingeniero IAMET — ${input.topic}`,
                { meetingId: meeting.id, engineerId: input.engineerId, topic: input.topic }
              );
              await calcScore(leadId);
            }
          } catch (e) {
            // silent
          }
        }).catch(() => {});
        return { ok: true, meeting, cancelToken: meeting.cancelToken };
      }),

    getMeetingByToken: publicProcedure
      .input(z.object({ cancelToken: z.string() }))
      .query(async ({ input }) => {
        if (!input.cancelToken) return { meeting: null };
        const meeting = await getMeetingByCancelToken(input.cancelToken);
        return { meeting };
      }),

    cancelMeeting: publicProcedure
      .input(z.object({ cancelToken: z.string() }))
      .mutation(async ({ input }) => {
        const meeting = await getMeetingByCancelToken(input.cancelToken);
        if (!meeting) throw new TRPCError({ code: 'NOT_FOUND', message: 'Reunión no encontrada o ya cancelada.' });
        const ok = await cancelMeeting(input.cancelToken);
        if (ok) {
          await sendMeetingCancellationEmail({
            clientName: meeting.clientName,
            clientEmail: meeting.clientEmail,
            date: meeting.date,
            startTime: meeting.startTime,
            topic: meeting.topic,
          });
        }
        return { ok };
      }),
  }),

  // ─── Admin: Seguimientos ─────────────────────────────────────────────────────────────────────────────────
  adminFollowups: router({
    list: adminProcedure
      .input(z.object({
        status: z.string().optional(),
        vertical: z.string().optional(),
        leadName: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return adminGetFollowups({ status: input?.status, limit: input?.limit ?? 200 });
      }),
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return adminGetFollowupById(input.id);
      }),
    cancel: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const ok = await adminCancelFollowup(input.id);
        return { ok };
      }),
    sendNow: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const followup = await adminGetFollowupById(input.id);
        if (!followup) throw new TRPCError({ code: 'NOT_FOUND', message: 'Seguimiento no encontrado' });
        if (!['pending', 'failed'].includes(followup.status)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Solo se pueden enviar seguimientos pendientes o fallidos' });
        }
        // Import Resend and send the email
        const { getResend } = await import('./email');
        const resend = getResend();
        if (!resend) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Email no configurado' });
        try {
          await resend.emails.send({
            from: 'IAMET <noreply@iamet.mx>',
            to: followup.leadEmail,
            subject: followup.emailSubject ?? `Seguimiento de IAMET — ${followup.type}`,
            html: followup.emailBody ?? `<p>Hola ${followup.leadName}, te escribimos desde IAMET.</p>`,
          });
          // Mark as sent
          const db = await import('./db').then(m => m.getDb());
          if (db) {
            const { sql } = await import('drizzle-orm');
            await db.execute(sql.raw(`UPDATE lead_followups SET status = 'sent', sentAt = ${Date.now()} WHERE id = ${input.id}`));
          }
          return { ok: true };
        } catch (e: any) {
          // Mark as failed
          const db = await import('./db').then(m => m.getDb());
          if (db) {
            const { sql } = await import('drizzle-orm');
            await db.execute(sql.raw(`UPDATE lead_followups SET status = 'failed' WHERE id = ${input.id}`));
          }
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: e?.message ?? 'Error al enviar email' });
        }
      }),
    retry: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await import('./db').then(m => m.getDb());
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB no disponible' });
        const { sql } = await import('drizzle-orm');
        // Reset to pending so the next heartbeat picks it up
        await db.execute(sql.raw(`UPDATE lead_followups SET status = 'pending', scheduledAt = ${Date.now()} WHERE id = ${input.id} AND status = 'failed'`));
        return { ok: true };
      }),
    getStats: adminProcedure.query(async () => {
      const db = await import('./db').then(m => m.getDb());
      if (!db) return { pending: 0, sent: 0, failed: 0, skipped: 0, total: 0 };
      const { sql } = await import('drizzle-orm');
      const result = await db.execute(sql.raw(`SELECT status, COUNT(*) as cnt FROM lead_followups GROUP BY status`));
      const rows = ((result as any)[0] ?? result) as any[];
      const stats = { pending: 0, sent: 0, failed: 0, skipped: 0, total: 0 };
      rows.forEach((r: any) => {
        const s = r.status as keyof typeof stats;
        const cnt = Number(r.cnt);
        if (s in stats) stats[s] = cnt;
        stats.total += cnt;
      });
      return stats;
    }),
  }),
  // ─── Sprint 4: CRM Inteligente ────────────────────────────────────────────────────────────────────────
  crm: router({
    getLeadScore: adminProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        const { calculateLeadScore } = await import('./scoring');
        return calculateLeadScore(input.leadId);
      }),
    recalculateScore: adminProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ input }) => {
        const { calculateLeadScore } = await import('./scoring');
        return calculateLeadScore(input.leadId);
      }),
    getRecommendation: adminProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        const { getLatestRecommendation } = await import('./recommendations');
        return getLatestRecommendation(input.leadId);
      }),
    generateRecommendation: adminProcedure
      .input(z.object({ leadId: z.number(), conversationId: z.number().optional() }))
      .mutation(async ({ input }) => {
        const { generateRecommendations } = await import('./recommendations');
        return generateRecommendations(input.leadId, input.conversationId);
      }),
    getTimeline: adminProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        const { getLeadTimeline } = await import('./timeline');
        return getLeadTimeline(input.leadId);
      }),
    addTimelineEvent: adminProcedure
      .input(z.object({
        leadId: z.number(),
        type: z.string(),
        title: z.string(),
        description: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { addTimelineEvent } = await import('./timeline');
        await addTimelineEvent(input.leadId, input.type as any, input.title, input.description, input.metadata as any);
        return { ok: true };
      }),
    getBriefings: adminProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const { getLatestBriefings } = await import('./briefing');
        return getLatestBriefings(input?.limit ?? 7);
      }),
    generateBriefing: adminProcedure
      .mutation(async () => {
        const { generateDailyBriefing } = await import('./briefing');
        return generateDailyBriefing();
      }),
    getLeadDetail: adminProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        const db = await import('./db').then(m => m.getDb());
        if (!db) return null;
        const { sql } = await import('drizzle-orm');
        const rows = await db.execute(sql.raw(
          `SELECT l.*,
            COUNT(DISTINCT c.id) as conversation_count,
            COUNT(DISTINCT m.id) as meeting_count,
            COUNT(DISTINCT f.id) as followup_count
           FROM leads l
           LEFT JOIN conversations c ON c.lead_id = l.id
           LEFT JOIN meetings m ON m.client_email = l.email
           LEFT JOIN lead_followups f ON f.lead_id = l.id
           WHERE l.id = ${input.leadId}
           GROUP BY l.id`
        )) as any;
        const arr = Array.isArray(rows) ? rows : (rows?.rows ?? []);
        return arr[0] ?? null;
      }),
    updateLeadStatus: adminProcedure
      .input(z.object({
        leadId: z.number(),
        status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await import('./db').then(m => m.getDb());
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB no disponible' });
        const { sql } = await import('drizzle-orm');
        const notesSafe = input.notes ? input.notes.replace(/'/g, "''") : null;
        const notesClause = notesSafe ? `, notes = '${notesSafe}'` : '';
        await db.execute(sql.raw(`UPDATE leads SET status = '${input.status}'${notesClause}, updatedAt = NOW() WHERE id = ${input.leadId}`));
        // Trigger: timeline + recalculate score (fire-and-forget)
        Promise.all([
          addTimelineEvent(input.leadId, 'status_changed', 'Estado del lead actualizado',
            `Pipeline: ${input.status}${input.notes ? ` — ${input.notes}` : ''}`,
            { newStatus: input.status }
          ),
          calcScore(input.leadId).then(async (result) => {
            if (result.score >= 80) {
              await notifyOwner({
                title: `🔥 Lead Hot: Score ${result.score}/100`,
                content: `**Lead ID:** ${input.leadId}\n**Nuevo estado:** ${input.status}\n**Score:** ${result.score}/100\n**Acción:** ${result.recommendation}`,
              }).catch(() => {});
            }
          }),
        ]).catch(() => {});
        return { ok: true };
      }),

    getLeadsList: adminProcedure
      .input(z.object({ limit: z.number().optional(), status: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const db = await import('./db').then(m => m.getDb());
        if (!db) return [];
        const { sql } = await import('drizzle-orm');
        const limit = input?.limit ?? 50;
        const statusFilter = input?.status ? `AND l.status = '${input.status}'` : '';
        const rows = await db.execute(sql.raw(
          `SELECT l.*, ls.score, ls.action_label, ls.recommendation
           FROM leads l
           LEFT JOIN lead_scores ls ON ls.lead_id = l.id
           WHERE 1=1 ${statusFilter}
           ORDER BY COALESCE(ls.score, 0) DESC, l.created_at DESC
           LIMIT ${limit}`
        )) as any;
        const arr = Array.isArray(rows) ? rows : (rows?.rows ?? []);
        return arr;
      }),
  }),
  // ─── Admin: Reuniones ────────────────────────────────────────────────────────────────────────────────────
  adminCalendar: router({
    getMeetings: adminProcedure
      .input(z.object({ status: z.string().optional(), limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getMeetings({ status: input?.status, limit: input?.limit });
      }),

    updateMeetingStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']) }))
      .mutation(async ({ input }) => {
        const db = await import('./db').then(m => m.getDb());
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB no disponible' });
        const { sql } = await import('drizzle-orm');
        await db.execute(sql.raw(`UPDATE meetings SET status = '${input.status}', updatedAt = NOW() WHERE id = ${input.id}`));
        // Trigger: timeline for linked lead (fire-and-forget)
        Promise.resolve().then(async () => {
          try {
            const rows = await db!.execute(sql.raw(`SELECT clientEmail FROM meetings WHERE id = ${input.id} LIMIT 1`));
            const rowArr = (rows as any)[0] ?? rows as any;
            const email = Array.isArray(rowArr) ? rowArr[0]?.clientEmail : (rowArr as any)?.clientEmail;
            if (email) {
              const emailSafe = (email as string).replace(/'/g, "''");
              const leadRows = await db!.execute(sql.raw(`SELECT id FROM leads WHERE email = '${emailSafe}' ORDER BY createdAt DESC LIMIT 1`));
              const leadArr = (leadRows as any)[0] ?? leadRows as any;
              const leadId = Array.isArray(leadArr) ? leadArr[0]?.id : (leadArr as any)?.id;
              if (leadId) {
                await addTimelineEvent(leadId, 'status_changed', 'Estado de reunión actualizado',
                  `Reunión #${input.id} marcada como: ${input.status}`,
                  { meetingId: input.id, newStatus: input.status }
                );
                await calcScore(leadId);
              }
            }
          } catch (e) { /* silent */ }
        }).catch(() => {});
        return { ok: true };
      }),

    getEngineers: adminProcedure.query(async () => {
      const db = await import('./db').then(m => m.getDb());
      if (!db) return [];
      const { sql } = await import('drizzle-orm');
      const result = await db.execute(sql.raw('SELECT * FROM engineers ORDER BY name ASC'));
      return ((result as any)[0] ?? result as any) as any[];
    }),

    updateMeetingUrl: adminProcedure
      .input(z.object({
        id: z.number(),
        meetingUrl: z.string().url('URL inválida').or(z.literal('')),
      }))
      .mutation(async ({ input }) => {
        const db = await import('./db').then(m => m.getDb());
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB no disponible' });
        const { sql } = await import('drizzle-orm');
        const safeUrl = input.meetingUrl.replace(/'/g, "''");
        await db.execute(sql.raw(`UPDATE meetings SET meetingUrl = '${safeUrl}', updatedAt = NOW() WHERE id = ${input.id}`));
        return { ok: true, meetingUrl: input.meetingUrl };
      }),
  }),

});
export type AppRouter = typeof appRouter;