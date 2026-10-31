import { getAccountProfile } from "../account-profile";
import { authenticateAccount, AccountAccessError } from "../account-access";
/**
 * Router de autenticación local IAMET
 * Endpoints REST (no tRPC) para VPS standalone
 *
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/me
 * POST /api/auth/create-admin
 */
import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  findUserByEmail,
  findUserById,
  verifyPassword,
  signJWT,
  verifyJWT,
  cookieOptions,
  SESSION_COOKIE,
  updateLastLogin,
  adminExists,
  createLocalUser,
  hashPassword,
} from "../local-auth";

export const localAuthRouter = Router();

// ─── Rate limit específico para login ─────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                   // máx 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos." },
  skip: () => process.env.NODE_ENV === "development",
});

// ─── Helper: leer cookie de sesión ────────────────────────────────────────────
function getSessionToken(req: Request): string | null {
  // Cookie HttpOnly
  const fromCookie = req.cookies?.[SESSION_COOKIE];
  if (fromCookie) return fromCookie;
  // Bearer token como fallback (para clientes API)
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

const isProduction = process.env.NODE_ENV === "production";

// Return only contact fields from the authenticated account; never accept a user ID.
localAuthRouter.get("/profile", async (req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  try {
    const header = req.headers["x-store-token"];
    if (header !== undefined && typeof header !== "string") return res.json({ profile: null });
    const profile = await getAccountProfile({ customerToken: typeof header === "string" ? header : undefined, staffToken: getSessionToken(req) ?? undefined });
    return res.json({ profile });
  } catch {
    return res.status(503).json({ error: "No se pudo cargar el perfil." });
  }
});

// One public sign-in form; identity and permissions are decided by the server.
localAuthRouter.post("/access", loginLimiter, async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || !email.trim() || email.length > 320 || typeof password !== "string" || !password || password.length > 1000) {
    return res.status(400).json({ error: "Ingrese un correo y una contraseña válidos." });
  }
  try {
    const account = await authenticateAccount(email, password);
    if (account.kind === "admin") {
      res.cookie(SESSION_COOKIE, account.token, cookieOptions(isProduction));
      return res.json({ ok: true, kind: account.kind, user: account.user });
    }
    // Signing in as a customer ends any prior administrative session in this browser.
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return res.json({ ok: true, ...account });
  } catch (error) {
    if (error instanceof AccountAccessError) return res.status(error.status).json({ error: error.message });
    console.error("[LocalAuth] Unified access failed");
    return res.status(500).json({ error: "No se pudo iniciar sesión. Intente nuevamente." });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
localAuthRouter.post("/login", loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    // Validación básica — mensaje genérico para no revelar si el email existe
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const user = await findUserByEmail(email.toLowerCase().trim());

    // Verificar contraseña — siempre ejecutar bcrypt para evitar timing attacks
    const dummyHash = "$2a$12$dummy.hash.to.prevent.timing.attack.on.nonexistent.user";
    const hashToVerify = user?.passwordHash ?? dummyHash;
    const valid = await verifyPassword(password, hashToVerify);

    if (!user || !valid || !user.passwordHash) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    if (user.status !== "active") {
      return res.status(403).json({ error: "Cuenta desactivada. Contacta al administrador." });
    }

    // Generar JWT
    const token = signJWT({
      sub: String(user.id),
      email: user.email,
      role: user.role,
    });

    // Actualizar lastLoginAt (sin await para no bloquear la respuesta)
    updateLastLogin(user.id).catch(() => {});

    // Establecer cookie HttpOnly
    res.cookie(SESSION_COOKIE, token, cookieOptions(isProduction));

    return res.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[LocalAuth] Login error:", (err as Error).message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
localAuthRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  return res.json({ ok: true });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
localAuthRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    if (!token) return res.status(401).json({ error: "No autenticado" });

    const payload = verifyJWT(token);
    if (!payload) {
      res.clearCookie(SESSION_COOKIE, { path: "/" });
      return res.status(401).json({ error: "Sesión expirada" });
    }

    const user = await findUserById(Number(payload.sub));
    if (!user) {
      res.clearCookie(SESSION_COOKIE, { path: "/" });
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
    });
  } catch (err) {
    console.error("[LocalAuth] Me error:", (err as Error).message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ─── POST /api/auth/create-admin ──────────────────────────────────────────────
// Solo funciona si NO existe ningún admin con contraseña local
localAuthRouter.post("/create-admin", loginLimiter, async (req: Request, res: Response) => {
  if (process.env.ALLOW_ADMIN_BOOTSTRAP === "false") {
    return res.status(403).json({ error: "La cuenta administradora se configura desde el servidor." });
  }
  try {
    const { email, password, name } = req.body ?? {};

    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password y name son requeridos" });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    // Verificar que no existe ningún admin local
    const exists = await adminExists();
    if (exists) {
      return res.status(409).json({ error: "Ya existe un administrador. Usa el login normal." });
    }

    const passwordHash = await hashPassword(password);
    const user = await createLocalUser({
      email: (email as string).toLowerCase().trim(),
      name: name as string,
      passwordHash,
      role: "admin",
    });

    console.log(`[LocalAuth] Admin inicial creado: ${user.email}`);

    return res.status(201).json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[LocalAuth] Create-admin error:", msg);
    // No revelar detalles internos
    return res.status(500).json({ error: "Error al crear el administrador" });
  }
});
