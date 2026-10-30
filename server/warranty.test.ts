import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { SignJWT } from "jose";
import { readFile } from "node:fs/promises";
import { warrantyRouter } from "./routers/warranty";
import { getDb } from "./db";
import { validateInvoice, MAX_INVOICE_BYTES } from "./warranty-validation";
import type { TrpcContext } from "./_core/context";
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./_core/env", () => ({
  ENV: { cookieSecret: "warranty-integration-test-secret" },
}));
let pg: PGlite;
let one: string;
let two: string;
let unverified: string;
let ticketId: number;
const invoice = {
  filename: "factura.pdf",
  mimeType: "application/pdf" as const,
  data: Buffer.from("%PDF-1.4\nInvoice fixture\n%%EOF").toString("base64"),
};
function ctx(token?: string, admin = false): TrpcContext {
  return {
    req: { headers: token ? { "x-store-token": token } : {} } as any,
    res: {} as any,
    user: admin ? ({ id: 1, role: "admin" } as any) : null,
  };
}
const customer = () => warrantyRouter.createCaller(ctx(one));
const other = () => warrantyRouter.createCaller(ctx(two));
const admin = () => warrantyRouter.createCaller(ctx(undefined, true));
beforeAll(async () => {
  pg = new PGlite();
  await pg.exec(
    `CREATE TABLE store_users(id serial PRIMARY KEY,name varchar(256),email varchar(320),email_verified boolean);`
  );
  // Actual schema uses camel-case column names for existing store accounts.
  await pg.exec(
    'ALTER TABLE store_users RENAME COLUMN email_verified TO "emailVerified";'
  );
  await pg.exec(
    await readFile(
      new URL("../drizzle/0005_customer-warranties.sql", import.meta.url),
      "utf8"
    )
  );
  await pg.exec(
    `INSERT INTO store_users(id,name,email,"emailVerified") VALUES (1,'Client One','one@example.com',true),(2,'Client Two','two@example.com',true),(3,'Unverified','unverified@example.com',false);`
  );
  vi.mocked(getDb).mockResolvedValue(drizzle(pg));
  const key = new TextEncoder().encode(
    "warranty-integration-test-secret_store"
  );
  async function token(id: number) {
    return new SignJWT({ sub: String(id) })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(key);
  }
  one = await token(1);
  two = await token(2);
  unverified = await token(3);
}, 30000);
afterAll(async () => pg?.close());
describe("Authenticated warranty lifecycle", () => {
  it("rejects missing, forged and unverified customer sessions", async () => {
    await expect(
      warrantyRouter.createCaller(ctx()).list()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      warrantyRouter.createCaller(ctx("forged")).list()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      warrantyRouter.createCaller(ctx(unverified)).list()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("returns the authenticated account profile without invoice data", async () => {
    expect(await customer().me()).toEqual({
      id: 1,
      name: "Client One",
      email: "one@example.com",
    });
  });
  it("creates a ticket, a private invoice and the initial history atomically", async () => {
    const ticket = await customer().create({
      product: "Equipo de prueba",
      description: "El equipo no enciende al conectarlo.",
      invoice,
    });
    ticketId = ticket.id;
    expect(ticket.reference).toMatch(/^GAR-/);
    expect(await customer().list()).toHaveLength(1);
    const detail = await customer().detail({ id: ticketId });
    expect(detail.ticket.storeUserId).toBe(1);
    expect(detail.updates).toHaveLength(1);
    expect(detail.ticket).not.toHaveProperty("data");
    expect(await customer().invoice({ id: ticketId })).toMatchObject(invoice);
  });
  it("does not expose another customer's ticket, invoice or conversation", async () => {
    expect(await other().list()).toEqual([]);
    await expect(other().detail({ id: ticketId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(other().invoice({ id: ticketId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      other().reply({ id: ticketId, message: "Attempted access" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("allows administrators to review and respond, with customer-visible history", async () => {
    await expect(customer().adminList()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const rows = await admin().adminList();
    expect(rows[0].customer.email).toBe("one@example.com");
    await admin().adminUpdate({
      id: ticketId,
      status: "awaiting_customer",
      message: "Indique el número de serie del equipo.",
    });
    await customer().reply({ id: ticketId, message: "Serie de prueba 12345" });
    const detail = await customer().detail({ id: ticketId });
    expect(detail.ticket.status).toBe("awaiting_customer");
    expect(detail.updates.map(u => u.author)).toEqual([
      "customer",
      "admin",
      "customer",
    ]);
    expect(await admin().adminInvoice({ id: ticketId })).toMatchObject(invoice);
  });
  it("keeps resolved tickets read-only to clients", async () => {
    await admin().adminUpdate({
      id: ticketId,
      status: "resolved",
      message: "Caso concluido después de la revisión.",
    });
    await expect(
      customer().reply({ id: ticketId, message: "Another message" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("keeps purchase and service orders scoped to their account", async () => {
    const order = await admin().adminCreateOrder({
      customerEmail: "one@example.com",
      reference: "TEST-PED-1",
      kind: "purchase",
      description: "Pedido de prueba",
    });
    await admin().adminCreateOrder({
      customerEmail: "one@example.com",
      reference: "TEST-OS-1",
      kind: "service",
      description: "Orden de servicio de prueba",
    });
    expect(await customer().orders()).toHaveLength(2);
    expect(await other().orders()).toEqual([]);
    await admin().adminUpdateOrder({ id: order.id, status: "completed" });
    expect(
      (await customer().orders()).find(o => o.id === order.id)?.status
    ).toBe("completed");
    await expect(
      customer().adminCreateOrder({
        customerEmail: "two@example.com",
        reference: "forged",
        kind: "purchase",
        description: "forged",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rejects disguised files without creating a partial ticket", async () => {
    const before = (await customer().list()).length;
    await expect(
      customer().create({
        product: "Equipo",
        description: "Descripción de prueba para validación",
        invoice: {
          ...invoice,
          data: Buffer.from("<script>alert(1)</script>").toString("base64"),
        },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(await customer().list()).toHaveLength(before);
  });
  it("rolls back the ticket and invoice if history persistence fails", async () => {
    const before = (await customer().list()).length;
    const invoiceBefore = await pg.query(
      "SELECT count(*) AS count FROM warranty_invoices"
    );
    await pg.exec(
      "ALTER TABLE warranty_updates ADD CONSTRAINT preview_history_failure CHECK (message <> 'Solicitud recibida. Pendiente de revisión de factura y condiciones de garantía.') NOT VALID;"
    );
    await expect(
      customer().create({
        product: "Equipo de prueba",
        description: "Prueba de transacción con fallo en historial",
        invoice,
      })
    ).rejects.toThrow();
    await pg.exec(
      "ALTER TABLE warranty_updates DROP CONSTRAINT preview_history_failure;"
    );
    expect(await customer().list()).toHaveLength(before);
    expect(
      await pg.query("SELECT count(*) AS count FROM warranty_invoices")
    ).toEqual(invoiceBefore);
  });
  it("limits invoice submissions per customer", async () => {
    for (let i = 0; i < 9; i++)
      await customer().create({
        product: "Equipo",
        description: "Descripción para prueba del límite diario",
        invoice,
      });
    await expect(
      customer().create({
        product: "Equipo",
        description: "Descripción para prueba del límite diario",
        invoice,
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
describe("Invoice validation", () => {
  it("rejects mismatched MIME, extensions, invalid base64 and oversized content", () => {
    for (const file of [
      { ...invoice, mimeType: "image/png" },
      { ...invoice, filename: "factura.html" },
      { ...invoice, data: "not base64" },
      {
        ...invoice,
        data: Buffer.alloc(MAX_INVOICE_BYTES + 1).toString("base64"),
      },
    ])
      expect(() => validateInvoice(file)).toThrow();
  });
  it("accepts PNG and JPEG signatures", () => {
    expect(
      validateInvoice({
        filename: "factura.png",
        mimeType: "image/png",
        data: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]).toString(
          "base64"
        ),
      })
    ).toBeTruthy();
    expect(
      validateInvoice({
        filename: "factura.jpg",
        mimeType: "image/jpeg",
        data: Buffer.from([255, 216, 255, 0]).toString("base64"),
      })
    ).toBeTruthy();
  });
});
