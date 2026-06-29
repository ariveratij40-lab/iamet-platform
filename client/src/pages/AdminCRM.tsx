import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Users, TrendingUp, Sparkles, Clock, RefreshCw,
  ChevronRight, Building2, Mail, Phone, Globe,
  Target, Star, AlertCircle, CheckCircle2, Calendar,
  MessageCircle, Send, Bell, FileText, UserPlus, Eye,
  Link as LinkIcon, Zap
} from "lucide-react";

// ── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-muted-foreground text-xs">Sin score</span>;
  const s = Number(score);
  if (s >= 80) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">🔥 {s}</span>;
  if (s >= 60) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">⚡ {s}</span>;
  if (s >= 40) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">💧 {s}</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">❄️ {s}</span>;
}

// ── Timeline Icon ────────────────────────────────────────────────────────────
function TimelineIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    lead_created: <UserPlus className="w-3.5 h-3.5" />,
    conversation_started: <MessageCircle className="w-3.5 h-3.5" />,
    meeting_scheduled: <Calendar className="w-3.5 h-3.5" />,
    meeting_confirmed: <CheckCircle2 className="w-3.5 h-3.5" />,
    email_sent: <Mail className="w-3.5 h-3.5" />,
    followup_sent: <Send className="w-3.5 h-3.5" />,
    reminder_sent: <Bell className="w-3.5 h-3.5" />,
    quote_requested: <FileText className="w-3.5 h-3.5" />,
    status_changed: <RefreshCw className="w-3.5 h-3.5" />,
    score_updated: <TrendingUp className="w-3.5 h-3.5" />,
    recommendation_generated: <Sparkles className="w-3.5 h-3.5" />,
    page_visit: <Eye className="w-3.5 h-3.5" />,
    attribution_captured: <LinkIcon className="w-3.5 h-3.5" />,
  };
  const colors: Record<string, string> = {
    lead_created: "bg-emerald-500/20 text-emerald-400",
    conversation_started: "bg-blue-500/20 text-blue-400",
    meeting_scheduled: "bg-purple-500/20 text-purple-400",
    meeting_confirmed: "bg-emerald-500/20 text-emerald-400",
    email_sent: "bg-cyan-500/20 text-cyan-400",
    followup_sent: "bg-amber-500/20 text-amber-400",
    reminder_sent: "bg-orange-500/20 text-orange-400",
    quote_requested: "bg-indigo-500/20 text-indigo-400",
    status_changed: "bg-slate-500/20 text-slate-400",
    score_updated: "bg-teal-500/20 text-teal-400",
    recommendation_generated: "bg-violet-500/20 text-violet-400",
    page_visit: "bg-slate-500/20 text-slate-400",
    attribution_captured: "bg-pink-500/20 text-pink-400",
  };
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${colors[type] || "bg-slate-500/20 text-slate-400"}`}>
      {icons[type] || <Zap className="w-3.5 h-3.5" />}
    </div>
  );
}

// ── Lead Detail Modal ────────────────────────────────────────────────────────
function LeadDetailModal({ leadId, onClose }: { leadId: number; onClose: () => void }) {
  const { data: lead } = trpc.crm.getLeadDetail.useQuery({ leadId });
  const { data: timeline, refetch: refetchTimeline } = trpc.crm.getTimeline.useQuery({ leadId });
  const { data: recommendation, refetch: refetchRec } = trpc.crm.getRecommendation.useQuery({ leadId });
  const { data: score, refetch: refetchScore } = trpc.crm.getLeadScore.useQuery({ leadId });

  const recalcScore = trpc.crm.recalculateScore.useMutation({
    onSuccess: () => { refetchScore(); refetchTimeline(); },
  });
  const genRec = trpc.crm.generateRecommendation.useMutation({
    onSuccess: () => { refetchRec(); refetchTimeline(); },
  });
  const addEvent = trpc.crm.addTimelineEvent.useMutation({
    onSuccess: () => refetchTimeline(),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            {lead?.company || "Cargando..."} — {lead?.contact_name || lead?.name || ""}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="timeline" className="mt-2">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="score">Score IA</TabsTrigger>
            <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
            <TabsTrigger value="data">Datos</TabsTrigger>
          </TabsList>

          {/* ── Timeline ── */}
          <TabsContent value="timeline" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Historia completa del prospecto</h3>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-slate-600"
                onClick={() => addEvent.mutate({
                  leadId,
                  type: "status_changed",
                  title: "Revisión manual",
                  description: "Revisado por el equipo comercial",
                })}
              >
                + Agregar evento
              </Button>
            </div>
            {!timeline || timeline.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin eventos registrados aún</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-700" />
                <div className="space-y-4">
                  {timeline.map((event: any, i: number) => (
                    <div key={i} className="flex gap-3 relative">
                      <TimelineIcon type={event.type} />
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-200">{event.title}</p>
                          <span className="text-xs text-slate-500 flex-shrink-0">
                            {event.createdAt ? new Date(event.createdAt).toLocaleString("es-MX", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Score ── */}
          <TabsContent value="score" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Lead Scoring Dinámico</h3>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-slate-600"
                onClick={() => recalcScore.mutate({ leadId })}
                disabled={recalcScore.isPending}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${recalcScore.isPending ? "animate-spin" : ""}`} />
                Recalcular
              </Button>
            </div>
            {score ? (
              <div className="space-y-4">
                {/* Score principal */}
                <div className="bg-slate-800 rounded-xl p-5 text-center border border-slate-700">
                  <div className="text-6xl font-black mb-1" style={{
                    color: score.score >= 80 ? "#10b981" : score.score >= 60 ? "#f59e0b" : score.score >= 40 ? "#3b82f6" : "#64748b"
                  }}>
                    {score.score}
                  </div>
                  <div className="text-slate-400 text-sm">/ 100</div>
                  <div className="mt-2 text-sm font-medium text-slate-200">{score.recommendation}</div>
                  <div className="mt-1 text-xs text-slate-400">Probabilidad de conversión: {score.probability}%</div>
                  <Badge className="mt-2 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{score.actionLabel}</Badge>
                </div>

                {/* Factores */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Factores de scoring</p>
                  {score.factors?.map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">{f.label}</span>
                          <span className="text-xs font-bold text-slate-200">{f.value > 0 ? "+" : ""}{f.value} pts</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.abs(f.value) / f.maxValue * 100)}%`,
                              backgroundColor: f.value > 0 ? "#10b981" : "#ef4444"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm mb-3">Sin score calculado</p>
                <Button size="sm" onClick={() => recalcScore.mutate({ leadId })} disabled={recalcScore.isPending}>
                  Calcular ahora
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Recomendaciones ── */}
          <TabsContent value="recommendations" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-300">Recomendaciones IA</h3>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-slate-600"
                onClick={() => genRec.mutate({ leadId })}
                disabled={genRec.isPending}
              >
                <Sparkles className={`w-3 h-3 mr-1 ${genRec.isPending ? "animate-spin" : ""}`} />
                {genRec.isPending ? "Generando..." : "Regenerar"}
              </Button>
            </div>
            {recommendation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Vendedor Sugerido</span>
                    </div>
                    <p className="text-sm text-slate-200">{recommendation.vendorSuggestion}</p>
                  </div>
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Especialista</span>
                    </div>
                    <p className="text-sm text-slate-200">{recommendation.specialistSuggestion}</p>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Productos Recomendados</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.products?.map((p: string, i: number) => (
                      <Badge key={i} className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs">{p}</Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Cross-Sell</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.crossSell?.map((c: string, i: number) => (
                      <Badge key={i} className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <p className="text-xs text-slate-400 font-medium mb-1">Razonamiento IA</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{recommendation.reasoning}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm mb-3">Sin recomendaciones generadas</p>
                <Button size="sm" onClick={() => genRec.mutate({ leadId })} disabled={genRec.isPending}>
                  {genRec.isPending ? "Generando..." : "Generar con IA"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Datos ── */}
          <TabsContent value="data" className="mt-4">
            {lead ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Empresa", value: lead.company, icon: <Building2 className="w-3.5 h-3.5" /> },
                  { label: "Contacto", value: lead.contact_name || lead.name, icon: <Users className="w-3.5 h-3.5" /> },
                  { label: "Email", value: lead.email, icon: <Mail className="w-3.5 h-3.5" /> },
                  { label: "Teléfono", value: lead.phone, icon: <Phone className="w-3.5 h-3.5" /> },
                  { label: "Industria", value: lead.industry, icon: <Globe className="w-3.5 h-3.5" /> },
                  { label: "Tamaño", value: lead.company_size, icon: <Users className="w-3.5 h-3.5" /> },
                  { label: "Vertical", value: lead.vertical_slug || lead.interest, icon: <Target className="w-3.5 h-3.5" /> },
                  { label: "Fuente UTM", value: lead.utm_source, icon: <LinkIcon className="w-3.5 h-3.5" /> },
                  { label: "Campaña", value: lead.utm_campaign, icon: <Zap className="w-3.5 h-3.5" /> },
                  { label: "Keyword", value: lead.utm_term, icon: <AlertCircle className="w-3.5 h-3.5" /> },
                  { label: "Conversaciones", value: lead.conversation_count, icon: <MessageCircle className="w-3.5 h-3.5" /> },
                  { label: "Reuniones", value: lead.meeting_count, icon: <Calendar className="w-3.5 h-3.5" /> },
                ].map(({ label, value, icon }) => value != null && value !== "" && (
                  <div key={label} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                      {icon}
                      <span className="text-xs">{label}</span>
                    </div>
                    <p className="text-sm text-slate-200 truncate">{String(value)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">Cargando datos...</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ── Main CRM Page ────────────────────────────────────────────────────────────
export default function AdminCRM() {
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [briefingOpen, setBriefingOpen] = useState(false);

  const { data: leads, isLoading, refetch } = trpc.crm.getLeadsList.useQuery(
    { limit: 50, status: statusFilter },
    { refetchInterval: 60000 }
  );
  const { data: briefings } = trpc.crm.getBriefings.useQuery({ limit: 3 });
  const genBriefing = trpc.crm.generateBriefing.useMutation({
    onSuccess: () => refetch(),
  });

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    contacted: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    qualified: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    proposal: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    won: "bg-teal-500/20 text-teal-300 border-teal-500/30",
    lost: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  const hotLeads = leads?.filter((l: any) => Number(l.score) >= 70) ?? [];
  const totalLeads = leads?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
              CRM Inteligente
            </h1>
            <p className="text-slate-400 text-sm mt-1">Lead scoring, timeline y recomendaciones IA</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300"
              onClick={() => setBriefingOpen(true)}
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" />
              Briefing del Día
            </Button>
            <Button
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-500"
              onClick={() => genBriefing.mutate()}
              disabled={genBriefing.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${genBriefing.isPending ? "animate-spin" : ""}`} />
              {genBriefing.isPending ? "Generando..." : "Generar Briefing"}
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Leads", value: totalLeads, icon: <Users className="w-5 h-5 text-blue-400" />, color: "border-blue-500/30" },
            { label: "Leads Calientes", value: hotLeads.length, icon: <Zap className="w-5 h-5 text-amber-400" />, color: "border-amber-500/30" },
            { label: "Score Promedio", value: leads?.length ? Math.round(leads.reduce((a: number, l: any) => a + (Number(l.score) || 0), 0) / leads.length) : 0, icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, color: "border-emerald-500/30" },
            { label: "Con Recomendación", value: leads?.filter((l: any) => l.recommendation)?.length ?? 0, icon: <Sparkles className="w-5 h-5 text-violet-400" />, color: "border-violet-500/30" },
          ].map(({ label, value, icon, color }) => (
            <Card key={label} className={`bg-slate-800/50 border ${color}`}>
              <CardContent className="p-4 flex items-center gap-3">
                {icon}
                <div>
                  <div className="text-2xl font-bold text-white">{value}</div>
                  <div className="text-xs text-slate-400">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Todos", value: undefined },
            { label: "Nuevos", value: "new" },
            { label: "Contactados", value: "contacted" },
            { label: "Calificados", value: "qualified" },
            { label: "Propuesta", value: "proposal" },
            { label: "Ganados", value: "won" },
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === value
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Leads Table */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-300">
              {isLoading ? "Cargando..." : `${leads?.length ?? 0} leads`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12 text-slate-500">Cargando leads...</div>
            ) : !leads || leads.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin leads en este estado</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {leads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    {/* Score */}
                    <div className="w-16 flex-shrink-0">
                      <ScoreBadge score={lead.score} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200 truncate">
                          {lead.company}
                        </span>
                        {lead.status && (
                          <Badge className={`text-xs ${statusColors[lead.status] || "bg-slate-500/20 text-slate-300"}`}>
                            {lead.status}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {lead.contact_name || lead.name} · {lead.email}
                      </div>
                    </div>

                    {/* Vertical */}
                    <div className="hidden md:block w-28 flex-shrink-0">
                      <span className="text-xs text-slate-400 truncate block">
                        {lead.vertical_slug || lead.interest || "—"}
                      </span>
                    </div>

                    {/* Action */}
                    {lead.action_label && (
                      <div className="hidden lg:block w-32 flex-shrink-0">
                        <span className="text-xs text-cyan-400 truncate block">{lead.action_label}</span>
                      </div>
                    )}

                    {/* UTM */}
                    {lead.utm_source && (
                      <div className="hidden xl:block w-24 flex-shrink-0">
                        <span className="text-xs text-slate-500 truncate block">{lead.utm_source}</span>
                      </div>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead Detail Modal */}
      {selectedLeadId && (
        <LeadDetailModal leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}

      {/* Briefing Modal */}
      {briefingOpen && (
        <Dialog open onOpenChange={() => setBriefingOpen(false)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Briefing Comercial
              </DialogTitle>
            </DialogHeader>
            {!briefings || briefings.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p className="text-sm mb-3">Sin briefings generados</p>
                <Button size="sm" onClick={() => { genBriefing.mutate(); setBriefingOpen(false); }}>
                  Generar ahora
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {briefings.map((b: any, i: number) => (
                  <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400">{b.date}</span>
                      <div className="flex gap-3 text-xs text-slate-400">
                        <span>📅 {b.meetingsToday?.length ?? 0} reuniones</span>
                        <span>🔥 {b.hotLeads?.length ?? 0} leads calientes</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed mb-3">{b.summary}</p>
                    {b.alerts?.length > 0 && (
                      <div className="mb-3">
                        {b.alerts.map((a: string, j: number) => (
                          <div key={j} className="flex items-start gap-2 text-xs text-amber-300 mb-1">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            {a}
                          </div>
                        ))}
                      </div>
                    )}
                    {b.recommendations?.length > 0 && (
                      <div className="space-y-1">
                        {b.recommendations.map((r: string, j: number) => (
                          <div key={j} className="flex items-start gap-2 text-xs text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            {r}
                          </div>
                        ))}
                      </div>
                    )}
                    {i < briefings.length - 1 && <Separator className="mt-4 bg-slate-700" />}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
