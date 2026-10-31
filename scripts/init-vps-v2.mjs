import postgres from "postgres";
import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

if (!process.env.DATABASE_URL?.endsWith("/iamet_v2_staging"))
  throw new Error("Only the new iamet_v2_staging database is allowed");
const password = process.env.ADMIN_PASSWORD ?? "";
if (password.length < 16)
  throw new Error("ADMIN_PASSWORD must contain at least 16 characters");
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  const schema = await readFile(
    new URL("../deployment/vps-v2/schema.sql", import.meta.url),
    "utf8"
  );
  const fingerprint = createHash("sha256").update(schema).digest("hex");
  const tables =
    await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  if (tables.length)
    throw new Error("Database is not empty. Refusing to replace any data.");
  const hash = await bcrypt.hash(password, 12);
  await sql.begin(async tx => {
    await tx.unsafe(schema);
    await tx`CREATE TABLE iamet_deployment_state (fingerprint text NOT NULL, initialized_at timestamp NOT NULL DEFAULT now())`;
    await tx`INSERT INTO iamet_deployment_state (fingerprint) VALUES (${fingerprint})`;
    await tx`INSERT INTO users ("openId",email,name,role,"loginMethod","passwordHash",status) VALUES ('local:alvaro.rivera@iamet.mx','alvaro.rivera@iamet.mx','Álvaro Rivera','admin','local',${hash},'active')`;
    const services = [
      ["infraestructura", "Infraestructura física de cableado estructurado"],
      ["cctv", "Sistemas de video CCTV"],
      ["control-acceso", "Sistemas de control de acceso"],
      ["energia", "Sistemas de energía"],
      ["rfid", "Soluciones de RFID"],
      ["software-ia", "Desarrollo de aplicaciones"],
      ["polizas-servicios", "Pólizas y servicios administrados"],
    ];
    for (const [order, [slug, name]] of services.entries())
      await tx`INSERT INTO verticals (slug,name,"order") VALUES (${slug},${name},${order})`;
  });
  console.log(
    "New database initialized; administrator: alvaro.rivera@iamet.mx"
  );
} catch (error) {
  console.error("Database initialization failed:", error.code ?? error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
