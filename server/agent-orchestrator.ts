/**
 * agent-orchestrator.ts — Orquestador del Agente Comercial Autónomo IAMET
 *
 * Arquitectura de 4 capas:
 * 1. Razonamiento: el LLM decide qué acción ejecutar
 * 2. Herramientas: funciones independientes (agent-tools.ts)
 * 3. Orquestador: este archivo — decide el orden y ejecuta el loop
 * 4. Memoria: contexto acumulativo de la sesión (agent-memory.ts)
 */

import { invokeLLM } from "./_core/llm";
import { TOOL_REGISTRY } from "./agent-tools";
import { getMemoryContext, updateMemoryFromConversation } from "./agent-memory";
import { saveTrace } from "./agent-traces";
import { buildSpecialistPrompt } from "./specialists";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AgentMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface AgentRunResult {
  reply: string;
  toolsUsed: Array<{
    name: string;
    success: boolean;
    summary: string;
  }>;
  action?: string;
  proposalData?: unknown;
  meetingData?: unknown;
}

// ─── Definición de herramientas para el LLM (OpenAI Tool Schema) ──────────────

const AGENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "searchKnowledge",
      description: "Busca información en la base de conocimiento de IAMET: productos, verticales, partners, procesos comerciales, preguntas frecuentes.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Consulta a buscar en la base de conocimiento" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "searchProducts",
      description: "Busca productos en el catálogo de IAMET por nombre, descripción o categoría.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Término de búsqueda" },
          category: { type: "string", description: "Categoría opcional: seguridad, redes, computo, cableado, software, energia, servicios" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "recommendSolutions",
      description: "Genera una arquitectura de solución completa con productos, partners, presupuesto estimado y timeline basada en las necesidades del cliente.",
      parameters: {
        type: "object",
        properties: {
          needs: { type: "string", description: "Necesidades y requerimientos del cliente" },
          industry: { type: "string", description: "Industria del cliente" },
          companySize: { type: "string", description: "Tamaño de la empresa (empleados, sucursales)" },
        },
        required: ["needs", "industry", "companySize"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createLead",
      description: "Crea un nuevo lead en el CRM cuando el cliente ha proporcionado sus datos de contacto.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre del contacto" },
          email: { type: "string", description: "Email del contacto" },
          company: { type: "string", description: "Nombre de la empresa" },
          phone: { type: "string", description: "Teléfono de contacto" },
          industry: { type: "string", description: "Industria de la empresa" },
          companySize: { type: "string", description: "Tamaño de la empresa" },
          interest: { type: "string", description: "Área de interés principal" },
          budget: { type: "string", description: "Presupuesto estimado" },
          urgency: { type: "string", description: "Urgencia del proyecto: alta, media, baja" },
          sessionId: { type: "string", description: "ID de la sesión actual" },
        },
        required: ["name", "email"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateLead",
      description: "Actualiza información de un lead existente en el CRM.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "number", description: "ID del lead a actualizar" },
          industry: { type: "string" },
          companySize: { type: "string" },
          budget: { type: "string" },
          urgency: { type: "string" },
          notes: { type: "string" },
          status: { type: "string", description: "new, contacted, qualified, proposal, won, lost" },
        },
        required: ["leadId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "calculateLeadScore",
      description: "Calcula o recalcula el score de calificación de un lead (0-100).",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "number", description: "ID del lead" },
        },
        required: ["leadId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "assignSalesperson",
      description: "Asigna el vendedor más adecuado para un lead según su vertical e industria.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "number", description: "ID del lead" },
          vertical: { type: "string", description: "Vertical del proyecto: infraestructura, seguridad, control-acceso, rfid, software-ia, servicios-administrados" },
          industry: { type: "string", description: "Industria del cliente" },
        },
        required: ["leadId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "assignEngineer",
      description: "Asigna el ingeniero especialista más adecuado para un lead.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "number", description: "ID del lead" },
          vertical: { type: "string", description: "Vertical del proyecto" },
          specialty: { type: "string", description: "Especialidad requerida" },
        },
        required: ["leadId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "bookMeeting",
      description: "Agenda una reunión con un ingeniero de IAMET. Usar cuando el cliente quiere agendar, ver disponibilidad o programar una cita.",
      parameters: {
        type: "object",
        properties: {
          clientName: { type: "string", description: "Nombre del cliente" },
          clientEmail: { type: "string", description: "Email del cliente" },
          clientPhone: { type: "string", description: "Teléfono del cliente" },
          company: { type: "string", description: "Empresa del cliente" },
          leadId: { type: "number", description: "ID del lead si ya existe" },
          engineerId: { type: "number", description: "ID del ingeniero preferido (opcional)" },
          requestedDate: { type: "string", description: "Fecha preferida en formato YYYY-MM-DD" },
          notes: { type: "string", description: "Notas adicionales para la reunión" },
          sessionId: { type: "string", description: "ID de la sesión actual" },
        },
        required: ["clientName", "clientEmail"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "sendEmail",
      description: "Envía un email al cliente con información, seguimiento o materiales.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Email del destinatario" },
          subject: { type: "string", description: "Asunto del email" },
          body: { type: "string", description: "Cuerpo del email en texto plano" },
          type: { type: "string", description: "Tipo: followup, brochure, proposal, general" },
        },
        required: ["to", "subject", "body"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "sendBrochure",
      description: "Envía el brochure técnico de una vertical al cliente por email.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "number", description: "ID del lead" },
          email: { type: "string", description: "Email del destinatario" },
          vertical: { type: "string", description: "Vertical: infraestructura, seguridad, control-acceso, rfid, software-ia" },
        },
        required: ["leadId", "email", "vertical"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "generateProposal",
      description: "Genera una estimación preliminar de proyecto con conceptos y montos en MXN. No es una cotización oficial.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "number", description: "ID del lead" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unitPrice: { type: "number" },
              },
              required: ["description", "quantity", "unitPrice"],
              additionalProperties: false,
            },
            description: "Lista de conceptos con cantidad y precio unitario en MXN",
          },
        },
        required: ["leadId", "items"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "reactivateLead",
      description: "Reactiva un lead frío con un mensaje personalizado generado por IA.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "number", description: "ID del lead a reactivar" },
          reason: { type: "string", description: "Razón o contexto para la reactivación" },
        },
        required: ["leadId", "reason"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createTask",
      description: "Crea una tarea de seguimiento para el equipo comercial.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "number", description: "ID del lead relacionado" },
          title: { type: "string", description: "Título de la tarea" },
          dueDate: { type: "string", description: "Fecha límite en formato YYYY-MM-DD" },
          assignee: { type: "string", description: "Nombre del responsable" },
        },
        required: ["leadId", "title", "dueDate", "assignee"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "notifyOwner",
      description: "Envía una notificación al dueño/admin de IAMET sobre una acción comercial importante.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título de la notificación" },
          content: { type: "string", description: "Contenido detallado de la notificación" },
        },
        required: ["title", "content"],
        additionalProperties: false,
      },
    },
  },
];

