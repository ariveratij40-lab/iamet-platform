import type { Express } from "express";
import { parse } from "cookie";
import { createContext } from "./_core/context";
import { SESSION_COOKIE } from "./local-auth";
import { consumeAuthorization, exchangeCode } from "./google-ads";
export function registerGoogleAdsOAuth(app: Express) {
  app.get("/api/google-ads/oauth/callback", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    try {
      const ctx = await createContext({ req, res } as Parameters<
        typeof createContext
      >[0]);
      if (ctx.user?.role !== "admin")
        return res.redirect("/acceso?returnTo=%2Fadmin%2Fcampanas");
      const state = req.query.state;
      const code = req.query.code;
      if (typeof state !== "string" || state.length > 200)
        throw new Error("invalid state");
      const session = parse(req.headers.cookie ?? "")[SESSION_COOKIE];
      if (!session) throw new Error("invalid session");
      const verifier = consumeAuthorization(state, ctx.user.id, session);
      if (req.query.error || typeof code !== "string" || code.length > 4096)
        throw new Error("authorization denied");
      await exchangeCode(code, verifier);
      res.redirect("/admin/campanas?conexion=correcta");
    } catch {
      // Neither OAuth codes nor provider responses belong in logs or the return URL.
      res.redirect("/admin/campanas?conexion=error");
    }
  });
}
