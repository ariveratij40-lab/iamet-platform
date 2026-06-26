import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./serveStatic";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ─── Rate Limiters ────────────────────────────────────────────────────────────

/**
 * Limiter para rutas de autenticación OAuth y login.
 * 20 intentos por IP en 15 minutos — razonable para staging.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." },
  skip: () => process.env.NODE_ENV === "development",
});

/**
 * Limiter para formularios públicos: leads, cotizaciones, registro de tienda.
 * 30 envíos por IP en 15 minutos — permite uso legítimo sin abuso.
 */
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes. Intenta de nuevo en 15 minutos." },
  skip: () => process.env.NODE_ENV === "development",
});

/**
 * Limiter general para la API tRPC.
 * 200 requests por IP en 1 minuto — protege contra scraping y DDoS básico.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Límite de solicitudes alcanzado. Intenta de nuevo en un minuto." },
  skip: () => process.env.NODE_ENV === "development",
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Helmet — Headers de seguridad HTTP ────────────────────────────────────
  // contentSecurityPolicy deshabilitado para no romper el frontend React/Vite.
  // Los demás headers (X-Frame-Options, X-Content-Type-Options, HSTS, etc.)
  // se aplican normalmente. SSE y WebSockets no se ven afectados.
  app.use(
    helmet({
      contentSecurityPolicy: false, // React + Vite requiere CSP personalizado
      crossOriginEmbedderPolicy: false, // Permite embeds de terceros (mapas, videos)
    })
  );

  // ─── CORS explícito ────────────────────────────────────────────────────────
  // Acepta el origen definido en VITE_APP_URL (staging o producción).
  // En desarrollo acepta localhost:* para no bloquear el flujo de trabajo.
  const allowedOrigins = [
    process.env.VITE_APP_URL,
    "http://localhost:3000",
    "http://localhost:5173",
  ].filter(Boolean) as string[];

  // Permitir dominios de Manus (sandbox de desarrollo y sitios publicados)
  // y el dominio de staging del VPS si está configurado en VITE_APP_URL
  const isAllowedDynamicOrigin = (origin: string) =>
    /\.manus\.computer$/.test(origin) ||
    /\.manus\.space$/.test(origin);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir requests sin origin (curl, Postman, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Permitir dominios de Manus (sandbox y publicados)
        if (isAllowedDynamicOrigin(origin)) return callback(null, true);
        callback(new Error(`CORS: origen no permitido — ${origin}`));
      },
      credentials: true, // Necesario para cookies de sesión OAuth
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  );

  // ─── Body Parser ──────────────────────────────────────────────────────────
  // 10MB para endpoints generales (JSON, formularios).
  // 50MB específico para rutas de upload de archivos (base64 de imágenes/PDFs).
  app.use("/api/trpc/catalog.uploadFile", express.json({ limit: "50mb" }));
  app.use("/api/trpc/adminStoreV2.uploadFile", express.json({ limit: "50mb" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // ─── Storage proxy (antes de rate limiting — requests internos) ───────────
  registerStorageProxy(app);

  // ─── Rate limiting en rutas OAuth ─────────────────────────────────────────
  app.use("/api/oauth", authLimiter);

  // ─── OAuth routes ─────────────────────────────────────────────────────────
  registerOAuthRoutes(app);

  // ─── Health check (sin rate limiting — usado por Docker healthcheck) ──────
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
  });

  // ─── Rate limiting en tRPC API ────────────────────────────────────────────
  // Limiter general para toda la API
  app.use("/api/trpc", apiLimiter);

  // Limiter específico para procedimientos de formularios públicos
  // (leads.create, store.submitQuote, storeAuth.register, storeAuth.resend)
  app.use(
    [
      "/api/trpc/leads.create",
      "/api/trpc/store.submitQuote",
      "/api/trpc/storeAuth.register",
      "/api/trpc/storeAuth.resend",
      "/api/trpc/advisor.startSession",
    ],
    formLimiter
  );

  // ─── tRPC API ─────────────────────────────────────────────────────────────
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ─── Frontend (Vite dev o archivos estáticos) ─────────────────────────────
  // vite is a devDependency — use dynamic string import so esbuild doesn't bundle vite.ts
  if (process.env.NODE_ENV === "development") {
    // String concatenation prevents esbuild from statically analyzing and bundling vite.ts
    const vitePath = "./" + "vite";
    const { setupVite } = await import(vitePath);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