// ─── System Prompt del SDR ────────────────────────────────────────────────────

function buildSDRSystemPrompt(memoryContext: string, sessionId: string): string {
  const today = new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return `Eres ARIA, consultora técnica de IAMET Evolución Tecnológica. IAMET es una empresa mexicana integradora de soluciones tecnológicas: Data Centers, redes, CCTV, control de acceso, RFID/Zebra, software, IA, infraestructura y servicios administrados.

HOY: ${today} | SESIÓN: ${sessionId}

## TU OBJETIVO PRINCIPAL
Dar valor técnico INMEDIATO al usuario. Cada respuesta debe incluir información útil, no solo preguntas.

## FLUJO DE CONVERSACIÓN

**Turno 1 (primer mensaje del usuario):**
- Reconoce la necesidad específica
- Da una respuesta técnica preliminar con 2-3 puntos concretos (arquitectura, productos, consideraciones)
- Haz UNA sola pregunta para afinar la solución

**Turno 2 (el usuario responde):**
- Integra la información recibida
- Expande la propuesta técnica con más detalle
- Ofrece: (a) estimación de costo preliminar, o (b) agendar cita con especialista

**Turno 3 en adelante:**
- Responde directamente lo que se pregunta
- Si el usuario dice "sí", "ok", "adelante" o confirma algo → ejecuta la acción correspondiente (genera propuesta, agenda cita, etc.)
- NUNCA respondas "He procesado tu solicitud. ¿En qué más puedo ayudarte?" — eso es una respuesta vacía

## REGLAS ESTRICTAS
❌ NO hagas más de 1 pregunta por turno
❌ NO repitas preguntas ya respondidas
❌ NO uses frases genéricas como "He procesado", "Entendido", "Perfecto" sin agregar contenido técnico real
❌ NO esperes tener todos los datos para dar valor — da valor con lo que tienes
✅ SÍ menciona productos reales: Panduit, Cisco, Hikvision, Zebra, HID Global, Fortinet, Eaton
✅ SÍ da estimaciones de rango ("entre $X y $Y MXN") cuando tengas contexto suficiente
✅ SÍ usa herramientas: searchKnowledge(), generateProposal(), bookMeeting(), createLead()

## EJEMPLOS DE RESPUESTAS CORRECTAS

Usuario: "Necesito diseñar un Data Center"
ARIA: "Para un Data Center empresarial, IAMET trabaja con arquitectura Panduit FlexFusion y certificación TIA-942. Los componentes clave son: (1) Infraestructura de cableado Cat6A/Fibra, (2) Cooling de precisión, (3) PDUs inteligentes Eaton, (4) Sistema de monitoreo DCIM. ¿Cuántos racks o kW de capacidad necesitas?"

Usuario: "dos mil empleados"
ARIA: "Con 2,000 empleados, el Data Center debería dimensionarse para al menos 20-40 racks con redundancia N+1. Estimo un proyecto entre $2.5M y $6M MXN dependiendo del nivel Tier (II o III). ¿Quieres que genere una estimación preliminar detallada o prefieres agendar una sesión con nuestro arquitecto de Data Centers?"

## MEMORIA DE ESTA SESIÓN
${memoryContext || "Primera interacción"}

## HERRAMIENTAS DISPONIBLES
- searchKnowledge(query): busca info técnica de IAMET
- searchProducts(query, category): busca productos del catálogo
- recommendSolutions(industry, needs, size): recomienda solución completa
- createLead(name, email, company, ...): registra el prospecto en CRM
- generateProposal(leadId, items): genera estimación de costo en MXN
- bookMeeting(clientName, clientEmail, ...): agenda cita con ingeniero
- notifyOwner(title, content): notifica al equipo IAMET

TONO: Consultivo, directo, en español mexicano. Como un ingeniero senior que también sabe vender.`;
}

