/**
 * agent-tools.ts — Capa de Herramientas del Agente Comercial Autónomo IAMET
 *
 * Cada herramienta es una función independiente que el orquestador LLM puede invocar.
 * El LLM nunca escribe directamente en la base de datos; siempre pasa por estas funciones.
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { getResend } from "./email";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// ─── Base de conocimiento IAMET ───────────────────────────────────────────────

const IAMET_KNOWLEDGE_BASE = `
IAMET Evolución Tecnológica — Base de Conocimiento Comercial

VERTICALES DE NEGOCIO:
1. Infraestructura Tecnológica: Cableado estructurado Panduit, racks, switches, fibra óptica, centros de datos
2. Seguridad Electrónica / CCTV: Cámaras IP Axis/Hikvision, DVR/NVR, analítica de video, monitoreo 24/7
3. Control de Acceso: Lectores HID, Mercury, Genetec, torniquetes, control biométrico, SKIA, HOROS
4. Audio y Voceo: Sistemas de evacuación, voceo IP, altavoces, amplificadores, integración con CCTV
5. Salas de Juntas: Videoconferencia Cisco/Poly, pantallas interactivas, control de sala, AV integrado
6. RFID y Automatización: Lectores RFID Zebra, control de inventario, trazabilidad, automatización industrial
7. Software e IA: Desarrollo a medida, integraciones, analítica, dashboards, automatización de procesos
8. Servicios Administrados: Mantenimiento preventivo/correctivo, NOC, helpdesk, pólizas de servicio
9. Cómputo y Licenciamiento: Servidores HP/Dell, workstations, licencias Microsoft/Adobe, virtualización
10. Compliance y Auditoría: ISO 27001, NIST, auditorías de seguridad, políticas, capacitación

PARTNERS PRINCIPALES: Panduit, Axis, HID, Mercury, Genetec, Cisco, Poly, Zebra, APC, HP, Dell, Microsoft, Hikvision

PROCESO COMERCIAL IAMET:
- Descubrimiento → Calificación → Propuesta → Negociación → Cierre
- Tiempo promedio de ciclo: 30-90 días según complejidad
- Ticket promedio: $150K - $5M MXN según proyecto

PREGUNTAS DE DISCOVERY CLAVE:
- ¿Cuántos empleados tiene la empresa?
- ¿Cuántas sucursales o ubicaciones?
- ¿Tienen Data Center propio?
- ¿Qué sistemas de seguridad utilizan actualmente?
- ¿Cuál es el presupuesto estimado para el proyecto?
- ¿Cuál es la urgencia o fecha límite?
- ¿Quién es el tomador de decisión?
- ¿Han trabajado con algún competidor? (Lenel, Bosch, Tyco, etc.)
`;

// ─── Herramienta 1: searchKnowledge ──────────────────────────────────────────

export async function searchKnowledge(query: string): Promise<ToolResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Eres un experto en tecnología IAMET. Responde la siguiente consulta basándote SOLO en esta base de conocimiento:\n\n${IAMET_KNOWLEDGE_BASE}\n\nSé conciso y específico. Máximo 3 párrafos.`,
        },
        { role: "user", content: query },
      ],
    });
    const rawAnswer = response?.choices?.[0]?.message?.content;
    const answer = typeof rawAnswer === 'string' ? rawAnswer : '';
    return { success: true, data: { answer } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 2: searchProducts ───────────────────────────────────────────

export async function searchProducts(query: string, category?: string): Promise<ToolResult> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "DB no disponible" };
    const categoryFilter = category ? `AND sc.slug = '${category.replace(/'/g, "''")}'` : "";
    const rows = await db.execute(sql.raw(
      `SELECT sp.id, sp.name, sp.shortDesc, sp.sku, sp.priceRef, sp.unit, sc.name as categoryName
       FROM store_products sp
       LEFT JOIN store_categories sc ON sc.id = sp.categoryId
       WHERE sp.active = 1
         AND (sp.name LIKE '%${query.replace(/'/g, "''")}%' OR sp.shortDesc LIKE '%${query.replace(/'/g, "''")}%' OR sp.description LIKE '%${query.replace(/'/g, "''")}%')
         ${categoryFilter}
       LIMIT 8`
    )) as any;
    const products = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return { success: true, data: { products } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 3: recommendSolutions ───────────────────────────────────────

export async function recommendSolutions(
  needs: string,
  industry: string,
  companySize: string
): Promise<ToolResult> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Eres el arquitecto de soluciones de IAMET Evolución Tecnológica. 
          
Contexto de la empresa:
${IAMET_KNOWLEDGE_BASE}

Tu tarea: Construir una arquitectura de solución completa para el cliente.
Responde SOLO con un JSON con esta estructura:
{
  "architecture": "descripción de la arquitectura propuesta",
  "products": ["producto1", "producto2", ...],
  "partners": ["partner1", "partner2", ...],
  "estimatedBudget": { "min": número, "max": número, "currency": "MXN" },
  "timeline": "tiempo estimado de implementación",
  "nextStep": "acción recomendada para avanzar"
}`,
        },
        {
          role: "user",
          content: `Necesidades: ${needs}\nIndustria: ${industry}\nTamaño de empresa: ${companySize}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "solution_recommendation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              architecture: { type: "string" },
              products: { type: "array", items: { type: "string" } },
              partners: { type: "array", items: { type: "string" } },
              estimatedBudget: {
                type: "object",
                properties: {
                  min: { type: "number" },
                  max: { type: "number" },
                  currency: { type: "string" },
                },
                required: ["min", "max", "currency"],
                additionalProperties: false,
              },
              timeline: { type: "string" },
              nextStep: { type: "string" },
            },
            required: ["architecture", "products", "partners", "estimatedBudget", "timeline", "nextStep"],
            additionalProperties: false,
          },
        },
      },
    });
    const rawContent = response?.choices?.[0]?.message?.content;
    const raw = typeof rawContent === 'string' ? rawContent : '{}';
    const recommendation = JSON.parse(raw);
    return { success: true, data: recommendation };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 4: createLead ────────────────────────────────────────────────

export async function createLeadTool(data: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  industry?: string;
  companySize?: string;
  interest?: string;
  budget?: string;
  urgency?: string;
  sessionId?: string;
}): Promise<ToolResult> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "DB no disponible" };
    const nameSafe = data.name.replace(/'/g, "''");
    const emailSafe = data.email.replace(/'/g, "''");
    const companySafe = (data.company ?? "").replace(/'/g, "''");
    const phoneSafe = (data.phone ?? "").replace(/'/g, "''");
    const industrySafe = (data.industry ?? "").replace(/'/g, "''");
    const interestSafe = (data.interest ?? "").replace(/'/g, "''");
    const budgetSafe = (data.budget ?? "").replace(/'/g, "''");
    const urgencySafe = (data.urgency ?? "").replace(/'/g, "''");
    const companySizeSafe = (data.companySize ?? "").replace(/'/g, "''");
    const result = await db.execute(sql.raw(
      `INSERT INTO leads (name, email, company, phone, industry, company_size, interest, budget, urgency, status, created_at, updated_at)
       VALUES ('${nameSafe}', '${emailSafe}', '${companySafe}', '${phoneSafe}', '${industrySafe}', '${companySizeSafe}', '${interestSafe}', '${budgetSafe}', '${urgencySafe}', 'new', NOW(), NOW())`
    )) as any;
    const leadId = result?.[0]?.insertId ?? result?.insertId;
    // Link lead to conversation if sessionId provided
    if (data.sessionId && leadId) {
      await db.execute(sql.raw(
        `UPDATE conversations SET lead_id = ${leadId} WHERE session_id = '${data.sessionId.replace(/'/g, "''")}' LIMIT 1`
      ));
    }
    return { success: true, data: { leadId, message: `Lead creado con ID ${leadId}` } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 5: updateLead ────────────────────────────────────────────────

export async function updateLeadTool(
  leadId: number,
  data: Partial<{
    industry: string;
    companySize: string;
    budget: string;
    urgency: string;
    decisionMaker: string;
    competitors: string;
    notes: string;
    status: string;
  }>
): Promise<ToolResult> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "DB no disponible" };
    const setClauses: string[] = [];
    if (data.industry) setClauses.push(`industry = '${data.industry.replace(/'/g, "''")}'`);
    if (data.companySize) setClauses.push(`company_size = '${data.companySize.replace(/'/g, "''")}'`);
    if (data.budget) setClauses.push(`budget = '${data.budget.replace(/'/g, "''")}'`);
    if (data.urgency) setClauses.push(`urgency = '${data.urgency.replace(/'/g, "''")}'`);
    if (data.notes) setClauses.push(`notes = '${data.notes.replace(/'/g, "''")}'`);
    if (data.status) setClauses.push(`status = '${data.status.replace(/'/g, "''")}'`);
    if (setClauses.length === 0) return { success: true, data: { message: "Sin cambios" } };
    setClauses.push("updated_at = NOW()");
    await db.execute(sql.raw(`UPDATE leads SET ${setClauses.join(", ")} WHERE id = ${leadId}`));
    return { success: true, data: { message: `Lead ${leadId} actualizado` } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 6: calculateLeadScoreTool ───────────────────────────────────

export async function calculateLeadScoreTool(leadId: number): Promise<ToolResult> {
  try {
    const { calculateLeadScore } = await import("./scoring");
    const result = await calculateLeadScore(leadId);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 7: assignSalesperson ────────────────────────────────────────

export async function assignSalesperson(
  leadId: number,
  criteria: { vertical?: string; industry?: string }
): Promise<ToolResult> {
  // IAMET sales team mapping by vertical
  const salesTeam: Record<string, string> = {
    "infraestructura": "Marco Reyes — Especialista en Infraestructura",
    "seguridad": "Luis Hernández — Especialista en Seguridad Electrónica",
    "control-acceso": "Diego Castillo — Especialista en Control de Acceso",
    "rfid": "Diego Castillo — Especialista en RFID y Automatización",
    "software-ia": "Sofía Morales — Especialista en Software e IA",
    "servicios-administrados": "Álvaro Rivera — Director Comercial",
    "default": "Álvaro Rivera — Director Comercial",
  };
  const assigned = salesTeam[criteria.vertical ?? "default"] ?? salesTeam["default"];
  try {
    const db = await getDb();
    if (db) {
      await db.execute(sql.raw(
        `UPDATE leads SET notes = CONCAT(COALESCE(notes, ''), '\n[Vendedor asignado: ${assigned.replace(/'/g, "''")}]'), updated_at = NOW() WHERE id = ${leadId}`
      ));
    }
    return { success: true, data: { assigned, message: `Vendedor asignado: ${assigned}` } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 8: assignEngineer ────────────────────────────────────────────

export async function assignEngineer(
  leadId: number,
  criteria: { vertical?: string; specialty?: string }
): Promise<ToolResult> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "DB no disponible" };
    // Find engineer by specialty
    const verticalKeyword = criteria.vertical ?? criteria.specialty ?? "";
    const rows = await db.execute(sql.raw(
      `SELECT id, name, specialty, certifications FROM engineers WHERE active = 1 LIMIT 5`
    )) as any;
    const engineers = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    // Simple match: find engineer whose specialty contains the vertical keyword
    const matched = engineers.find((e: any) =>
      (e.specialty ?? "").toLowerCase().includes(verticalKeyword.toLowerCase())
    ) ?? engineers[0];
    if (!matched) return { success: false, error: "No hay ingenieros disponibles" };
    return {
      success: true,
      data: {
        engineerId: matched.id,
        engineerName: matched.name,
        specialty: matched.specialty,
        message: `Ingeniero asignado: ${matched.name} — ${matched.specialty}`,
      },
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 9: bookMeetingTool ──────────────────────────────────────────

export async function bookMeetingTool(params: {
  leadId?: number;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  company?: string;
  engineerId?: number;
  requestedDate?: string; // ISO date string
  notes?: string;
  sessionId?: string;
}): Promise<ToolResult> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "DB no disponible" };
    // Find next available slot
    const targetDate = params.requestedDate
      ? new Date(params.requestedDate).toISOString().split("T")[0]
      : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // +2 days
    const slotRows = await db.execute(sql.raw(
      `SELECT s.id, s.engineer_id, s.date, s.start_time, s.end_time, e.name as engineer_name
       FROM availability_slots s
       JOIN engineers e ON e.id = s.engineer_id
       WHERE s.is_available = 1 AND s.date >= '${targetDate}'
       ${params.engineerId ? `AND s.engineer_id = ${params.engineerId}` : ""}
       ORDER BY s.date ASC, s.start_time ASC
       LIMIT 1`
    )) as any;
    const slots = Array.isArray(slotRows) ? slotRows : (slotRows?.rows ?? []);
    if (slots.length === 0) {
      return { success: false, error: "No hay disponibilidad en las fechas solicitadas. Intenta con otra fecha." };
    }
    const slot = slots[0];
    const cancelToken = `cancel_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const meetingResult = await db.execute(sql.raw(
      `INSERT INTO meetings (slot_id, engineer_id, client_name, client_email, client_phone, company, notes, status, cancel_token, created_at, updated_at)
       VALUES (${slot.id}, ${slot.engineer_id}, '${params.clientName.replace(/'/g, "''")}', '${params.clientEmail.replace(/'/g, "''")}', '${(params.clientPhone ?? "").replace(/'/g, "''")}', '${(params.company ?? "").replace(/'/g, "''")}', '${(params.notes ?? "").replace(/'/g, "''")}', 'confirmed', '${cancelToken}', NOW(), NOW())`
    )) as any;
    const meetingId = meetingResult?.[0]?.insertId ?? meetingResult?.insertId;
    // Mark slot as unavailable
    await db.execute(sql.raw(`UPDATE availability_slots SET is_available = 0 WHERE id = ${slot.id}`));
    // Link to lead if provided
    if (params.leadId) {
      await db.execute(sql.raw(
        `UPDATE leads SET status = 'qualified', updated_at = NOW() WHERE id = ${params.leadId}`
      ));
    }
    // Send confirmation email (fire-and-forget)
    sendMeetingConfirmationEmailTool(params.clientEmail, params.clientName, slot, cancelToken).catch(() => {});
    return {
      success: true,
      data: {
        meetingId,
        date: slot.date,
        startTime: slot.start_time,
        endTime: slot.end_time,
        engineerName: slot.engineer_name,
        cancelToken,
        message: `Reunión agendada para el ${slot.date} a las ${slot.start_time} con ${slot.engineer_name}`,
      },
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

async function sendMeetingConfirmationEmailTool(
  clientEmail: string,
  clientName: string,
  slot: any,
  cancelToken: string
): Promise<void> {
  try {
    const resend = getResend();
    if (!resend) return;
    const cancelUrl = `${process.env.VITE_APP_URL ?? "https://iamettech-ssx5e88n.manus.space"}/cancelar-reunion?token=${cancelToken}`;
    await resend.emails.send({
      from: "IAMET Evolución Tecnológica <noreply@iamet.mx>",
      to: clientEmail,
      subject: `✅ Reunión confirmada — ${slot.date} ${slot.start_time}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
          <h1 style="color: #22d3ee; font-size: 24px; margin-bottom: 8px;">✅ Reunión Confirmada</h1>
          <p>Hola <strong>${clientName}</strong>,</p>
          <p>Tu reunión con el equipo de IAMET ha sido agendada exitosamente.</p>
          <div style="background: #1e293b; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #22d3ee;">
            <p><strong>📅 Fecha:</strong> ${slot.date}</p>
            <p><strong>🕐 Hora:</strong> ${slot.start_time} — ${slot.end_time}</p>
            <p><strong>👤 Ingeniero:</strong> ${slot.engineer_name}</p>
          </div>
          <p>Recibirás una invitación de calendario en tu correo.</p>
          <p style="margin-top: 24px; font-size: 12px; color: #64748b;">
            ¿Necesitas cancelar? <a href="${cancelUrl}" style="color: #22d3ee;">Haz clic aquí</a>
          </p>
        </div>
      `,
    });
  } catch { /* silencioso */ }
}

