/**
 * Autenticación local IAMET — bcrypt + JWT
 * Sin dependencia de Manus OAuth
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import { ENV } from "./_core/env";
import { getDb, isMysqlDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

// Pool mysql2 directo para queries de auth (Drizzle no expone .execute() con params en mysql2)
let _mysqlPool: mysql.Pool | null = null;
function getMysqlPool(): mysql.Pool {
  if (!_mysqlPool) {
    _mysqlPool = mysql.createPool(process.env.DATABASE_URL!);
  }
  return _mysqlPool;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LocalUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  status: string;
  lastLoginAt: Date | null;
}

export interface JWTPayload {
  sub: string;       // user id as string
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = "7d";
const COOKIE_NAME = "iamet_session";

// ─── Helpers de contraseña ────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Helpers JWT ──────────────────────────────────────────────────────────────

export function signJWT(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const secret = ENV.cookieSecret;
  if (!secret) throw new Error("JWT_SECRET no configurado");
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const secret = ENV.cookieSecret;
    if (!secret) return null;
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;

export function cookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
    path: "/",
  };
}

// ─── Consultas de usuario ─────────────────────────────────────────────────────

/**
 * Busca un usuario por email — incluye passwordHash para verificación interna.
 * NUNCA retornar este objeto directamente al cliente.
 */
export async function findUserByEmail(email: string): Promise<(LocalUser & { passwordHash: string | null }) | null> {
  const db = await getDb();
  if (!db) return null;

  const isMysql = isMysqlDb();

  if (isMysql) {
    // MySQL: usar pool mysql2 directamente (Drizzle no expone .execute() con params en mysql2)
    const pool = getMysqlPool();
    const [rows] = await pool.execute(
      `SELECT id, email, name, role, status, lastLoginAt, passwordHash
       FROM users WHERE email = ? AND status = 'active' LIMIT 1`,
      [email]
    ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status,
      lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
      passwordHash: row.passwordHash ?? null,
    };
  } else {
    // PostgreSQL: usar Drizzle ORM
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: sql<string>`"status"`,
        lastLoginAt: sql<Date | null>`"lastLoginAt"`,
        passwordHash: sql<string | null>`"passwordHash"`,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!result.length) return null;
    const r = result[0];
    return {
      id: r.id,
      email: r.email ?? "",
      name: r.name,
      role: r.role,
      status: r.status ?? "active",
      lastLoginAt: r.lastLoginAt,
      passwordHash: r.passwordHash,
    };
  }
}

export async function findUserById(id: number): Promise<LocalUser | null> {
  const db = await getDb();
  if (!db) return null;

  const isMysql = isMysqlDb();

  if (isMysql) {
    const pool = getMysqlPool();
    const [rows] = await pool.execute(
      `SELECT id, email, name, role, status, lastLoginAt
       FROM users WHERE id = ? AND status = 'active' LIMIT 1`,
      [id]
    ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      status: row.status,
      lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt) : null,
    };
  } else {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        status: sql<string>`"status"`,
        lastLoginAt: sql<Date | null>`"lastLoginAt"`,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!result.length) return null;
    const r = result[0];
    return {
      id: r.id,
      email: r.email ?? "",
      name: r.name,
      role: r.role,
      status: r.status ?? "active",
      lastLoginAt: r.lastLoginAt,
    };
  }
}

export async function updateLastLogin(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const isMysql = isMysqlDb();
  if (isMysql) {
    const pool = getMysqlPool();
    await pool.execute(
      "UPDATE users SET lastLoginAt = NOW() WHERE id = ?",
      [userId]
    );
  } else {
    await db.execute(
      sql`UPDATE users SET "lastLoginAt" = NOW() WHERE id = ${userId}`
    );
  }
}

export async function adminExists(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const isMysql = isMysqlDb();
  if (isMysql) {
    const pool = getMysqlPool();
    const [rows] = await pool.execute(
      "SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND passwordHash IS NOT NULL"
    ) as [mysql.RowDataPacket[], mysql.FieldPacket[]];
    const row = Array.isArray(rows) ? rows[0] : null;
    return row ? Number(row.cnt) > 0 : false;
  } else {
    const result = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND "passwordHash" IS NOT NULL`
    );
    return Number(result[0]?.cnt ?? 0) > 0;
  }
}

export async function createLocalUser(params: {
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
}): Promise<LocalUser> {
  const db = await getDb();
  if (!db) throw new Error("Base de datos no disponible");

  const isMysql = isMysqlDb();
  const role = params.role ?? "user";

  if (isMysql) {
    // openId requerido por el schema — usar email como openId para usuarios locales
    const openId = `local:${params.email}`;
    const pool = getMysqlPool();
    const [result] = await pool.execute(
      `INSERT INTO users (openId, email, name, role, loginMethod, passwordHash, status, createdAt, updatedAt, lastSignedIn)
       VALUES (?, ?, ?, ?, 'local', ?, 'active', NOW(), NOW(), NOW())`,
      [openId, params.email, params.name, role, params.passwordHash]
    ) as [mysql.ResultSetHeader, mysql.FieldPacket[]];
    const insertId = result.insertId;
    return {
      id: insertId,
      email: params.email,
      name: params.name,
      role,
      status: "active",
      lastLoginAt: null,
    };
  } else {
    const openId = `local:${params.email}`;
    const result = await db
      .insert(users)
      .values({
        openId,
        email: params.email,
        name: params.name,
        role: role as "admin" | "user",
        loginMethod: "local",
      })
      .returning({ id: users.id });

    // Actualizar passwordHash en PostgreSQL (campo extra no en schema Drizzle)
    await db.execute(
      sql`UPDATE users SET "passwordHash" = ${params.passwordHash}, "status" = 'active' WHERE id = ${result[0].id}`
    );

    return {
      id: result[0].id,
      email: params.email,
      name: params.name,
      role,
      status: "active",
      lastLoginAt: null,
    };
  }
}
