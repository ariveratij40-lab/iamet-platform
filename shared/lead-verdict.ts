/**
 * lead-verdict.ts — Lectura y presentación del veredicto de IA de un lead.
 *
 * El veredicto lo escribe el barrido del servidor dentro de `scoreBreakdown.ai`
 * (ver server/lead-qualification.ts). Aquí vive lo que el panel necesita para
 * mostrarlo: leerlo con seguridad y darle una etiqueta y un color. Compartido
 * para no duplicar strings entre el front y cualquier otra vista.
 */
export type LeadCategoria = "proyecto" | "consulta" | "ruido";

export type VeredictoLead = {
  categoria: LeadCategoria;
  resumen: string;
  confianza: number;
  fuente: "reglas" | "ia";
};

/** Lee el veredicto de IA desde el scoreBreakdown del lead, o null si no hay. */
export function leerVeredicto(scoreBreakdown: unknown): VeredictoLead | null {
  if (!scoreBreakdown || typeof scoreBreakdown !== "object") return null;
  const ai = (scoreBreakdown as Record<string, unknown>).ai;
  if (!ai || typeof ai !== "object") return null;
  const v = ai as Record<string, unknown>;
  const categoria = v.categoria;
  if (categoria !== "proyecto" && categoria !== "consulta" && categoria !== "ruido") return null;
  return {
    categoria,
    resumen: typeof v.resumen === "string" ? v.resumen : "",
    confianza: typeof v.confianza === "number" ? v.confianza : 0,
    fuente: v.fuente === "ia" ? "ia" : "reglas",
  };
}

/** Etiqueta y colores de cada categoría, para la insignia del panel. */
export const PRESENTACION_CATEGORIA: Record<LeadCategoria, { etiqueta: string; color: string }> = {
  proyecto: { etiqueta: "Proyecto", color: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" },
  consulta: { etiqueta: "Consulta", color: "bg-sky-500/15 text-sky-300 border border-sky-500/30" },
  ruido: { etiqueta: "Ruido", color: "bg-slate-500/15 text-slate-400 border border-slate-500/30" },
};

/** Orden para listar: los proyectos primero, el ruido al final. */
export const ORDEN_CATEGORIA: Record<LeadCategoria, number> = {
  proyecto: 0,
  consulta: 1,
  ruido: 2,
};