// ─── Herramienta 10: sendEmailTool ───────────────────────────────────────────

export async function sendEmailTool(
  to: string,
  subject: string,
  body: string,
  type: "followup" | "brochure" | "proposal" | "general" = "general"
): Promise<ToolResult> {
  try {
    const resend = getResend();
    if (!resend) return { success: false, error: "Email no configurado" };
    await resend.emails.send({
      from: "IAMET Evolución Tecnológica <noreply@iamet.mx>",
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; padding: 32px; border-radius: 12px;">
          <div style="border-bottom: 2px solid #22d3ee; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="color: #22d3ee; margin: 0;">IAMET Evolución Tecnológica</h2>
          </div>
          <div style="line-height: 1.6;">${body.replace(/\n/g, "<br>")}</div>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b;">
            <p>IAMET Evolución Tecnológica | alvaro.rivera@iamet.mx</p>
          </div>
        </div>
      `,
    });
    return { success: true, data: { message: `Email enviado a ${to}` } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 11: sendBrochure ────────────────────────────────────────────

export async function sendBrochure(
  leadId: number,
  email: string,
  vertical: string
): Promise<ToolResult> {
  const brochureLinks: Record<string, string> = {
    "infraestructura": "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/brochure-infraestructura.pdf",
    "seguridad": "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/brochure-seguridad.pdf",
    "control-acceso": "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/brochure-control-acceso.pdf",
    "rfid": "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/brochure-rfid.pdf",
    "software-ia": "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/brochure-software.pdf",
    "default": "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/brochure-iamet-general.pdf",
  };
  const brochureUrl = brochureLinks[vertical] ?? brochureLinks["default"];
  const verticalName = vertical.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return sendEmailTool(
    email,
    `📄 Información técnica: ${verticalName} — IAMET`,
    `Adjunto encontrarás el brochure técnico de nuestra solución de ${verticalName}.\n\nPuedes descargarlo aquí: ${brochureUrl}\n\nNuestro equipo está disponible para resolver cualquier duda técnica.\n\nSaludos,\nEquipo IAMET Evolución Tecnológica`,
    "brochure"
  );
}

// ─── Herramienta 12: generateProposal ────────────────────────────────────────

export async function generateProposal(
  leadId: number,
  items: Array<{ description: string; quantity: number; unitPrice: number }>
): Promise<ToolResult> {
  try {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const itemsText = items.map((i) =>
      `- ${i.description}: ${i.quantity} unidades × $${i.unitPrice.toLocaleString("es-MX")} MXN = $${(i.quantity * i.unitPrice).toLocaleString("es-MX")} MXN`
    ).join("\n");
    const proposal = {
      leadId,
      items,
      subtotal: total,
      iva: Math.round(total * 0.16),
      total: Math.round(total * 1.16),
      currency: "MXN",
      validDays: 30,
      generatedAt: new Date().toISOString(),
      disclaimer: "Esta es una estimación preliminar. La propuesta formal será generada por el ingeniero comercial asignado.",
      summary: `Propuesta estimada: ${items.length} conceptos | Subtotal: $${total.toLocaleString("es-MX")} MXN | Total con IVA: $${Math.round(total * 1.16).toLocaleString("es-MX")} MXN`,
    };
    // Save to DB as a note on the lead
    const db = await getDb();
    if (db) {
      const proposalNote = `[Propuesta preliminar generada: $${Math.round(total * 1.16).toLocaleString("es-MX")} MXN con IVA]`;
      await db.execute(sql.raw(
        `UPDATE leads SET notes = CONCAT(COALESCE(notes, ''), '\n${proposalNote.replace(/'/g, "''")}'), status = 'proposal', updated_at = NOW() WHERE id = ${leadId}`
      ));
    }
    return { success: true, data: proposal };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 13: reactivateLead ──────────────────────────────────────────

