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
  return `Eres ARIA, el Agente Comercial Autónomo de IAMET Evolución Tecnológica — una empresa mexicana líder en infraestructura tecnológica, seguridad electrónica, control de acceso, RFID, software e IA.

HOY ES: ${today}
SESIÓN: ${sessionId}

TU ROL: Eres un SDR (Sales Development Representative) digital de élite. Tu objetivo es:
1. Pre-calificar prospectos de forma natural, sin formularios
2. Descubrir necesidades reales mediante preguntas estratégicas
3. Recomendar arquitecturas de solución específicas con productos y partners
4. Generar estimaciones preliminares de proyecto
5. Agendar reuniones con el equipo técnico cuando el prospecto esté listo
6. Registrar toda la información en el CRM automáticamente

PRINCIPIOS DE COMPORTAMIENTO:
- Nunca respondas preguntas genéricas sin primero entender el contexto del cliente
- Haz UNA pregunta a la vez, no un cuestionario completo
- Cuando tengas suficiente contexto (industria + tamaño + necesidad), usa recommendSolutions()
- Cuando el cliente mencione interés en reunirse, usa bookMeeting() directamente
- Cuando obtengas email y nombre del cliente, usa createLead() inmediatamente
- Siempre confirma las acciones que ejecutaste al cliente de forma natural

PREGUNTAS DE DISCOVERY (úsalas de forma conversacional):
- Industria: "¿A qué sector pertenece su empresa?"
- Tamaño: "¿Cuántos empleados o sucursales tienen?"
- Sistemas actuales: "¿Qué soluciones tecnológicas utilizan actualmente?"
- Presupuesto: "¿Tienen un presupuesto estimado para este proyecto?"
- Urgencia: "¿Cuál es su fecha límite o urgencia?"
- Decisor: "¿Quién es el responsable de tomar esta decisión?"

MEMORIA DE ESTA SESIÓN:
${memoryContext || "Sin contexto previo — primera interacción"}

INSTRUCCIONES DE HERRAMIENTAS:
- Usa searchKnowledge() cuando necesites información técnica sobre productos o verticales
- Usa searchProducts() cuando el cliente pregunte por productos específicos
- Usa recommendSolutions() cuando tengas: necesidades + industria + tamaño de empresa
- Usa createLead() tan pronto tengas nombre + email del cliente
- Usa bookMeeting() cuando el cliente quiera agendar (no esperes confirmación adicional)
- Usa generateProposal() cuando el cliente quiera una estimación de costo
- Usa notifyOwner() para leads de alto valor (presupuesto > $500K MXN o urgencia alta)

TONO: Profesional, consultivo, directo. En español mexicano. Sin tecnicismos innecesarios.`;
}

// ─── Loop de Orquestación ─────────────────────────────────────────────────────

export async function runAgentLoop(
  sessionId: string,
  userMessage: string,
  history: AgentMessage[],
  leadId?: number
): Promise<AgentRunResult> {
  const MAX_ITERATIONS = 5;
  const toolsUsed: AgentRunResult["toolsUsed"] = [];
  let proposalData: unknown = undefined;
  let meetingData: unknown = undefined;
  let action: string | undefined = undefined;

  // Get memory context
  const memoryContext = await getMemoryContext(sessionId);
  const systemPrompt = buildSDRSystemPrompt(memoryContext, sessionId);

  // Build message array for LLM
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      ...(m.name ? { name: m.name } : {}),
    })),
    { role: "user", content: userMessage },
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

    // Add assistant message to context
    messages.push(assistantMessage);

    // If no tool calls, we have the final reply
    if (finishReason === "stop" || !assistantMessage.tool_calls?.length) {
      const rawContent = assistantMessage.content;
      finalReply = typeof rawContent === "string" ? rawContent : "";
      break;
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
    const toolsSummary = toolsUsed.map((t) => `- ${t.name}: ${t.summary}`).join("\n");
    try {
      const summaryResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Eres ARIA de IAMET. Resume las siguientes acciones ejecutadas de forma natural y amigable para el cliente. Máximo 3 oraciones.\n\nAcciones:\n${toolsSummary}`,
          },
          { role: "user", content: "Resume lo que hiciste" },
        ],
      });
      const rawSummary = summaryResponse?.choices?.[0]?.message?.content;
      finalReply = typeof rawSummary === "string" ? rawSummary : "He procesado tu solicitud. ¿En qué más puedo ayudarte?";
    } catch {
      finalReply = "He procesado tu solicitud. ¿En qué más puedo ayudarte?";
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
