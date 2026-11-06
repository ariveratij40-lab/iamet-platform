import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { getDb } from "./db";
import { calificarLeads } from "./lead-qualification";
import { calificarLeadsRecientes } from "./lead-qualification-sweep";

vi.mock("./db", () => ({ getDb: vi.fn(), isMysqlDb: () => false }));
vi.mock("./lead-qualification", () => ({ calificarLeads: vi.fn() }));

describe.skipIf(!/^postgres(ql)?:/.test(process.env.DATABASE_URL ?? ""))("barrido en PostgreSQL", () => {
  let client: ReturnType<typeof postgres>;
  const v = { categoria: "consulta", resumen: "Consulta", confianza: 1, fuente: "reglas" } as const;

  beforeAll(async () => {
    client = postgres(process.env.DATABASE_URL!, { max: 1, idle_timeout: 0 });
    await client`CREATE TEMP TABLE leads (LIKE public.leads INCLUDING DEFAULTS)`;
    vi.mocked(getDb).mockResolvedValue(drizzle(client));
  });
  beforeEach(async () => {
    await client`TRUNCATE pg_temp.leads`;
  });
  afterAll(async () => { await client?.end(); });

  it("encuentra el pendiente detrás de 200 contactos ya calificados", async () => {
    await client`INSERT INTO pg_temp.leads (id, company, "contactName", email, "createdAt", "scoreBreakdown")
      SELECT i, 'Test', 'Test', 'test@example.com', now() - i * interval '1 second',
        CASE WHEN i <= 200 THEN '{"ai":{}}'::json ELSE NULL END FROM generate_series(1,201) AS i`;
    vi.mocked(calificarLeads).mockResolvedValueOnce({ 201: v });
    expect(await calificarLeadsRecientes()).toMatchObject({ revisados: 1, calificados: 1 });
    const [row] = await client`SELECT "scoreBreakdown" FROM pg_temp.leads WHERE id=201`;
    expect(row.scoreBreakdown.ai.categoria).toBe("consulta");
  });

  it("conserva cambios intermedios y respeta el veredicto de otro barrido", async () => {
    await client`INSERT INTO pg_temp.leads (id, company, "contactName", email)
      SELECT i, 'Test', 'Test', 'test@example.com' FROM generate_series(1,2) AS i`;
    vi.mocked(calificarLeads).mockImplementationOnce(async () => {
      await client`UPDATE pg_temp.leads SET "scoreBreakdown"='{"puntos":9}' WHERE id=1`;
      await client`UPDATE pg_temp.leads SET "scoreBreakdown"='{"ai":{"categoria":"proyecto"}}' WHERE id=2`;
      return { 1: v, 2: v };
    });
    expect(await calificarLeadsRecientes()).toMatchObject({ revisados: 2, calificados: 1 });
    const rows = await client`SELECT "scoreBreakdown" FROM pg_temp.leads ORDER BY id`;
    expect(rows[0].scoreBreakdown).toMatchObject({ puntos: 9, ai: { categoria: "consulta" } });
    expect(rows[1].scoreBreakdown).toEqual({ ai: { categoria: "proyecto" } });
  });
});
