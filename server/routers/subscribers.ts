import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  subscribers,
  subscriberSessions,
  conversations,
  messages,
} from "../../drizzle/schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import { ENV } from "../_core/env";
import crypto from "crypto";
import { sendVerificationEmail } from "../email";

const SUBSCRIBER_JWT_SECRET = new TextEncoder().encode(
  (ENV.cookieSecret || "iamet-subscriber-secret") + "_subscriber"
);
const SESSION_EXPIRY_DAYS = 30;
const SUBSCRIBER_COOKIE = "iamet_subscriber";
const VERIFICATION_EXPIRY_HOURS = 24;

// ── Helper: extraer token del request (cookie o Authorization header) ─────────
async function getSubscriberFromRequest(req: import("express").Request) {
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
        emailVerified: subscribers.emailVerified,
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

// ── Helper: construir email de verificación para suscriptores ─────────────────
function buildSubscriberVerificationHtml(params: {
  name: string;
  verifyUrl: string;
}): string {
  const { name, verifyUrl } = params;
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirma tu cuenta — IAMET</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#131319;border-radius:16px;border:1px solid #1e2030;overflow:hidden;max-width:560px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%);padding:32px 40px;text-align:center;">
              <img src="https://iamettech-ssx5e88n.manus.space/manus-storage/logo-iamet-v2-final_a0aa3f89.png"
                   alt="IAMET Evolución Tecnológica" height="48"
                   style="height:48px;width:auto;object-fit:contain;" />
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;letter-spacing:-0.02em;">
                ¡Bienvenido a IAMET, ${name}!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
                Gracias por registrarte. Para activar tu cuenta y acceder a tu historial de conversaciones, confirma tu dirección de correo electrónico haciendo clic en el botón de abajo.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#2563eb;border-radius:10px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                      Confirmar mi cuenta →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:13px;color:#64748b;line-height:1.6;">
                O copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 24px;font-size:12px;color:#3b82f6;word-break:break-all;">
                ${verifyUrl}
              </p>
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                Este enlace es válido por <strong>${VERIFICATION_EXPIRY_HOURS} horas</strong>. Si no creaste esta cuenta, puedes ignorar este correo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#0d0d14;padding:20px 40px;border-top:1px solid #1e2030;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                © 2025 IAMET Evolución Tecnológica — Integrador de Soluciones Tecnológicas
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export const subscribersRouter = router({
  // ── Registro ────────────────────────────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
        email: z.string().email("Correo electrónico inválido"),
        password: z
          .string()
          .min(8, "La contraseña debe tener al menos 8 caracteres"),
        company: z.string().optional(),
        phone: z.string().optional(),
        origin: z.string().optional(), // para construir la URL de verificación
      })
    )
    .mutation(async ({ input, ctx }) => {
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

      // Generar token de verificación
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiresAt = new Date(
        Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
      );

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
          emailVerified: false,
          verificationToken,
          verificationTokenExpiresAt,
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
            emailVerified: false,
            verificationToken,
            verificationTokenExpiresAt,
          })
          .returning({ id: subscribers.id });
        newId = row.id;
      }

      // Construir URL de verificación
      const origin =
        input.origin ||
        (ctx.req.headers["x-forwarded-proto"] === "https"
          ? `https://${ctx.req.headers.host}`
          : `http://${ctx.req.headers.host}`);
      const verifyUrl = `${origin}/verificar-email?token=${verificationToken}`;

      // Enviar correo de verificación
      let emailSent = false;
      try {
        if (ENV.resendApiKey) {
          const { Resend } = await import("resend");
          const resend = new Resend(ENV.resendApiKey);
          const { error } = await resend.emails.send({
            from: "IAMET <noreply@iamet.mx>",
            to: [input.email.toLowerCase()],
            subject: "Confirma tu cuenta — IAMET",
            html: buildSubscriberVerificationHtml({
              name: input.name,
              verifyUrl,
            }),
          });
          if (!error) emailSent = true;
          else console.error("[Subscribers] Error Resend:", error);
        } else {
          console.info(
            "[Subscribers] RESEND_API_KEY no configurada — URL de verificación (dev):",
            verifyUrl
          );
        }
      } catch (err) {
        console.error("[Subscribers] Excepción al enviar correo:", err);
      }

      return {
        ok: true,
        message: emailSent
          ? "¡Cuenta creada! Te enviamos un correo de confirmación. Revisa tu bandeja de entrada (y spam)."
          : "¡Cuenta creada! Por favor verifica tu correo para activar tu cuenta.",
        subscriberId: newId,
        emailSent,
        // En desarrollo, devolver la URL para facilitar pruebas
        verifyUrl: ENV.resendApiKey ? undefined : verifyUrl,
      };
    }),

  // ── Verificar email ──────────────────────────────────────────────────────────
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible.");

      const [sub] = await db
        .select({
          id: subscribers.id,
          emailVerified: subscribers.emailVerified,
          verificationTokenExpiresAt:
            subscribers.verificationTokenExpiresAt,
        })
        .from(subscribers)
        .where(eq(subscribers.verificationToken, input.token))
        .limit(1);

      if (!sub) {
        throw new Error(
          "Token de verificación inválido o ya utilizado."
        );
      }

      if (sub.emailVerified) {
        return { ok: true, message: "Tu correo ya fue verificado anteriormente." };
      }

      if (
        sub.verificationTokenExpiresAt &&
        new Date() > sub.verificationTokenExpiresAt
      ) {
        throw new Error(
          "El enlace de verificación ha expirado. Solicita uno nuevo."
        );
      }

      // Marcar como verificado
      await db
        .update(subscribers)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiresAt: null,
          updatedAt: new Date(),
        })
        .where(eq(subscribers.id, sub.id));

      return {
        ok: true,
        message: "¡Correo verificado exitosamente! Ya puedes iniciar sesión.",
      };
    }),

  // ── Reenviar correo de verificación ─────────────────────────────────────────
  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email(), origin: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible.");

      const [sub] = await db
        .select({
          id: subscribers.id,
          name: subscribers.name,
          emailVerified: subscribers.emailVerified,
        })
        .from(subscribers)
        .where(eq(subscribers.email, input.email.toLowerCase()))
        .limit(1);

      if (!sub) {
        // No revelar si el email existe o no
        return { ok: true, message: "Si el correo existe, recibirás un nuevo enlace de verificación." };
      }

      if (sub.emailVerified) {
        return { ok: true, message: "Tu correo ya está verificado. Puedes iniciar sesión." };
      }

      // Generar nuevo token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenExpiresAt = new Date(
        Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
      );

      await db
        .update(subscribers)
        .set({ verificationToken, verificationTokenExpiresAt, updatedAt: new Date() })
        .where(eq(subscribers.id, sub.id));

      const origin =
        input.origin ||
        (ctx.req.headers["x-forwarded-proto"] === "https"
          ? `https://${ctx.req.headers.host}`
          : `http://${ctx.req.headers.host}`);
      const verifyUrl = `${origin}/verificar-email?token=${verificationToken}`;

      try {
        if (ENV.resendApiKey) {
          const { Resend } = await import("resend");
          const resend = new Resend(ENV.resendApiKey);
          await resend.emails.send({
            from: "IAMET <noreply@iamet.mx>",
            to: [input.email.toLowerCase()],
            subject: "Confirma tu cuenta — IAMET",
            html: buildSubscriberVerificationHtml({ name: sub.name, verifyUrl }),
          });
        } else {
          console.info("[Subscribers] Reenvío (dev):", verifyUrl);
        }
      } catch (err) {
        console.error("[Subscribers] Error al reenviar:", err);
      }

      return { ok: true, message: "Si el correo existe, recibirás un nuevo enlace de verificación." };
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

      // Bloquear login si el email no está verificado
      if (!sub.emailVerified) {
        throw new Error(
          "EMAIL_NOT_VERIFIED: Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada."
        );
      }

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
        secure:
          ctx.req.secure ||
          ctx.req.headers["x-forwarded-proto"] === "https",
        sameSite: "lax",
        maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
        path: "/",
      });

      return {
        ok: true,
        token, // también devolvemos el token para que el frontend lo guarde en localStorage como fallback
        user: {
          id: sub.id,
          name: sub.name,
          email: sub.email,
          company: sub.company,
          phone: sub.phone,
          plan: sub.plan,
          status: sub.status,
          emailVerified: sub.emailVerified,
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
