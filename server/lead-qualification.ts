/**
 * lead-qualification.ts — Califica los contactos (leads) que deja la página:
 * separa un proyecto real de una consulta general o del ruido.
 *
 * Portado del criterio del CRM de IAMET (`analizar_correos_recientes` +
 * `CorreoAnalisis`), que filtra el correo entrante en venta / respuesta /
 * ruido. Misma filosofía barata: el código hace lo pesado, la IA solo el paso
 * final.
 *
 *   1) REGLAS PRIMERO (gratis): lo obvio no gasta IA. Un formulario vacío, un
 *      correo de prueba o un dominio desechable se marca "ruido" sin llamar al
 *      modelo. Una empresa grande con una descripción detallada entra fuerte.
 *   2) IA SOLO PARA LOS DUDOSOS, en lote y con tope (`maxAI`): el modelo lee la
 *      descripción real del lead y decide la categoría con un resumen de una
 *      línea y una confianza. El ruido evidente nunca lo toca.
 *
 * El veredicto se guarda DENTRO de `scoreBreakdown.ai` (campo json que ya
 * existe) → sin cambios de base de datos. El `score` numérico del sitio se
 * conserva; esto solo lo enriquece con un porqué legible.
 */
import { invokeLLM } from "./_core/llm";
import type { Lead } from "../drizzle/schema";

// Las tres categorías, equivalentes a las del CRM adaptadas a un lead entrante.
export type LeadCategoria = "proyecto" | "consulta" | "ruido";

export type LeadVeredicto = {
  categoria: LeadCategoria;
  resumen: string; // una línea de contexto para quien revisa la lista
  confianza: number; // 0..1
  fuente: "reglas" | "ia";
};

// ── Señales de ruido evidente — se resuelven sin IA ──────────────────────────
const DOMINIOS_DESECHABLES = [
  "mailinator.com", "tempmail", "guerrillamail", "10minutemail", "yopmail",
  "trashmail", "sharklasers", "example.com", "test.com",
];
const RUIDO_TEXTO =
  /\b(test|prueba|asdf|qwerty|lorem ipsum|xxx+|http:\/\/|https:\/\/|viagra|seo|posicionamiento web|backlinks|crypto|bitcoin)\b/i;

const normal = (s: string | null | undefined) => (s ?? "").trim();

/**
 * Veredicto por reglas (gratis). Devuelve un veredicto firme cuando la señal es
 * clara, o `null` cuando el caso es dudoso y conviene preguntarle a la IA.
 */
export function veredictoPorReglas(lead: Pick<Lead,
  "email" | "problemDescription" | "companySize" | "verticalSlug" | "industry">
): LeadVeredicto | null {
  const email = normal(lead.email).toLowerCase();
  const desc = normal(lead.problemDescription);

  // Ruido evidente → cerramos sin IA.
  const dominio = email.split("@")[1] ?? "";
  if (!email || !email.includes("@") ||
      DOMINIOS_DESECHABLES.some(d => dominio.includes(d))) {
    return { categoria: "ruido", resumen: "Correo inválido o desechable.", confianza: 0.9, fuente: "reglas" };
  }
  if (desc.length < 15 && !lead.verticalSlug) {
    return { categoria: "ruido", resumen: "Sin descripción ni solución de interés.", confianza: 0.6, fuente: "reglas" };
  }
  if (RUIDO_TEXTO.test(desc) && desc.length < 60) {
    return { categoria: "ruido", resumen: "El texto parece prueba o spam.", confianza: 0.7, fuente: "reglas" };
  }

  // Proyecto evidente → tampoco necesita IA: empresa con tamaño declarado,
  // vertical elegida y una descripción con sustancia.
  const grande = lead.companySize === "201-500" || lead.companySize === "500+";
  if (grande && lead.verticalSlug && desc.length > 100) {
    return {
      categoria: "proyecto",
      resumen: "Empresa grande con requerimiento detallado en una solución concreta.",
      confianza: 0.6,
      fuente: "reglas",
    };
  }

  // Todo lo demás es dudoso → que lo decida la IA.
  return null;
}

