#!/usr/bin/env node
/**
 * Script para crear el usuario administrador inicial de IAMET
 *
 * Uso:
 *   ADMIN_EMAIL=admin@iamet.mx \
 *   ADMIN_PASSWORD='contraseña-segura-min8' \
 *   ADMIN_NAME='Administrador IAMET' \
 *   node scripts/create-admin-user.mjs
 *
 * Variables de entorno requeridas:
 *   DATABASE_URL   — conexión MySQL/TiDB o PostgreSQL
 *   ADMIN_EMAIL    — correo del administrador
 *   ADMIN_PASSWORD — contraseña (mínimo 8 caracteres)
 *   ADMIN_NAME     — nombre completo (default: "Administrador IAMET")
 */

import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import postgres from "postgres";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Cargar .env si existe ────────────────────────────────────────────────────
try {
  const envPath = resolve(__dirname, "../.env");
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
} catch {
  // .env no existe — usar variables de entorno del sistema
}

// ─── Validar variables requeridas ─────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Administrador IAMET";

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está definida");
  process.exit(1);
}
if (!ADMIN_EMAIL) {
  console.error("❌ ADMIN_EMAIL no está definida");
  process.exit(1);
}
if (!ADMIN_PASSWORD) {
  console.error("❌ ADMIN_PASSWORD no está definida");
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
  console.error("❌ ADMIN_PASSWORD debe tener al menos 8 caracteres");
  process.exit(1);
}

const isMysql = DATABASE_URL.startsWith("mysql://");

// ─── MySQL/TiDB ───────────────────────────────────────────────────────────────
async function runMysql() {
  const conn = await mysql.createConnection(DATABASE_URL);

  // Verificar si ya existe un admin con contraseña local
  const [existing] = await conn.execute(
    "SELECT COUNT(*) as cnt FROM users WHERE role = 'admin' AND passwordHash IS NOT NULL"
  );
  const adminCount = Number(existing[0]?.cnt ?? 0);

  if (adminCount > 0) {
    console.log("⚠️  Ya existe un administrador con contraseña local.");
    console.log("   Si necesitas cambiar la contraseña, usa el panel de administración.");
    await conn.end();
    process.exit(0);
  }

  // Verificar si el email ya está registrado
  const [emailCheck] = await conn.execute(
    "SELECT id, role FROM users WHERE email = ? LIMIT 1",
    [ADMIN_EMAIL.toLowerCase()]
  );
  const existingUser = Array.isArray(emailCheck) ? emailCheck[0] : null;

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  if (existingUser) {
    // Actualizar usuario existente con contraseña y rol admin
    await conn.execute(
      "UPDATE users SET passwordHash = ?, role = 'admin', status = 'active', loginMethod = 'local', updatedAt = NOW() WHERE id = ?",
      [passwordHash, existingUser.id]
    );
    console.log(`✅ Usuario existente actualizado como admin: ${ADMIN_EMAIL}`);
    console.log(`   ID: ${existingUser.id}`);
  } else {
    // Crear nuevo usuario admin
    const openId = `local:${ADMIN_EMAIL.toLowerCase()}`;
    const [result] = await conn.execute(
      `INSERT INTO users (openId, email, name, role, loginMethod, passwordHash, status, createdAt, updatedAt, lastSignedIn)
       VALUES (?, ?, ?, 'admin', 'local', ?, 'active', NOW(), NOW(), NOW())`,
      [openId, ADMIN_EMAIL.toLowerCase(), ADMIN_NAME, passwordHash]
    );
    console.log(`✅ Administrador creado exitosamente`);
    console.log(`   ID: ${result.insertId}`);
  }

  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Nombre: ${ADMIN_NAME}`);
  console.log(`   Rol: admin`);
  console.log(`\n🔐 Puedes iniciar sesión en: /admin/login`);

  await conn.end();
}

// ─── PostgreSQL ───────────────────────────────────────────────────────────────
async function runPostgres() {
  const sql = postgres(DATABASE_URL, { max: 1 });

  // Verificar si ya existe un admin con contraseña local
  const existing = await sql`
    SELECT COUNT(*) as cnt FROM users
    WHERE role = 'admin' AND "passwordHash" IS NOT NULL
  `;
  const adminCount = Number(existing[0]?.cnt ?? 0);

  if (adminCount > 0) {
    console.log("⚠️  Ya existe un administrador con contraseña local.");
    console.log("   Si necesitas cambiar la contraseña, usa el panel de administración.");
    await sql.end();
    process.exit(0);
  }

  // Verificar si el email ya está registrado
  const emailCheck = await sql`
    SELECT id, role FROM users WHERE email = ${ADMIN_EMAIL.toLowerCase()} LIMIT 1
  `;
  const existingUser = emailCheck[0] ?? null;

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  if (existingUser) {
    await sql`
      UPDATE users SET
        "passwordHash" = ${passwordHash},
        role = 'admin',
        "status" = 'active',
        "loginMethod" = 'local',
        "updatedAt" = NOW()
      WHERE id = ${existingUser.id}
    `;
    console.log(`✅ Usuario existente actualizado como admin: ${ADMIN_EMAIL}`);
    console.log(`   ID: ${existingUser.id}`);
  } else {
    const openId = `local:${ADMIN_EMAIL.toLowerCase()}`;
    const result = await sql`
      INSERT INTO users (
        "openId", email, name, role, "loginMethod",
        "passwordHash", "status", "createdAt", "updatedAt", "lastSignedIn"
      ) VALUES (
        ${openId}, ${ADMIN_EMAIL.toLowerCase()}, ${ADMIN_NAME}, 'admin', 'local',
        ${passwordHash}, 'active', NOW(), NOW(), NOW()
      ) RETURNING id
    `;
    console.log(`✅ Administrador creado exitosamente`);
    console.log(`   ID: ${result[0].id}`);
  }

  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Nombre: ${ADMIN_NAME}`);
  console.log(`   Rol: admin`);
  console.log(`\n🔐 Puedes iniciar sesión en: /admin/login`);

  await sql.end();
}

// ─── Ejecutar ─────────────────────────────────────────────────────────────────
console.log("🚀 Creando usuario administrador IAMET...\n");

const runner = isMysql ? runMysql : runPostgres;
runner().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
