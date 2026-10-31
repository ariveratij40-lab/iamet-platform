import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { getDb } from "./db";
import { recordAssistantTurn } from "./assistant-history";
import { visitorAssistantRouter } from "./routers/visitorAssistant";
vi.mock("./db", () => ({ getDb: vi.fn() }));
const pg = new PGlite();
const admin = () =>
  visitorAssistantRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: { id: 1, role: "admin" } as any,
  });
beforeAll(async () => {
  await pg.exec(
    await readFile(
      new URL("../drizzle/0006_assistant-conversations.sql", import.meta.url),
      "utf8"
    )
  );
  vi.mocked(getDb).mockResolvedValue(drizzle(pg));
});
afterAll(() => pg.close());
describe("Assistant CRM history", () => {
  it("saves real exchanges, checks ownership and aggregates correctly", async () => {
    const turn = {
      page: "/soluciones/infraestructura",
      question: "Instalar cableado",
      answer: "Podemos orientarle",
      mode: "guide",
      topic: "infraestructura",
    };
    const identity = await recordAssistantTurn(turn);
    expect(identity).toBeTruthy();
    await recordAssistantTurn({
      ...turn,
      conversation: identity!,
      question: "¿Certifican con Fluke?",
      mode: "ai",
    });
    await expect(
      recordAssistantTurn({
        ...turn,
        conversation: { ...identity!, token: "0".repeat(64) },
      })
    ).rejects.toThrow();
    const dashboard = await admin().dashboard({ days: 30, page: 0 });
    expect(dashboard.totals).toEqual({
      conversations: 1,
      exchanges: 2,
      ai: 1,
      guide: 1,
    });
    expect(dashboard.topics[0].count).toBe(2);
    const history = await admin().transcript({ id: identity!.id });
    expect(history.messages.map((m: any) => m.question)).toEqual([
      turn.question,
      "¿Certifican con Fluke?",
    ]);
    expect(JSON.stringify(history)).not.toContain(identity!.token);
    expect(JSON.stringify(dashboard)).not.toContain("tokenHash");
  });
  it.each([null, { id: 2, role: "user" }, { id: 3, role: "manager" }])(
    "denies non-administrators %s",
    async user => {
      const caller = visitorAssistantRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: user as any,
      });
      await expect(caller.dashboard({ days: 30 })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        caller.transcript({ id: "11111111-1111-4111-8111-111111111111" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  );
  it("paginates conversations and limits reports to the chosen period", async () => {
    await pg.exec(
      `UPDATE assistant_turns SET created_at = now() - interval '40 days'`
    );
    const report = await admin().dashboard({ days: 7 });
    expect(report.totals.exchanges).toBe(0);
    expect(report.items).toHaveLength(0);
    expect((await admin().dashboard({ days: 90 })).totals.exchanges).toBe(2);
    expect((await admin().dashboard({ days: 90, page: 1 })).items).toHaveLength(
      0
    );
  });
});