// ── Capa de IA, solo para los dudosos, en lote ───────────────────────────────
const SISTEMA_IA =
  "Eres un filtro de prospectos para IAMET, integrador de cableado estructurado, " +
  "CCTV, control de acceso, energía y RFID. Para CADA contacto (clave = su id) decide UNA categoría:\n" +
  "- 'proyecto': describe una necesidad real y accionable — pide cotización, menciona " +
  "alcance (puntos de red, cámaras, plantas, metros, fechas) o un problema concreto que " +
  "IAMET resuelve. Amerita que un vendedor lo contacte pronto.\n" +
  "- 'consulta': contacto legítimo pero general — pide información, hace una pregunta, " +
  "explora, sin un proyecto aterrizado todavía.\n" +
  "- 'ruido': prueba, spam, oferta de servicios AJENOS a IAMET (SEO, crypto, posicionamiento), " +
  "texto sin sentido o irrelevante.\n" +
  "Responde SOLO un JSON: {\"veredictos\":[{\"id\":<id>,\"categoria\":\"proyecto|consulta|ruido\"," +
  "\"resumen\":\"<=90 caracteres, en español, el porqué\",\"confianza\":0..1}]}. " +
  "No inventes datos que el contacto no haya escrito.";

type LeadParaIA = Pick<Lead, "id" | "email" | "company" | "industry" | "companySize" | "verticalSlug" | "problemDescription">;

function lineaLead(l: LeadParaIA): string {
  return [
    `id=${l.id}`,
    l.company && `empresa="${l.company}"`,
    l.industry && `industria="${l.industry}"`,
    l.companySize && `tamaño=${l.companySize}`,
    l.verticalSlug && `solución=${l.verticalSlug}`,
    `descripción="${normal(l.problemDescription).slice(0, 500)}"`,
  ].filter(Boolean).join(" · ");
}

/**
 * Pide a la IA el veredicto de un lote de leads dudosos. Una sola llamada para
 * todo el lote. Si la IA falla o no hay clave, devuelve {} y el llamador deja
 * los leads como estaban (nunca rompe el flujo).
 */
export async function veredictosPorIA(
  lote: LeadParaIA[],
  opts: { signal?: AbortSignal } = {}
): Promise<Record<number, LeadVeredicto>> {
  if (lote.length === 0) return {};
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: SISTEMA_IA },
        { role: "user", content: lote.map(lineaLead).join("\n") },
      ],
      maxTokens: 60 + lote.length * 40,
      signal: opts.signal ?? AbortSignal.timeout(20000),
    });
    const texto = result.choices?.[0]?.message?.content;
    return parsearVeredictos(typeof texto === "string" ? texto : "");
  } catch {
    return {};
  }
}

/** Extrae los veredictos del texto del modelo. Tolerante a texto alrededor del JSON. */
export function parsearVeredictos(texto: string): Record<number, LeadVeredicto> {
  const out: Record<number, LeadVeredicto> = {};
  const m = texto.match(/\{[\s\S]*\}/);
  if (!m) return out;
  let data: any;
  try {
    data = JSON.parse(m[0]);
  } catch {
    return out;
  }
  const arr = Array.isArray(data?.veredictos) ? data.veredictos : [];
  for (const v of arr) {
    const id = Number(v?.id);
    const categoria = v?.categoria;
    if (!Number.isInteger(id)) continue;
    if (categoria !== "proyecto" && categoria !== "consulta" && categoria !== "ruido") continue;
    out[id] = {
      categoria,
      resumen: String(v?.resumen ?? "").slice(0, 120),
      confianza: Math.max(0, Math.min(1, Number(v?.confianza) || 0.5)),
      fuente: "ia",
    };
  }
  return out;
}

/**
 * Califica un conjunto de leads: reglas primero, IA solo para los dudosos y
 * con tope. Devuelve un veredicto por cada lead que se pudo calificar.
 * No toca la base de datos — el llamador decide qué guardar.
 */
export async function calificarLeads(
  leads: LeadParaIA[],
  opts: { maxAI?: number; signal?: AbortSignal } = {}
): Promise<Record<number, LeadVeredicto>> {
  const maxAI = opts.maxAI ?? 15;
  const veredictos: Record<number, LeadVeredicto> = {};
  const dudosos: LeadParaIA[] = [];

  for (const lead of leads) {
    const porReglas = veredictoPorReglas(lead);
    if (porReglas) veredictos[lead.id] = porReglas;
    else dudosos.push(lead);
  }

  const paraIA = dudosos.slice(0, maxAI);
  if (paraIA.length > 0) {
    Object.assign(veredictos, await veredictosPorIA(paraIA, { signal: opts.signal }));
  }
  // Los dudosos que excedieron el tope se dejan sin veredicto: se califican en
  // la siguiente pasada. Nunca forzamos un juicio sin leer.
  return veredictos;
}
