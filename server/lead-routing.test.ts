import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LeadCategoria } from "./lead-qualification";

// Mockeamos las dependencias: el enrutador decide con reglas puras de negocio.
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./lead-qualification", () => ({ calificarLeads: vi.fn() }));
vi.mock("./lead-qualification-sweep", () => ({ guardarVeredicto: vi.fn() }));
vi.mock("./lead-routing-config", () => ({ categoriasPermitidas: vi.fn() }));
vi.mock("./crm-sync", () => ({ syncLeadToCRM: vi.fn() }));

import { getDb } from "./db";
import { calificarLeads } from "./lead-qualification";
import { guardarVeredicto } from "./lead-qualification-sweep";
import { categoriasPermitidas } from "./lead-routing-config";
import { syncLeadToCRM } from "./crm-sync";
import { clasificarYEnrutar } from "./lead-routing";

// db.select().from().where().limit() → [lead]
function fakeDb(lead: unknown) {
  const chain: any = {
    select: () => chain,
    from: () => chain,
    where: () => chain,
    limit: () => Promise.resolve(lead ? [lead] : []),
  };
  return chain;
}

const LEAD = { id: 7, email: "x@empresa.com", crmSyncedAt: null };

function veredicto(categoria: LeadCategoria) {
  return { categoria, resumen: "", confianza: 1, fuente: "reglas" as const };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDb).mockResolvedValue(fakeDb(LEAD) as any);
  vi.mocked(guardarVeredicto).mockResolvedValue(true);
  vi.mocked(syncLeadToCRM).mockResolvedValue(true);
  // Filtro por defecto: solo proyecto.
  vi.mocked(categoriasPermitidas).mockResolvedValue(new Set<LeadCategoria>(["proyecto"]));
});

describe("clasificarYEnrutar", () => {
  it("sube al CRM de IAMET cuando el lead es proyecto", async () => {
    vi.mocked(calificarLeads).mockResolvedValue({ 7: veredicto("proyecto") });
    const r = await clasificarYEnrutar(7);
    expect(r).toEqual({ categoria: "proyecto", enviado: true });
    expect(syncLeadToCRM).toHaveBeenCalledWith(7);
  });

  it("NO sube una consulta con el filtro por defecto (solo proyecto)", async () => {
    vi.mocked(calificarLeads).mockResolvedValue({ 7: veredicto("consulta") });
    const r = await clasificarYEnrutar(7);
    expect(r).toEqual({ categoria: "consulta", enviado: false });
    expect(syncLeadToCRM).not.toHaveBeenCalled();
  });

  it("NO sube el ruido nunca", async () => {
    vi.mocked(calificarLeads).mockResolvedValue({ 7: veredicto("ruido") });
    const r = await clasificarYEnrutar(7);
    expect(r.enviado).toBe(false);
    expect(syncLeadToCRM).not.toHaveBeenCalled();
  });

  it("sube la consulta cuando el filtro la incluye", async () => {
    vi.mocked(categoriasPermitidas).mockResolvedValue(
      new Set<LeadCategoria>(["proyecto", "consulta"])
    );
    vi.mocked(calificarLeads).mockResolvedValue({ 7: veredicto("consulta") });
    const r = await clasificarYEnrutar(7);
    expect(r).toEqual({ categoria: "consulta", enviado: true });
    expect(syncLeadToCRM).toHaveBeenCalledWith(7);
  });

  it("si no se pudo clasificar (IA caída), no sube y se queda en el sitio", async () => {
    vi.mocked(calificarLeads).mockResolvedValue({}); // sin veredicto
    const r = await clasificarYEnrutar(7);
    expect(r).toEqual({ categoria: null, enviado: false });
    expect(guardarVeredicto).not.toHaveBeenCalled();
    expect(syncLeadToCRM).not.toHaveBeenCalled();
  });

  it("si el lead ya estaba sincronizado, no reclasifica ni reenvía", async () => {
    vi.mocked(getDb).mockResolvedValue(fakeDb({ ...LEAD, crmSyncedAt: new Date() }) as any);
    const r = await clasificarYEnrutar(7);
    expect(r).toEqual({ categoria: null, enviado: true });
    expect(calificarLeads).not.toHaveBeenCalled();
    expect(syncLeadToCRM).not.toHaveBeenCalled();
  });
});
