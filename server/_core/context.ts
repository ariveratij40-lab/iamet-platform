import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookies } from "cookie";
import { and, eq, sql } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { getDb } from "../db";
import { SESSION_COOKIE, verifyJWT } from "../local-auth";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = parseCookies(opts.req.headers.cookie ?? "")[SESSION_COOKIE];
    const payload = token ? verifyJWT(token) : null;
    if (
      payload &&
      typeof payload.sub === "string" &&
      /^[1-9][0-9]*$/.test(payload.sub)
    ) {
      const id = Number(payload.sub);
      if (Number.isSafeInteger(id)) {
        const db = await getDb();
        if (db) {
          const [localUser] = await db
            .select()
            .from(users)
            .where(and(eq(users.id, id), sql`"users"."status" = 'active'`))
            .limit(1);
          user = localUser ?? null;
        }
      }
    } else {
      user = await sdk.authenticateRequest(opts.req);
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
