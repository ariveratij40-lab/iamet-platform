#!/usr/bin/env node
/**
 * Migración de auth local — compatible con MySQL/TiDB y PostgreSQL
 * Uso: node scripts/migrate-auth.mjs
 */
import mysql from "mysql2/promise";
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL no está definida");
  process.exit(1);
}

const isMysql = DATABASE_URL.startsWith("mysql://");

async function migrateMysql() {
  const conn = await mysql.createConnection(DATABASE_URL);
  console.log("🔄 Migrando tabla users en MySQL/TiDB...");

  // Ver columnas actuales
  const [cols] = await conn.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE()"
  );
  const existing = cols.map((c) => c.COLUMN_NAME);
  console.log("📋 Columnas actuales:", existing.join(", "));

  if (!existing.includes("passwordHash")) {
    await conn.execute("ALTER TABLE users ADD COLUMN `passwordHash` TEXT");
    console.log("✅ passwordHash agregada");
  } else console.log("⏭️  passwordHash ya existe");

  if (!existing.includes("status")) {
    await conn.execute("ALTER TABLE users ADD COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'active'");
    console.log("✅ status agregada");
  } else console.log("⏭️  status ya existe");

  if (!existing.includes("lastLoginAt")) {
    await conn.execute("ALTER TABLE users ADD COLUMN `lastLoginAt` DATETIME");
    console.log("✅ lastLoginAt agregada");
  } else console.log("⏭️  lastLoginAt ya existe");

  // Verificar columnas finales
  const [finalCols] = await conn.execute(
    "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE() ORDER BY ORDINAL_POSITION"
  );
  console.log("\n📊 Tabla users final:");
  finalCols.forEach((c) => console.log(`  - ${c.COLUMN_NAME}: ${c.DATA_TYPE}`));

  await conn.end();
  console.log("\n✅ Migración MySQL completada");
}

async function migratePostgres() {
  const sql = postgres(DATABASE_URL, { max: 1 });
  console.log("🔄 Migrando tabla users en PostgreSQL...");

  const cols = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' ORDER BY ordinal_position
  `;
  const existing = cols.map((c) => c.column_name);
  console.log("📋 Columnas actuales:", existing.join(", "));

  if (!existing.includes("passwordHash")) {
    await sql`ALTER TABLE users ADD COLUMN "passwordHash" TEXT`;
    console.log("✅ passwordHash agregada");
  } else console.log("⏭️  passwordHash ya existe");

  if (!existing.includes("status")) {
    await sql`ALTER TABLE users ADD COLUMN "status" VARCHAR(32) NOT NULL DEFAULT 'active'`;
    console.log("✅ status agregada");
  } else console.log("⏭️  status ya existe");

  if (!existing.includes("lastLoginAt")) {
    await sql`ALTER TABLE users ADD COLUMN "lastLoginAt" TIMESTAMP`;
    console.log("✅ lastLoginAt agregada");
  } else console.log("⏭️  lastLoginAt ya existe");

  // Extender enum role
  for (const val of ["manager", "viewer"]) {
    try {
      await sql`ALTER TYPE role ADD VALUE IF NOT EXISTS ${sql.unsafe(`'${val}'`)}`;
      console.log(`✅ Valor '${val}' agregado al enum role`);
    } catch (e) {
      console.log(`⏭️  ${val} ya existe en enum role`);
    }
  }

  await sql.end();
  console.log("\n✅ Migración PostgreSQL completada");
}

if (isMysql) {
  migrateMysql().catch((e) => { console.error("❌", e.message); process.exit(1); });
} else {
  migratePostgres().catch((e) => { console.error("❌", e.message); process.exit(1); });
}
