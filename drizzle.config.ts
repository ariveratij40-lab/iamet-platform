import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

const isMysql = connectionString.startsWith("mysql://");

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  // @ts-ignore — dialect is a union; we detect at runtime
  dialect: isMysql ? "mysql" : "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
