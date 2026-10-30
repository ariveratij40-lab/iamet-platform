import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { jwtVerify } from "jose";
import { and, eq, desc, count, gte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import {
  storeUsers,
  warrantyTickets,
  warrantyUpdates,
  warrantyInvoices,
  customerOrders,
} from "../../drizzle/schema";
import { validateInvoice, MAX_INVOICE_BYTES } from "../warranty-validation";

const statuses = z.enum([
  "received",
  "reviewing",
  "awaiting_customer",
  "approved",
  "rejected",
  "resolved",
]);

async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "El portal no está disponible. Intente más tarde.",
    });
  return db;
}
export async function requireWarrantyCustomer(token: string) {
  if (!ENV.cookieSecret)
    throw new TRPCError({
      code: "SERVICE_UNAVAILABLE",
      message: "El portal no está configurado.",
    });
  const { payload } = await jwtVerify(
    token,
    new TextEncoder().encode(ENV.cookieSecret + "_store"),
    { algorithms: ["HS256"] }
  ).catch(() => {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Inicie sesión nuevamente en su cuenta de cliente.",
    });
  });
  const id = Number(payload.sub);
  if (!Number.isSafeInteger(id) || id < 1)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Sesión de cliente inválida.",
    });
  const db = await database();
  const [user] = await db
    .select({
      id: storeUsers.id,
      emailVerified: storeUsers.emailVerified,
      name: storeUsers.name,
      email: storeUsers.email,
    })
    .from(storeUsers)
    .where(eq(storeUsers.id, id))
    .limit(1);
  if (!user || !user.emailVerified)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Verifique su correo e inicie sesión para continuar.",
    });
  return { db, id, user: { id: user.id, name: user.name, email: user.email } };
}
async function ownedTicket(db: any, id: number, ownerId?: number) {
  const [ticket] = await db
    .select()
    .from(warrantyTickets)
    .where(
      ownerId === undefined
        ? eq(warrantyTickets.id, id)
        : and(
            eq(warrantyTickets.id, id),
            eq(warrantyTickets.storeUserId, ownerId)
          )
    )
    .limit(1);
  if (!ticket)
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Ticket no encontrado.",
    });
  return ticket;
}
const customerProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req.headers["x-store-token"];
  if (typeof token !== "string" || !token || token.length > 4096)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Inicie sesión en su cuenta de cliente.",
    });
  const customer = await requireWarrantyCustomer(token);
  return next({ ctx: { ...ctx, warrantyCustomer: customer } });
});
export const warrantyRouter = router({
  me: customerProcedure.query(({ ctx }) => ctx.warrantyCustomer.user),
  list: customerProcedure.query(async ({ ctx }) => {
    const { db, id } = ctx.warrantyCustomer;
    return db
      .select()
      .from(warrantyTickets)
      .where(eq(warrantyTickets.storeUserId, id))
      .orderBy(desc(warrantyTickets.createdAt))
      .limit(100);
  }),
  orders: customerProcedure.query(async ({ ctx }) => {
    const { db, id } = ctx.warrantyCustomer;
    return db
      .select()
      .from(customerOrders)
      .where(eq(customerOrders.storeUserId, id))
      .orderBy(desc(customerOrders.createdAt))
      .limit(100);
  }),
  create: customerProcedure
    .input(
      z.object({
        product: z.string().trim().min(2).max(180),
        description: z.string().trim().min(10).max(2000),
        purchaseReference: z.string().trim().max(120).optional(),
        invoice: z.object({
          filename: z.string().min(1).max(180),
          mimeType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
          data: z.string().max(Math.ceil(MAX_INVOICE_BYTES / 3) * 4),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { db, id } = ctx.warrantyCustomer;
      const invoice = validateInvoice(input.invoice);
      const reference = `GAR-${randomUUID().slice(0, 18).toUpperCase()}`;
      return db.transaction(async (tx: any) => {
        await tx
          .select({ id: storeUsers.id })
          .from(storeUsers)
          .where(eq(storeUsers.id, id))
          .for("update");
        const [daily] = await tx
          .select({ total: count() })
          .from(warrantyTickets)
          .where(
            and(
              eq(warrantyTickets.storeUserId, id),
              gte(warrantyTickets.createdAt, new Date(Date.now() - 86400000))
            )
          );
        if (Number(daily.total) >= 10)
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Ha alcanzado el límite de solicitudes diarias. Contacte a IAMET.",
          });
        const [ticket] = await tx
          .insert(warrantyTickets)
          .values({
            storeUserId: id,
            reference,
            product: input.product,
            description: input.description,
            purchaseReference: input.purchaseReference,
          })
          .returning();
        await tx
          .insert(warrantyInvoices)
          .values({ ticketId: ticket.id, ...invoice });
        await tx.insert(warrantyUpdates).values({
          ticketId: ticket.id,
          author: "customer",
          message:
            "Solicitud recibida. Pendiente de revisión de factura y condiciones de garantía.",
          status: "received",
        });
        return { id: ticket.id, reference };
      });
    }),
  detail: customerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const { db, id } = ctx.warrantyCustomer;
      const ticket = await ownedTicket(db, input.id, id);
      const updates = await db
        .select()
        .from(warrantyUpdates)
        .where(eq(warrantyUpdates.ticketId, input.id))
        .orderBy(warrantyUpdates.createdAt, warrantyUpdates.id);
      return { ticket, updates };
    }),
  reply: customerProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        message: z.string().trim().min(2).max(2000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { db, id } = ctx.warrantyCustomer;
      await db.transaction(async (tx: any) => {
        const ticket = await ownedTicket(tx, input.id, id);
        if (["resolved", "rejected"].includes(ticket.status))
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "El ticket está cerrado. Contacte a IAMET si necesita una nueva revisión.",
          });
        await tx.insert(warrantyUpdates).values({
          ticketId: input.id,
          author: "customer",
          message: input.message,
        });
        await tx
          .update(warrantyTickets)
          .set({ updatedAt: new Date() })
          .where(eq(warrantyTickets.id, input.id));
      });
      return { ok: true };
    }),
  invoice: customerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const { db, id } = ctx.warrantyCustomer;
      await ownedTicket(db, input.id, id);
      const [file] = await db
        .select({
          filename: warrantyInvoices.filename,
          mimeType: warrantyInvoices.mimeType,
          data: warrantyInvoices.data,
        })
        .from(warrantyInvoices)
        .where(eq(warrantyInvoices.ticketId, input.id))
        .limit(1);
      if (!file)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Factura no encontrada.",
        });
      return file;
    }),
  adminList: adminProcedure.query(async () => {
    const db = await database();
    return db
      .select({
        ticket: warrantyTickets,
        customer: { name: storeUsers.name, email: storeUsers.email },
      })
      .from(warrantyTickets)
      .innerJoin(storeUsers, eq(storeUsers.id, warrantyTickets.storeUserId))
      .orderBy(desc(warrantyTickets.updatedAt))
      .limit(200);
  }),
  adminDetail: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await database();
      const ticket = await ownedTicket(db, input.id);
      return {
        ticket,
        updates: await db
          .select()
          .from(warrantyUpdates)
          .where(eq(warrantyUpdates.ticketId, input.id))
          .orderBy(warrantyUpdates.createdAt, warrantyUpdates.id),
      };
    }),
  adminInvoice: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await database();
      await ownedTicket(db, input.id);
      const [file] = await db
        .select({
          filename: warrantyInvoices.filename,
          mimeType: warrantyInvoices.mimeType,
          data: warrantyInvoices.data,
        })
        .from(warrantyInvoices)
        .where(eq(warrantyInvoices.ticketId, input.id))
        .limit(1);
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });
      return file;
    }),
  adminUpdate: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: statuses,
        message: z.string().trim().min(2).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await database();
      await db.transaction(async (tx: any) => {
        await ownedTicket(tx, input.id);
        await tx
          .update(warrantyTickets)
          .set({ status: input.status, updatedAt: new Date() })
          .where(eq(warrantyTickets.id, input.id));
        await tx.insert(warrantyUpdates).values({
          ticketId: input.id,
          author: "admin",
          message: input.message,
          status: input.status,
        });
      });
      return { ok: true };
    }),
  adminCreateOrder: adminProcedure
    .input(
      z.object({
        customerEmail: z.string().email(),
        reference: z.string().trim().min(2).max(64),
        kind: z.enum(["purchase", "service"]),
        description: z.string().trim().min(2).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await database();
      const [user] = await db
        .select({ id: storeUsers.id })
        .from(storeUsers)
        .where(eq(storeUsers.email, input.customerEmail.toLowerCase()))
        .limit(1);
      if (!user)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "El cliente debe registrarse primero.",
        });
      const [order] = await db
        .insert(customerOrders)
        .values({
          storeUserId: user.id,
          reference: input.reference,
          kind: input.kind,
          description: input.description,
        })
        .returning({ id: customerOrders.id });
      return order;
    }),
  adminOrders: adminProcedure.query(async () => {
    const db = await database();
    return db
      .select({
        order: customerOrders,
        customer: { name: storeUsers.name, email: storeUsers.email },
      })
      .from(customerOrders)
      .innerJoin(storeUsers, eq(storeUsers.id, customerOrders.storeUserId))
      .orderBy(desc(customerOrders.updatedAt))
      .limit(200);
  }),
  adminUpdateOrder: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["received", "processing", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await database();
      const rows = await db
        .update(customerOrders)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(customerOrders.id, input.id))
        .returning({ id: customerOrders.id });
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      return { ok: true };
    }),
});
