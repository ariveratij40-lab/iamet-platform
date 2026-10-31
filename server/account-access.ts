import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { getDb } from "./db";
import { storeUsers } from "../drizzle/schema";
import { findUserByEmail, signJWT, updateLastLogin } from "./local-auth";
import { ENV } from "./_core/env";
const dummyHash = bcrypt.hashSync("IAMET-placeholder-not-an-account", 12);
export class AccountAccessError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}
export async function authenticateAccount(email: string, password: string) {
  const db = await getDb();
  if (!db || !ENV.cookieSecret)
    throw new AccountAccessError(
      503,
      "El acceso no está disponible en este momento. Intente más tarde."
    );
  const normalized = email.trim().toLowerCase();
  const [staff, customers] = await Promise.all([
    findUserByEmail(normalized),
    db
      .select()
      .from(storeUsers)
      .where(eq(storeUsers.email, normalized))
      .limit(1),
  ]);
  const customer = customers[0];
  // Check both stores without revealing whether an email belongs to either one.
  const [staffValid, customerValid] = await Promise.all([
    bcrypt.compare(password, staff?.passwordHash ?? dummyHash),
    bcrypt.compare(password, customer?.passwordHash ?? dummyHash),
  ]);
  if (staffValid && staff?.role === "admin" && staff.status === "active") {
    const token = signJWT({
      sub: String(staff.id),
      email: staff.email,
      role: staff.role,
    });
    await updateLastLogin(staff.id);
    return {
      kind: "admin" as const,
      token,
      user: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
      },
    };
  }
  if (!customerValid || !customer)
    throw new AccountAccessError(401, "Correo o contraseña incorrectos.");
  if (!customer.emailVerified)
    throw new AccountAccessError(
      403,
      "Verifique su correo antes de iniciar sesión. Revise su bandeja de entrada."
    );
  const token = await new SignJWT({
    sub: String(customer.id),
    email: customer.email,
    name: customer.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(ENV.cookieSecret + "_store"));
  return {
    kind: "customer" as const,
    token,
    user: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
    },
  };
}
