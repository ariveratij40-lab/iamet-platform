import { jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { storeUsers } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { findUserById, verifyJWT } from "./local-auth";

export async function getAccountProfile(tokens: {
  customerToken?: string;
  staffToken?: string;
}) {
  if (!ENV.cookieSecret) return null;
  if (tokens.customerToken !== undefined) {
    if (!tokens.customerToken) return null;
    let id: number;
    try {
      const { payload } = await jwtVerify(
        tokens.customerToken,
        new TextEncoder().encode(ENV.cookieSecret + "_store"),
        { algorithms: ["HS256"] }
      );
      if (typeof payload.sub !== "string" || !/^[1-9][0-9]*$/.test(payload.sub))
        return null;
      id = Number(payload.sub);
      if (!Number.isSafeInteger(id)) return null;
    } catch {
      return null;
    }
    const db = await getDb();
    if (!db) return null;
    const [user] = await db
      .select({
        id: storeUsers.id,
        name: storeUsers.name,
        email: storeUsers.email,
        company: storeUsers.company,
        phone: storeUsers.phone,
        verified: storeUsers.emailVerified,
      })
      .from(storeUsers)
      .where(eq(storeUsers.id, id))
      .limit(1);
    if (!user?.verified) return null;
    const { verified, ...profile } = user;
    return { ...profile, kind: "customer" as const };
  }
  const payload = tokens.staffToken ? verifyJWT(tokens.staffToken) : null;
  if (
    !payload ||
    typeof payload.sub !== "string" ||
    !/^[1-9][0-9]*$/.test(payload.sub)
  )
    return null;
  const id = Number(payload.sub);
  if (!Number.isSafeInteger(id)) return null;
  const user = await findUserById(id);
  if (!user || user.status !== "active" || user.role !== "admin") return null;
  return {
    id: user.id,
    kind: "admin" as const,
    name: user.name,
    email: user.email,
    company: null,
    phone: null,
  };
}
