import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, DollarSign, Users, Target, Bot, BarChart3,
  ArrowUp, ArrowDown, Minus, Calendar, Zap, Award
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString("es-MX", { maximumFractionDigits: 0 });
}
function fmtMXN(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${fmt(n)}`;
}
function pct(n: number) {
  return `${Math.round(n)}%`;
}

// ─── Componentes de tarjeta ───────────────────────────────────────────────────

function KPICard({ title, value, sub, icon: Icon, trend }: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; trend?: "up" | "down" | "flat";
}) {
  return (
    <Card className="bg-[#0d1b3e] border-[#1e3a6e]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#1a2744] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[#00d4ff]" />
            </div>
            {trend && (
              <span className={`text-xs flex items-center gap-0.5 ${
                trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-400"
              }`}>
                {trend === "up" ? <ArrowUp className="w-3 h-3" /> :
                 trend === "down" ? <ArrowDown className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sección Forecast ─────────────────────────────────────────────────────────

function ForecastSection() {
  const { data, isLoading } = trpc.intelligence.getForecast.useQuery();
  if (isLoading) return <div className="text-slate-400 text-sm">Cargando forecast...</div>;
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KPICard title="Pipeline Total" value={fmtMXN(data.pipelineTotal)} sub="Oportunidades activas" icon={DollarSign} />
      <KPICard title="Pipeline Ponderado" value={fmtMXN(data.pipelineWeighted)} sub="Por probabilidad de cierre" icon={Target} />
      <KPICard title="Ganado este mes" value={fmtMXN(data.wonThisMonth)} sub="Proyectos cerrados" icon={Award} trend="up" />
      <KPICard title="Ticket Promedio" value={fmtMXN(data.avgDealSize)} sub="Por proyecto" icon={TrendingUp} />
    </div>
  );
}

// ─── Sección Embudo ───────────────────────────────────────────────────────────

function FunnelSection() {
  const { data, isLoading } = trpc.intelligence.getFunnel.useQuery();
  if (isLoading) return <div className="text-slate-400 text-sm">Cargando embudo...</div>;
  if (!data) return null;
  const maxCount = Math.max(...data.map((s: { count: number }) => s.count), 1);
  return (
    <div className="space-y-3">
      {data.map((stage: { stage: string; label: string; count: number; conversionRate: number }) => (
        <div key={stage.stage} className="flex items-center gap-4">
          <div className="w-32 text-xs text-slate-400 text-right shrink-0">{stage.label}</div>
          <div className="flex-1 relative h-8 bg-[#0d1b3e] rounded overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#0066cc] to-[#00d4ff] rounded transition-all duration-700"
              style={{ width: `${(stage.count / maxCount) * 100}%` }}
            />
            <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
              {fmt(stage.count)}
            </span>
          </div>
          <div className="w-16 text-xs text-slate-400 text-right shrink-0">
            {pct(stage.conversionRate)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sección ROI por Canal ────────────────────────────────────────────────────

function ChannelROISection() {
  const { data, isLoading } = trpc.intelligence.getChannelROI.useQuery();
  if (isLoading) return <div className="text-slate-400 text-sm">Cargando ROI...</div>;
  if (!data || data.length === 0) return (
    <div className="text-slate-500 text-sm text-center py-8">
      Sin datos de canales aún. Los datos aparecerán cuando haya leads con UTM.
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-400 border-b border-[#1e3a6e]">
            <th className="text-left py-2 pr-4">Canal</th>
            <th className="text-right py-2 pr-4">Leads</th>
            <th className="text-right py-2 pr-4">Reuniones</th>
            <th className="text-right py-2 pr-4">Ganados</th>
            <th className="text-right py-2 pr-4">Ingresos</th>
            <th className="text-right py-2">Conv.</th>
          </tr>
        </thead>
        <tbody>
          {data.map((ch: { channel: string; leads: number; meetings: number; opportunities: number; won: number; revenue: number; spend: number; costPerLead: number; costPerMeeting: number; roi: number }) => (
            <tr key={ch.channel} className="border-b border-[#0d1b3e] hover:bg-[#0d1b3e]">
              <td className="py-2 pr-4 text-white font-medium capitalize">{ch.channel || "Directo"}</td>
              <td className="py-2 pr-4 text-right text-slate-300">{ch.leads}</td>
              <td className="py-2 pr-4 text-right text-slate-300">{ch.meetings}</td>
              <td className="py-2 pr-4 text-right text-emerald-400">{ch.won}</td>
              <td className="py-2 pr-4 text-right text-[#00d4ff]">{fmtMXN(ch.revenue)}</td>
              <td className="py-2 text-right">
                <Badge variant="outline" className="text-xs border-[#1e3a6e] text-slate-300">
                  ROI {ch.roi}%
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sección Verticales ───────────────────────────────────────────────────────

function VerticalsSection() {
  const { data, isLoading } = trpc.intelligence.getVerticals.useQuery();
  if (isLoading) return <div className="text-slate-400 text-sm">Cargando verticales...</div>;
  if (!data || data.length === 0) return (
    <div className="text-slate-500 text-sm text-center py-8">Sin datos de verticales aún.</div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {data.map((v: { vertical: string; leads: number; qualified: number; meetings: number; won: number; conversionRate: number; avgScore: number; pipeline: number }) => (
        <div key={v.vertical} className="bg-[#0d1b3e] rounded-lg p-4 border border-[#1e3a6e]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white capitalize">{v.vertical}</span>
            <Badge className="bg-[#0066cc] text-white text-xs">{v.leads} leads</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
            <div><span className="block text-white font-medium">{fmtMXN(v.pipeline)}</span>Pipeline</div>
            <div><span className="block text-white font-medium">{pct(v.conversionRate)}</span>Conversión</div>
            <div><span className="block text-white font-medium">{v.won}</span>Ganados</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sección Especialistas IA ─────────────────────────────────────────────────

function AgentStatsSection() {
  const { data, isLoading } = trpc.intelligence.getAgentStats.useQuery();
  if (isLoading) return <div className="text-slate-400 text-sm">Cargando estadísticas del agente...</div>;
  if (!data) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Conversaciones" value={fmt(data.totalConversations)} icon={Bot} />
        <KPICard title="Leads Generados" value={fmt(data.leadsGenerated)} icon={Users} trend="up" />
        <KPICard title="Reuniones Agendadas" value={fmt(data.meetingsBooked)} icon={Calendar} />
        <KPICard title="Tool Calls" value={fmt(data.toolCallsTotal)} icon={Zap} />
      </div>
      {data.topTools && data.topTools.length > 0 && (
        <div>
          <p className="text-xs text-slate-400 mb-2">Herramientas más usadas</p>
          <div className="space-y-2">
            {data.topTools.map((t: { tool: string; count: number }) => (
              <div key={t.tool} className="flex items-center gap-3">
                <span className="text-xs text-slate-300 w-40 truncate">{t.tool}</span>
                <div className="flex-1 h-2 bg-[#0d1b3e] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#00d4ff] rounded"
                    style={{ width: `${Math.min(100, (t.count / (data.toolCallsTotal || 1)) * 100 * 5)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-12 text-right">{t.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sección Tendencias ───────────────────────────────────────────────────────

function TrendsSection() {
  const { data, isLoading } = trpc.intelligence.getTrends.useQuery();
  if (isLoading) return <div className="text-slate-400 text-sm">Cargando tendencias...</div>;
  if (!data || data.length === 0) return (
    <div className="text-slate-500 text-sm text-center py-8">Sin datos de tendencias aún.</div>
  );
  const maxLeads = Math.max(...data.map((d: { leads: number }) => d.leads), 1);
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">Leads por día (últimos 30 días)</p>
      <div className="flex items-end gap-1 h-24">
        {data.map((d: { date: string; leads: number; meetings: number }) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-[#0066cc] rounded-t transition-all duration-500 hover:bg-[#00d4ff]"
              style={{ height: `${(d.leads / maxLeads) * 80}px`, minHeight: d.leads > 0 ? "4px" : "0" }}
              title={`${d.date}: ${d.leads} leads, ${d.meetings} reuniones`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminIntelligence() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0066cc] to-[#00d4ff] flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Centro de Inteligencia Comercial</h1>
          <p className="text-sm text-slate-400">Revenue Operations — Datos en tiempo real</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList className="bg-[#0d1b3e] border border-[#1e3a6e]">
          <TabsTrigger value="forecast" className="data-[state=active]:bg-[#0066cc] data-[state=active]:text-white text-slate-400">
            Forecast
          </TabsTrigger>
          <TabsTrigger value="funnel" className="data-[state=active]:bg-[#0066cc] data-[state=active]:text-white text-slate-400">
            Embudo
          </TabsTrigger>
          <TabsTrigger value="channels" className="data-[state=active]:bg-[#0066cc] data-[state=active]:text-white text-slate-400">
            ROI Canales
          </TabsTrigger>
          <TabsTrigger value="verticals" className="data-[state=active]:bg-[#0066cc] data-[state=active]:text-white text-slate-400">
            Verticales
          </TabsTrigger>
          <TabsTrigger value="agent" className="data-[state=active]:bg-[#0066cc] data-[state=active]:text-white text-slate-400">
            Agente IA
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-[#0066cc] data-[state=active]:text-white text-slate-400">
            Tendencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forecast">
          <Card className="bg-[#111827] border-[#1e3a6e]">
            <CardHeader><CardTitle className="text-white text-base">Forecast Comercial</CardTitle></CardHeader>
            <CardContent><ForecastSection /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funnel">
          <Card className="bg-[#111827] border-[#1e3a6e]">
            <CardHeader><CardTitle className="text-white text-base">Embudo de Conversión</CardTitle></CardHeader>
            <CardContent><FunnelSection /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card className="bg-[#111827] border-[#1e3a6e]">
            <CardHeader><CardTitle className="text-white text-base">ROI por Canal de Adquisición</CardTitle></CardHeader>
            <CardContent><ChannelROISection /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verticals">
          <Card className="bg-[#111827] border-[#1e3a6e]">
            <CardHeader><CardTitle className="text-white text-base">Rendimiento por Vertical</CardTitle></CardHeader>
            <CardContent><VerticalsSection /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agent">
          <Card className="bg-[#111827] border-[#1e3a6e]">
            <CardHeader><CardTitle className="text-white text-base">Estadísticas del Agente IA</CardTitle></CardHeader>
            <CardContent><AgentStatsSection /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card className="bg-[#111827] border-[#1e3a6e]">
            <CardHeader><CardTitle className="text-white text-base">Tendencias (30 días)</CardTitle></CardHeader>
            <CardContent><TrendsSection /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
