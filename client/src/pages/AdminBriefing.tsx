import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Newspaper, RefreshCw, Flame, Calendar, Mail, TrendingUp,
  AlertTriangle, Lightbulb, Users, BarChart3, ChevronDown, ChevronRight
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity mb-2">
          {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
          <Icon className="w-4 h-4 text-[#00d4ff]" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 mb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function LeadCard({ lead }: { lead: { name?: string; company?: string; score?: number; action?: string; vertical?: string } }) {
  return (
    <div className="flex items-center gap-3 bg-[#0d1b3e] rounded-lg p-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs font-bold text-white">
        {lead.score ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{lead.company ?? lead.name ?? "Lead"}</p>
        {lead.vertical && <p className="text-xs text-slate-500">{lead.vertical}</p>}
      </div>
      {lead.action && (
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 border text-xs">
          {lead.action}
        </Badge>
      )}
    </div>
  );
}

function MeetingCard({ meeting }: { meeting: { clientName?: string; company?: string; time?: string; engineer?: string; topic?: string } }) {
  return (
    <div className="flex items-center gap-3 bg-[#0d1b3e] rounded-lg p-3 mb-2">
      <Calendar className="w-4 h-4 text-[#00d4ff] shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{meeting.clientName ?? meeting.company ?? "Reunión"}</p>
        <p className="text-xs text-slate-500">{meeting.time}{meeting.engineer ? ` · ${meeting.engineer}` : ""}</p>
      </div>
      {meeting.topic && (
        <span className="text-xs text-slate-400 truncate max-w-32">{meeting.topic}</span>
      )}
    </div>
  );
}

function AlertCard({ alert }: { alert: { type?: string; message?: string; severity?: string } }) {
  const color = alert.severity === "high" ? "text-red-400 bg-red-500/10 border-red-500/20"
    : alert.severity === "medium" ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
    : "text-blue-400 bg-blue-500/10 border-blue-500/20";
  return (
    <div className={`flex items-start gap-2 rounded-lg p-3 mb-2 border ${color}`}>
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="text-xs">{alert.message ?? "Alerta sin descripción"}</p>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: { action?: string; reason?: string; priority?: string } }) {
  return (
    <div className="flex items-start gap-2 bg-[#0d1b3e] rounded-lg p-3 mb-2">
      <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm text-white">{rec.action ?? "Recomendación"}</p>
        {rec.reason && <p className="text-xs text-slate-500 mt-0.5">{rec.reason}</p>}
      </div>
      {rec.priority && (
        <Badge className={`ml-auto text-xs ${rec.priority === "high" ? "bg-red-500/20 text-red-400" : "bg-slate-500/20 text-slate-400"}`}>
          {rec.priority}
        </Badge>
      )}
    </div>
  );
}

interface BriefingData {
  date: string;
  summary: string;
  meetingsToday: Array<{ time: string; client: string; company: string; engineer: string; topic: string }>;
  hotLeads: Array<{ name: string; company: string; score: number; action: string }>;
  pendingFollowups: number;
  overdueFollowups: number;
  bestCampaign: { name: string; leads: number; cpl: string } | null;
  alerts: string[];
  recommendations: string[];
}

function BriefingView({ briefing }: { briefing: BriefingData }) {
  const summary = briefing.summary;
  const hotLeads = briefing.hotLeads ?? [];
  const meetingsToday = briefing.meetingsToday ?? [];
  const alerts = briefing.alerts ?? [];
  const recommendations = briefing.recommendations ?? [];
  // pipeline not in BriefingContent — skip
  const campaignInsights = briefing.bestCampaign
    ? `Mejor campaña: ${briefing.bestCampaign.name} — ${briefing.bestCampaign.leads} leads, CPL: ${briefing.bestCampaign.cpl}`
    : undefined;

  return (
    <div className="space-y-2">
      {/* Resumen ejecutivo */}
      {summary && (
        <div className="bg-gradient-to-r from-[#0d1b3e] to-[#0a1628] rounded-lg p-4 border border-[#1e3a6e] mb-4">
          <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Seguimientos */}
      {(briefing.pendingFollowups > 0 || briefing.overdueFollowups > 0) && (
        <Section title="Seguimientos" icon={BarChart3}>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0d1b3e] rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500">Pendientes</p>
              <p className="text-lg font-bold text-yellow-400">{briefing.pendingFollowups}</p>
            </div>
            <div className="bg-[#0d1b3e] rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500">Vencidos</p>
              <p className="text-lg font-bold text-red-400">{briefing.overdueFollowups}</p>
            </div>
          </div>
        </Section>
      )}

      {/* Leads Hot */}
      {hotLeads.length > 0 && (
        <Section title={`Leads Hot (${hotLeads.length})`} icon={Flame}>
          {hotLeads.map((lead, i) => <LeadCard key={i} lead={{ name: lead.name, company: lead.company, score: lead.score, action: lead.action }} />)}
        </Section>
      )}

      {/* Reuniones del día */}
      {meetingsToday.length > 0 && (
        <Section title={`Reuniones Hoy (${meetingsToday.length})`} icon={Calendar}>
          {meetingsToday.map((m, i) => <MeetingCard key={i} meeting={{ clientName: m.client, company: m.company, time: m.time, engineer: m.engineer, topic: m.topic }} />)}
        </Section>
      )}

      {/* Alertas */}
      {alerts.length > 0 && (
        <Section title={`Alertas (${alerts.length})`} icon={AlertTriangle} defaultOpen={true}>
          {alerts.map((a, i) => <AlertCard key={i} alert={{ message: typeof a === 'string' ? a : (a as { message?: string }).message, severity: 'medium' }} />)}
        </Section>
      )}

      {/* Recomendaciones */}
      {recommendations.length > 0 && (
        <Section title={`Recomendaciones IA (${recommendations.length})`} icon={Lightbulb}>
          {recommendations.map((r, i) => <RecommendationCard key={i} rec={{ action: typeof r === 'string' ? r : (r as { action?: string }).action }} />)}
        </Section>
      )}

      {/* Insights de campaña */}
      {campaignInsights && (
        <Section title="Insights de Campaña" icon={TrendingUp} defaultOpen={false}>
          <p className="text-sm text-slate-300 leading-relaxed">{campaignInsights}</p>
        </Section>
      )}
    </div>
  );
}

export default function AdminBriefing() {
  const { data, isLoading, refetch } = trpc.crm.getBriefings.useQuery({ limit: 5 });
  const [selectedIdx, setSelectedIdx] = useState(0);

  const generate = trpc.crm.generateBriefing.useMutation({
    onSuccess: () => { toast.success("Briefing generado"); refetch(); setSelectedIdx(0); },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const briefings = (data ?? []) as BriefingData[];
  const current = briefings[selectedIdx];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#ef4444] flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Briefing Ejecutivo IA</h1>
            <p className="text-sm text-slate-400">Generado automáticamente cada mañana a las 07:00 AM</p>
          </div>
        </div>
        <Button
          className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-medium"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${generate.isPending ? "animate-spin" : ""}`} />
          {generate.isPending ? "Generando..." : "Generar ahora"}
        </Button>
      </div>

      {/* Selector de fecha */}
      {briefings.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {briefings.map((b: BriefingData, i: number) => (
            <button
              key={b.date}
              onClick={() => setSelectedIdx(i)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                i === selectedIdx
                  ? "bg-[#0066cc] text-white"
                  : "bg-[#0d1b3e] text-slate-400 hover:text-white border border-[#1e3a6e]"
              }`}
            >
              {new Date(b.date).toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }) || b.date}
            </button>
          ))}
        </div>
      )}

      {/* Briefing actual */}
      {isLoading && (
        <Card className="bg-[#111827] border-[#1e3a6e]">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-slate-500 mx-auto mb-3 animate-spin" />
            <p className="text-slate-500 text-sm">Cargando briefing...</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && briefings.length === 0 && (
        <Card className="bg-[#111827] border-[#1e3a6e]">
          <CardContent className="p-12 text-center">
            <Newspaper className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-sm mb-2">No hay briefings generados aún.</p>
            <p className="text-slate-600 text-xs mb-4">El briefing se genera automáticamente cada mañana a las 07:00 AM CST.</p>
            <Button
              className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-medium"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generate.isPending ? "animate-spin" : ""}`} />
              Generar primer briefing
            </Button>
          </CardContent>
        </Card>
      )}

      {current && (
        <Card className="bg-[#111827] border-[#1e3a6e]">
          <CardHeader className="pb-3 border-b border-[#1e3a6e]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#f59e0b]" />
                {new Date(current.date).toLocaleDateString("es-MX", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric"
                })}
              </CardTitle>
              <span className="text-xs text-slate-500">
                {current.pendingFollowups} seguimientos pendientes
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <BriefingView briefing={current} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
