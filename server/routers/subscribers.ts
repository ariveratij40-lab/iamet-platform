import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscribers, subscriberSessions, conversations, messages } from "../../drizzle/schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";

const SUBSCRIBER_JWT_SECRET = new TextEncoder().encode(
  (ENV.cookieSecret || "iamet-subscriber-secret") + "_subscriber"
);
const SESSION_EXPIRY_DAYS = 30;
const SUBSCRIBER_COOKIE = "iamet_subscriber";

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function getSubscriberFromRequest(req: import("express").Request) {
  // Try cookie first, then Authorization header
  const token =
    req.cookies?.[SUBSCRIBER_COOKIE] ||
    req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SUBSCRIBER_JWT_SECRET);
    const subscriberId = parseInt(payload.sub as string);
    if (!subscriberId) return null;
    const db = await getDb();
    if (!db) return null;
    const [sub] = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        name: subscribers.name,
        company: subscribers.company,
        phone: subscribers.phone,
        plan: subscribers.plan,
        status: subscribers.status,
        createdAt: subscribers.createdAt,
      })
      .from(subscribers)
      .where(eq(subscribers.id, subscriberId))
      .limit(1);
    if (!sub || sub.status === "suspended") return null;
    return sub;
  } catch {
    return null;
  }
}

export const subscribersRouter = router({
  // ── Registro ────────────────────────────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
        email: z.string().email("Correo electrónico inválido"),
        password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
        company: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible.");

      // Verificar si el correo ya existe
      const existing = await db
        .select({ id: subscribers.id })
        .from(subscribers)
        .where(eq(subscribers.email, input.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        throw new Error(
          "Este correo ya está registrado. Inicia sesión o usa otro correo."
        );
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      const isMysql = (process.env.DATABASE_URL ?? "").startsWith("mysql://");
      let newId: number;

      if (isMysql) {
        const result = await db.insert(subscribers).values({
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          company: input.company,
          phone: input.phone,
          plan: "free",
          status: "active",
        });
        newId = (result as any)[0]?.insertId ?? 0;
      } else {
        const [row] = await db
          .insert(subscribers)
          .values({
            name: input.name,
            email: input.email.toLowerCase(),
            passwordHash,
            company: input.company,
            phone: input.phone,
            plan: "free",
            status: "active",
          })
          .returning({ id: subscribers.id });
        newId = row.id;
      }

      return {
        ok: true,
        message: "¡Cuenta creada exitosamente! Ya puedes iniciar sesión.",
        subscriberId: newId,
      };
    }),

  // ── Login ────────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible.");

      const [sub] = await db
        .select()
        .from(subscribers)
        .where(eq(subscribers.email, input.email.toLowerCase()))
        .limit(1);

      if (!sub) throw new Error("Correo o contraseña incorrectos.");
      if (sub.status === "suspended")
        throw new Error("Tu cuenta ha sido suspendida. Contacta a soporte.");
      if (sub.status === "inactive")
        throw new Error("Tu cuenta está inactiva. Contacta a soporte.");

      const valid = await bcrypt.compare(input.password, sub.passwordHash);
      if (!valid) throw new Error("Correo o contraseña incorrectos.");

      // Crear JWT
      const token = await new SignJWT({
        sub: String(sub.id),
        email: sub.email,
        name: sub.name,
        plan: sub.plan,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
        .sign(SUBSCRIBER_JWT_SECRET);

      // Guardar sesión en DB
      const expiresAt = new Date(
        Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      );
      await db.insert(subscriberSessions).values({
        subscriberId: sub.id,
        token,
        expiresAt,
      });

      // Establecer cookie HttpOnly
      ctx.res.cookie(SUBSCRIBER_COOKIE, token, {
        httpOnly: true,
        secure: ctx.req.secure || ctx.req.headers["x-forwarded-proto"] === "https",
        sameSite: "lax",
        maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return {
        ok: true,
        token,
        user: {
          id: sub.id,
          name: sub.name,
          email: sub.email,
          company: sub.company,
          phone: sub.phone,
          plan: sub.plan,
          status: sub.status,
        },
      };
    }),

  // ── Me (perfil del suscriptor autenticado) ────────────────────────────────
  me: publicProcedure.query(async ({ ctx }) => {
    const sub = await getSubscriberFromRequest(ctx.req);
    if (!sub) return null;
    return sub;
  }),

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: publicProcedure.mutation(async ({ ctx }) => {
    const token =
      ctx.req.cookies?.[SUBSCRIBER_COOKIE] ||
      ctx.req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const db = await getDb();
      if (db) {
        await db
          .delete(subscriberSessions)
          .where(eq(subscriberSessions.token, token));
      }
    }

    ctx.res.clearCookie(SUBSCRIBER_COOKIE, { path: "/" });
    return { ok: true };
  }),

  // ── Mis conversaciones ────────────────────────────────────────────────────
  myConversations: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const sub = await getSubscriberFromRequest(ctx.req);
      if (!sub) return { conversations: [], total: 0 };

      const db = await getDb();
      if (!db) return { conversations: [], total: 0 };

      const convs = await db
        .select({
          id: conversations.id,
          sessionId: conversations.sessionId,
          status: conversations.status,
          summary: conversations.summary,
          detectedIntent: conversations.detectedIntent,
          leadScore: conversations.leadScore,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .where(eq(conversations.subscriberId, sub.id))
        .orderBy(desc(conversations.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Contar total
      const [countRow] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(conversations)
        .where(eq(conversations.subscriberId, sub.id));

      const total = Number(countRow?.count ?? 0);

      return { conversations: convs, total };
    }),

  // ── Mensajes de una conversación ──────────────────────────────────────────
  conversationMessages: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const sub = await getSubscriberFromRequest(ctx.req);
      if (!sub) throw new Error("No autenticado.");

      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible.");

      // Verificar que la conversación pertenece al suscriptor
      const [conv] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          and(
            eq(conversations.sessionId, input.sessionId),
            eq(conversations.subscriberId, sub.id)
          )
        )
        .limit(1);

      if (!conv) throw new Error("Conversación no encontrada.");

      const msgs = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(messages.createdAt);

      return msgs;
    }),
});

export { getSubscriberFromRequest, SUBSCRIBER_COOKIE };