export async function reactivateLead(leadId: number, reason: string): Promise<ToolResult> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "DB no disponible" };
    // Get lead data
    const rows = await db.execute(sql.raw(
      `SELECT name, email, company FROM leads WHERE id = ${leadId} LIMIT 1`
    )) as any;
    const leads = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    if (leads.length === 0) return { success: false, error: "Lead no encontrado" };
    const lead = leads[0];
    // Generate personalized reactivation message
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres el SDR digital de IAMET. Genera un email de reactivación personalizado, cálido y profesional en español. Máximo 150 palabras. Solo el cuerpo del email, sin asunto.",
        },
        {
          role: "user",
          content: `Lead: ${lead.name} de ${lead.company || "empresa"}. Razón de reactivación: ${reason}`,
        },
      ],
    });
    const rawBody = response?.choices?.[0]?.message?.content;
    const emailBody = typeof rawBody === 'string' ? rawBody : '';
    // Send reactivation email
    await sendEmailTool(
      lead.email,
      `Retomando contacto — IAMET Evolución Tecnológica`,
      emailBody,
      "followup"
    );
    // Update lead status
    await db.execute(sql.raw(
      `UPDATE leads SET status = 'contacted', updated_at = NOW() WHERE id = ${leadId}`
    ));
    return { success: true, data: { message: `Lead ${leadId} reactivado. Email enviado a ${lead.email}` } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 14: createTask ───────────────────────────────────────────────

export async function createTask(
  leadId: number,
  title: string,
  dueDate: string,
  assignee: string
): Promise<ToolResult> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "DB no disponible" };
    const taskNote = `[Tarea: ${title} | Responsable: ${assignee} | Fecha: ${dueDate}]`;
    await db.execute(sql.raw(
      `UPDATE leads SET notes = CONCAT(COALESCE(notes, ''), '\n${taskNote.replace(/'/g, "''")}'), updated_at = NOW() WHERE id = ${leadId}`
    ));
    // Also add to timeline
    const { addTimelineEvent } = await import("./timeline");
    await addTimelineEvent(leadId, "status_changed", `Tarea creada: ${title}`,
      `Responsable: ${assignee} | Fecha límite: ${dueDate}`
    );
    return { success: true, data: { message: `Tarea creada: "${title}" asignada a ${assignee} para ${dueDate}` } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Herramienta 15: notifyOwnerTool ─────────────────────────────────────────

export async function notifyOwnerTool(title: string, content: string): Promise<ToolResult> {
  try {
    await notifyOwner({ title, content });
    return { success: true, data: { message: "Notificación enviada al owner" } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

// ─── Registro de herramientas disponibles ────────────────────────────────────

export const TOOL_REGISTRY: Record<string, (...args: any[]) => Promise<ToolResult>> = {
  searchKnowledge,
  searchProducts,
  recommendSolutions,
  createLead: createLeadTool,
  updateLead: updateLeadTool,
  calculateLeadScore: calculateLeadScoreTool,
  assignSalesperson,
  assignEngineer,
  bookMeeting: bookMeetingTool,
  sendEmail: sendEmailTool,
  sendBrochure,
  generateProposal,
  reactivateLead,
  createTask,
  notifyOwner: notifyOwnerTool,
};
