import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { storeUsers } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendVerificationEmail } from "../email";
import { ENV } from "../_core/env";
import crypto from "crypto";

const STORE_JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret + "_store");
const TOKEN_EXPIRY_HOURS = 24;

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function makeVerifyUrl(origin: string, token: string) {
  return `${origin}/tienda/verificar-email?token=${token}`;
}

function makeResetUrl(origin: string, token: string) {
  return `${origin}/tienda/nueva-contrasena?token=${token}`;
}

export const storeAuthRouter = router({
  // ── Registro ──────────────────────────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        phone: z.string().optional(),
        company: z.string().optional(),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible.");

      const existing = await db
        .select({ id: storeUsers.id })
        .from(storeUsers)
        .where(eq(storeUsers.email, input.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Este correo ya está registrado. Inicia sesión o recupera tu contraseña.");
      }

      const passwordHash = await bcrypt.hash(input.password, 12);
      const verificationToken = generateToken();
      const tokenExpiry = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await db.insert(storeUsers).values({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        phone: input.phone,
        company: input.company,
        emailVerified: false,
        verificationToken,
        tokenExpiry,
      });

      const verifyUrl = makeVerifyUrl(input.origin, verificationToken);

      await sendVerificationEmail({
        to: input.email,
        name: input.name,
        verifyUrl,
      }).catch((err: unknown) => console.error("[StoreAuth] Error enviando email de verificación:", err));

      return { ok: true, message: "Cuenta creada. Revisa tu correo para verificar tu cuenta." };
    }),

  // ── Verificar email ───────────────────────────────────────────────────────
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible.");

      const [user] = await db
        .select()
        .from(storeUsers)
        .where(
          and(
            eq(storeUsers.verificationToken, input.token),
            gt(storeUsers.tokenExpiry, new Date())
          )
        )
        .limit(1);

      if (!user) throw new Error("Token inválido o expirado.");

      await db
        .update(storeUsers)
        .set({ emailVerified: true, verificationToken: null, tokenExpiry: null, updatedAt: new Date() })
        .where(eq(storeUsers.id, user.id));

      return { ok: true, name: user.name };
    }),

  // ── Login ─────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible.");

      const [user] = await db
        .select()
        .from(storeUsers)
        .where(eq(storeUsers.email, input.email.toLowerCase()))
        .limit(1);

      if (!user) throw new Error("Correo o contraseña incorrectos.");
      if (!user.emailVerified) throw new Error("Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.");

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new Error("Correo o contraseña incorrectos.");

      const token = await new SignJWT({ sub: String(user.id), email: user.email, name: user.name })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(STORE_JWT_SECRET);

      return {
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, company: user.company },
      };
    }),

  // ── Me (verificar sesión) ─────────────────────────────────────────────────
  me: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const { payload } = await jwtVerify(input.token, STORE_JWT_SECRET);
        const userId = parseInt(payload.sub as string);
        const db = await getDb();
        if (!db) throw new Error("DB no disponible.");
        const [user] = await db
          .select({
            id: storeUsers.id,
            name: storeUsers.name,
            email: storeUsers.email,
            phone: storeUsers.phone,
            company: storeUsers.company,
            createdAt: storeUsers.createdAt,
          })
          .from(storeUsers)
          .where(eq(storeUsers.id, userId))
          .limit(1);
        if (!user) throw new Error("Usuario no encontrado.");
        return user;
      } catch {
        throw new Error("Sesión inválida.");
      }
    }),

  // ── Recuperar contraseña ──────────────────────────────────────────────────
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email(), origin: z.string().url() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: true }; // silencioso

      const [user] = await db
        .select({ id: storeUsers.id, name: storeUsers.name })
        .from(storeUsers)
        .where(eq(storeUsers.email, input.email.toLowerCase()))
        .limit(1);

      if (!user) return { ok: true }; // no revelar si existe

      const resetToken = generateToken();
      const resetTokenExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000);

      await db
        .update(storeUsers)
        .set({ resetToken, resetTokenExpiry, updatedAt: new Date() })
        .where(eq(storeUsers.id, user.id));

      const resetUrl = makeResetUrl(input.origin, resetToken);

      await sendVerificationEmail({
        to: input.email,
        name: user.name ?? "usuario",
        verifyUrl: resetUrl,
      }).catch((err: unknown) => console.error("[StoreAuth] Error enviando email de reset:", err));

      return { ok: true };
    }),

  // ── Nueva contraseña ──────────────────────────────────────────────────────
  resetPassword: publicProcedure
    .input(z.object({ token: z.string(), password: z.string().min(8) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Base de datos no disponible.");

      const [user] = await db
        .select()
        .from(storeUsers)
        .where(
          and(
            eq(storeUsers.resetToken, input.token),
            gt(storeUsers.resetTokenExpiry, new Date())
          )
        )
        .limit(1);

      if (!user) throw new Error("Token inválido o expirado.");

      const passwordHash = await bcrypt.hash(input.password, 12);
      await db
        .update(storeUsers)
        .set({ passwordHash, resetToken: null, resetTokenExpiry: null, updatedAt: new Date() })
        .where(eq(storeUsers.id, user.id));

      return { ok: true };
    }),

  // ── Mis cotizaciones ─────────────────────────────────────────────────────
  getMyQuotes: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const { payload } = await jwtVerify(input.token, STORE_JWT_SECRET).catch(() => {
        throw new Error("Sesi\u00f3n inv\u00e1lida.");
      });
      const userId = parseInt(payload.sub as string);
      const db = await getDb();
      if (!db) throw new Error("DB no disponible.");
      const { quoteRequests, quoteItems } = await import("../../drizzle/schema");
      const { desc } = await import("drizzle-orm");
      const quotes = await db
        .select()
        .from(quoteRequests)
        .where(eq((quoteRequests as any).storeUserId, userId))
        .orderBy(desc(quoteRequests.createdAt))
        .limit(50);
      const result = await Promise.all(
        quotes.map(async (q: typeof quoteRequests.$inferSelect) => {
          const items = await db!.select().from(quoteItems).where(eq(quoteItems.quoteRequestId, q.id));
          return { ...q, items };
        })
      );
      return result;
    }),

  // ── Carrito guardado ─────────────────────────────────────────────────────
  getSavedCart: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const { payload } = await jwtVerify(input.token, STORE_JWT_SECRET).catch(() => {
        throw new Error("Sesi\u00f3n inv\u00e1lida.");
      });
      const userId = parseInt(payload.sub as string);
      const db = await getDb();
      if (!db) return null;
      const { savedCarts } = await import("../../drizzle/schema");
      const [cart] = await db.select().from(savedCarts).where(eq(savedCarts.userId, userId)).limit(1);
      return cart ?? null;
    }),

  saveCart: publicProcedure
    .input(z.object({ token: z.string(), items: z.array(z.any()) }))
    .mutation(async ({ input }) => {
      const { payload } = await jwtVerify(input.token, STORE_JWT_SECRET).catch(() => {
        throw new Error("Sesi\u00f3n inv\u00e1lida.");
      });
      const userId = parseInt(payload.sub as string);
      const db = await getDb();
      if (!db) return { ok: true };
      const { savedCarts } = await import("../../drizzle/schema");
      const [existing] = await db.select({ id: savedCarts.id }).from(savedCarts).where(eq(savedCarts.userId, userId)).limit(1);
      if (existing) {
        await db.update(savedCarts).set({ items: input.items as any, updatedAt: new Date() }).where(eq(savedCarts.userId, userId));
      } else {
        await db.insert(savedCarts).values({ userId, items: input.items as any });
      }
      return { ok: true };
    }),
});
