import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Bot, Zap, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight,
  MessageSquare, Users, Calendar, TrendingUp
} from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}

function ToolCallRow({ trace }: {
  trace: {
    id: number;
    toolName: string;
    durationMs: number;
    success: boolean;
    error?: string | null;
    iterationNum: number;
    params?: unknown;
    result?: unknown;
    createdAt: string | Date;
  }
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-[#0d1b3e] rounded cursor-pointer transition-colors">
          {open ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
          <span className="w-4 h-4 flex items-center justify-center">
            {trace.success
              ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              : <XCircle className="w-3.5 h-3.5 text-red-400" />}
          </span>
          <span className="text-xs font-mono text-[#00d4ff] flex-1">{trace.toolName}</span>
          <span className="text-xs text-slate-500">iter #{trace.iterationNum}</span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />{trace.durationMs}ms
          </span>
          <span className="text-xs text-slate-600">
            {new Date(trace.createdAt).toLocaleTimeString("es-MX")}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-10 mb-2 grid grid-cols-2 gap-2">
          <div className="bg-[#0a1628] rounded p-2">
            <p className="text-xs text-slate-500 mb-1">Parámetros</p>
            <pre className="text-xs text-slate-300 overflow-auto max-h-24">
              {JSON.stringify(trace.params, null, 2)}
            </pre>
          </div>
          <div className="bg-[#0a1628] rounded p-2">
            <p className="text-xs text-slate-500 mb-1">{trace.success ? "Resultado" : "Error"}</p>
            <pre className={`text-xs overflow-auto max-h-24 ${trace.success ? "text-slate-300" : "text-red-400"}`}>
              {trace.success
                ? JSON.stringify(trace.result, null, 2)
                : trace.error}
            </pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ConversationRow({ conv }: {
  conv: {
    id: number;
    sessionId: string;
    leadId?: number | null;
    toolCallCount: number;
    successCount: number;
    failCount: number;
    totalDurationMs: number;
    iterations: number;
    createdAt: string | Date;
  }
}) {
  const [open, setOpen] = useState(false);
  const detail = trpc.agentObs.getConversationDetail.useQuery(
    { conversationId: conv.id },
    { enabled: open }
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#0d1b3e] cursor-pointer transition-colors border-b border-[#1e3a6e]">
          {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          <MessageSquare className="w-4 h-4 text-[#00d4ff]" />
          <span className="text-xs font-mono text-slate-400 flex-1 truncate">{conv.sessionId}</span>
          {conv.leadId && (
            <Badge variant="outline" className="text-xs border-[#1e3a6e] text-slate-400">
              Lead #{conv.leadId}
            </Badge>
          )}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#00d4ff]" />{conv.toolCallCount} tools
            </span>
            {conv.failCount > 0 && (
              <span className="text-red-400 flex items-center gap-1">
                <XCircle className="w-3 h-3" />{conv.failCount} errores
              </span>
            )}
            <span className="text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />{conv.totalDurationMs}ms
            </span>
            <span className="text-slate-600">
              {new Date(conv.createdAt).toLocaleString("es-MX")}
            </span>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-[#0a1628] mx-4 mb-2 rounded-lg overflow-hidden">
          {detail.isLoading && (
            <p className="text-xs text-slate-500 p-3">Cargando trazas...</p>
          )}
          {detail.data?.traces?.map((trace: { id: number; toolName: string; durationMs: number; success: boolean; error?: string | null; iterationNum: number; params?: unknown; result?: unknown; createdAt: string | Date }) => (
            <ToolCallRow key={trace.id} trace={trace} />
          ))}
          {detail.data?.traces?.length === 0 && (
            <p className="text-xs text-slate-500 p-3">Sin trazas de herramientas en esta conversación.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function AdminAgent() {
  const [page] = useState(0);
  const stats = trpc.agentObs.getStats.useQuery();
  const conversations = trpc.agentObs.getConversations.useQuery({ limit: 50, offset: page * 50 });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#00d4ff] flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Observabilidad del Agente</h1>
          <p className="text-sm text-slate-400">Trazas de tool calls, latencia y errores en tiempo real</p>
        </div>
      </div>

      {/* KPIs */}
      {stats.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Conversaciones", value: fmt(Number(stats.data.stats?.totalConversations ?? 0)), icon: MessageSquare },
            { label: "Tool Calls", value: fmt(Number(stats.data.stats?.totalToolCalls ?? 0)), icon: Zap },
            { label: "Exitosas", value: fmt(Number(stats.data.stats?.successfulCalls ?? 0)), icon: Users },
            { label: "Latencia Prom.", value: `${Math.round(Number(stats.data.stats?.avgDurationMs ?? 0))}ms`, icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="bg-[#0d1b3e] border-[#1e3a6e]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1a2744] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[#00d4ff]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-lg font-bold text-white">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tasa de éxito */}
      {stats.data && (() => {
        const total = Number(stats.data.stats?.totalToolCalls ?? 0);
        const successful = Number(stats.data.stats?.successfulCalls ?? 0);
        const failed = total - successful;
        const rate = total > 0 ? Math.round((successful / total) * 100) : 0;
        return (
          <Card className="bg-[#111827] border-[#1e3a6e]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Tasa de éxito de herramientas</span>
                <span className="text-sm font-bold text-emerald-400">{rate}%</span>
              </div>
              <div className="h-2 bg-[#0d1b3e] rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded transition-all duration-700"
                  style={{ width: `${rate}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{fmt(successful)} exitosas</span>
                <span>{fmt(failed)} fallidas</span>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Lista de conversaciones */}
      <Card className="bg-[#111827] border-[#1e3a6e]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Conversaciones del Agente</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="border-[#1e3a6e] text-slate-400 hover:text-white"
              onClick={() => conversations.refetch()}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {conversations.isLoading && (
            <p className="text-slate-500 text-sm p-4">Cargando conversaciones...</p>
          )}
          {conversations.data?.conversations?.map((conv: {
            id: number; sessionId: string; leadId?: number | null;
            toolCallCount: number; successCount: number; failCount: number;
            totalDurationMs: number; iterations: number; createdAt: string | Date;
          }) => (
            <ConversationRow key={conv.id} conv={conv} />
          ))}
          {conversations.data?.conversations?.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin conversaciones del agente aún.</p>
              <p className="text-xs mt-1">Las trazas aparecerán cuando el agente ejecute herramientas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