// ─── Loop de Orquestación ─────────────────────────────────────────────────────

export async function runAgentLoop(
  sessionId: string,
  userMessage: string,
  history: AgentMessage[],
  leadId?: number,
  specialistId?: string
): Promise<AgentRunResult> {
  const MAX_ITERATIONS = 5;
  const toolsUsed: AgentRunResult["toolsUsed"] = [];
  let proposalData: unknown = undefined;
  let meetingData: unknown = undefined;
  let action: string | undefined = undefined;

  // Get memory context
  const memoryContext = await getMemoryContext(sessionId);

  // Use specialist-specific prompt when a specialistId is provided
  const systemPrompt = specialistId
    ? buildSpecialistPrompt(specialistId) + `\n\nMEMORIA DE ESTA SESIÓN:\n${memoryContext || "Sin contexto previo — primera interacción"}\n\nHOY ES: ${new Date().toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
    : buildSDRSystemPrompt(memoryContext, sessionId);

  // Build message array for LLM.
  // IMPORTANT: history already contains the current user turn (saved before this call),
  // so we use history directly WITHOUT appending userMessage again to avoid duplication.
  // Use up to 20 messages to maintain longer conversation context.
  const historySlice = history.slice(-20);

  // Filter out any tool-role messages from DB history (they are not stored, but guard anyway)
  const cleanHistory = historySlice.filter((m) => m.role === "user" || m.role === "assistant");

  // If the last message in history is the current user turn, don't add it again
  const lastMsg = cleanHistory[cleanHistory.length - 1];
  const alreadyIncluded = lastMsg?.role === "user" && lastMsg?.content?.trim() === userMessage.trim();

  console.log(`[Orchestrator] session=${sessionId} historyLen=${cleanHistory.length} alreadyIncluded=${alreadyIncluded} lastRole=${lastMsg?.role} userMsg="${userMessage.slice(0, 40)}"`);

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...cleanHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    ...(alreadyIncluded ? [] : [{ role: "user", content: userMessage }]),
  ];

  let iterations = 0;
  let finalReply = "";

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    let response: any;
    try {
      response = await invokeLLM({
        messages,
        tools: AGENT_TOOLS,
        tool_choice: "auto",
      } as any);
    } catch (e) {
      console.error(`[Orchestrator] LLM error iteration=${iterations}:`, e);
      break;
    }

    const choice = response?.choices?.[0];
    if (!choice) break;

    const assistantMessage = choice.message;
    const finishReason = choice.finish_reason;
    const rawContent = assistantMessage.content;
    const hasToolCalls = !!(assistantMessage.tool_calls?.length);

    console.log(`[Orchestrator] iter=${iterations} finish=${finishReason} hasTools=${hasToolCalls} contentType=${typeof rawContent} contentLen=${typeof rawContent === 'string' ? rawContent.length : Array.isArray(rawContent) ? rawContent.length : 0}`);

    // Add assistant message to context
    messages.push(assistantMessage);

    // If no tool calls, we have the final reply
    if (!hasToolCalls) {
      if (typeof rawContent === "string" && rawContent.trim()) {
        finalReply = rawContent;
      } else if (Array.isArray(rawContent)) {
        // Handle array content parts (text blocks)
        finalReply = rawContent
          .filter((p: any) => p?.type === "text" && typeof p?.text === "string")
          .map((p: any) => p.text)
          .join("\n") || "";
      }
      // If content is empty/null but finish_reason is stop, retry without tools
      if (!finalReply && finishReason === "stop") {
        console.warn(`[Orchestrator] Empty content on stop, retrying without tools session=${sessionId}`);
        try {
          const retryResp = await invokeLLM({ messages: messages.slice(0, -1) });
          const retryContent = retryResp?.choices?.[0]?.message?.content;
          if (typeof retryContent === "string" && retryContent.trim()) {
            finalReply = retryContent;
          } else if (Array.isArray(retryContent)) {
            finalReply = retryContent.filter((p: any) => p?.type === "text").map((p: any) => p.text).join("\n");
          }
        } catch (retryErr) {
          console.error(`[Orchestrator] Retry failed:`, retryErr);
        }
      }
      if (finalReply) break;
    }

    // Execute tool calls
    const toolCalls: ToolCall[] = assistantMessage.tool_calls ?? [];
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const toolFn = TOOL_REGISTRY[toolName];

      if (!toolFn) {
        console.warn(`[Orchestrator] Unknown tool: ${toolName}`);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolName,
          content: JSON.stringify({ success: false, error: `Herramienta ${toolName} no encontrada` }),
        });
        continue;
      }

      let toolArgs: Record<string, unknown> = {};
      try {
        toolArgs = JSON.parse(toolCall.function.arguments);
      } catch {
        toolArgs = {};
      }

      // Inject sessionId into tools that accept it
      if ("sessionId" in (toolArgs as any) === false && toolName === "createLead") {
        toolArgs.sessionId = sessionId;
      }

      console.log(`[Orchestrator] Executing tool: ${toolName}`, JSON.stringify(toolArgs).slice(0, 200));

      let toolResult: any;
      const traceStart = Date.now();
      try {
        toolResult = await toolFn(...Object.values(toolArgs));
      } catch (e) {
        toolResult = { success: false, error: String(e) };
      }
      const traceDuration = Date.now() - traceStart;
      // Fire-and-forget trace save
      saveTrace({
        sessionId,
        iterationNum: iterations,
        toolName,
        params: toolArgs,
        result: toolResult,
        durationMs: traceDuration,
        success: toolResult.success !== false,
        error: toolResult.error,
      }).catch(() => {});

      // Track tool usage
      toolsUsed.push({
        name: toolName,
        success: toolResult.success,
        summary: toolResult.success
          ? (toolResult.data as any)?.message ?? `${toolName} ejecutado`
          : `Error: ${toolResult.error}`,
      });

      // Capture special data for UI
      if (toolName === "generateProposal" && toolResult.success) {
        proposalData = toolResult.data;
        action = "show_proposal";
      }
      if (toolName === "bookMeeting" && toolResult.success) {
        meetingData = toolResult.data;
        action = "schedule_meeting";
      }

      // Add tool result to messages
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        name: toolName,
        content: JSON.stringify(toolResult),
      });
    }
  }

  // If we exhausted iterations without a final reply, generate one
  if (!finalReply) {
    if (toolsUsed.length > 0) {
      // Only summarize if tools were actually used
      const toolsSummary = toolsUsed.map((t) => `- ${t.name}: ${t.summary}`).join("\n");
      try {
        const summaryResponse = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(1), // include full conversation context
            {
              role: "user",
              content: `Basado en la conversación anterior y las acciones ejecutadas, responde al usuario de forma natural y coherente con el contexto.\n\nAcciones ejecutadas:\n${toolsSummary}`,
            },
          ],
        });
        const rawSummary = summaryResponse?.choices?.[0]?.message?.content;
        finalReply = typeof rawSummary === "string" ? rawSummary : "He procesado tu solicitud. ¿En qué más puedo ayudarte?";
      } catch {
        finalReply = "He procesado tu solicitud. ¿En qué más puedo ayudarte?";
      }
    } else {
      // No tools used and no reply — retry with the full context to get a proper response
      try {
        const retryResponse = await invokeLLM({
          messages,
        });
        const rawRetry = retryResponse?.choices?.[0]?.message?.content;
        if (typeof rawRetry === "string") {
          finalReply = rawRetry;
        } else if (Array.isArray(rawRetry)) {
          finalReply = rawRetry
            .filter((p: any) => p?.type === "text")
            .map((p: any) => p.text)
            .join("\n") || "";
        }
        if (!finalReply) finalReply = "Entendido. ¿En qué más puedo ayudarte?";
      } catch {
        finalReply = "Entendido. ¿En qué más puedo ayudarte?";
      }
    }
  }

  // Update memory from conversation (fire-and-forget)
  updateMemoryFromConversation(sessionId, userMessage, finalReply, toolsUsed).catch(() => {});

  return {
    reply: finalReply,
    toolsUsed,
    action,
    proposalData,
    meetingData,
  };
}
