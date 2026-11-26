import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  adsConfig,
  adsReport,
  forecastAds,
  keywordIdeas,
  disconnectAds,
  savedToken,
  startAuthorization,
} from "../google-ads";
import { SESSION_COOKIE } from "../local-auth";
import { parse } from "cookie";
async function safe<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        error instanceof Error
          ? error.message
          : "No se pudo consultar Google Ads.",
    });
  }
}
export const googleAdsRouter = router({
  status: adminProcedure.query(() =>
    safe(async () => ({
      configured: Boolean(adsConfig()),
      connected: adsConfig() ? Boolean(await savedToken()) : false,
      customer: adsConfig()?.customer ?? null,
    }))
  ),
  connect: adminProcedure.mutation(({ ctx }) =>
    safe(async () => {
      // Do not accept cross-origin mutations even if CORS permits a development origin.
      if (ctx.req.headers.origin !== new URL(process.env.VITE_APP_URL!).origin)
        throw new Error("Inicie la conexión desde el CRM de IAMET.");
      const session = parse(ctx.req.headers.cookie ?? "")[SESSION_COOKIE];
      if (!session) throw new Error("Inicie sesión nuevamente.");
      return { url: startAuthorization(ctx.user.id, session) };
    })
  ),
  disconnect: adminProcedure.mutation(({ ctx }) =>
    safe(async () => {
      if (ctx.req.headers.origin !== new URL(process.env.VITE_APP_URL!).origin)
        throw new Error("Solicitud inválida.");
      await disconnectAds();
      return { success: true };
    })
  ),
  ideas: adminProcedure
    .input(
      z.object({
        city: z.enum(["Tijuana", "Mexicali", "Tecate", "Ensenada"]),
        keywords: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
      })
    )
    .mutation(({ input }) => safe(() => keywordIdeas(input))),
  forecast: adminProcedure
    .input(
      z.object({
        budget: z.number().finite().min(1).max(10000000),
        city: z.enum(["Tijuana", "Mexicali", "Tecate", "Ensenada"]),
        keywords: z.array(z.string().trim().min(1).max(80)).min(1).max(30),
        match: z.enum(["EXACT", "PHRASE"]),
      })
    )
    .mutation(({ input }) => safe(() => forecastAds(input))),
  report: adminProcedure
    .input(
      z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]) })
    )
    .query(({ input }) => safe(() => adsReport(input.days))),
});
