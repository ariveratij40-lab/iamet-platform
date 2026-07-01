import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, MessageSquare, TrendingUp, BarChart2, Filter, Search,
  ChevronDown, Eye, CheckCircle2, Clock, AlertCircle, Loader2,
  ArrowUpRight, Brain, Building2, Mail, Phone, Calendar,
  Shield, Server, Cpu, Headphones, GraduationCap, FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? "oklch(0.68 0.18 160)" :
    score >= 40 ? "oklch(0.70 0.22 280)" :
    "oklch(0.62 0.22 25)";
  const label = score >= 70 ? "Hot" : score >= 40 ? "Warm" : "Cold";
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {score} · {label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "Nuevo", color: "oklch(0.65 0.20 240)" },
  contacted: { label: "Contactado", color: "oklch(0.70 0.22 280)" },
  qualified: { label: "Calificado", color: "oklch(0.68 0.18 160)" },
  proposal: { label: "Propuesta", color: "oklch(0.75 0.18 75)" },
  won: { label: "Ganado", color: "oklch(0.68 0.18 160)" },
  lost: { label: "Perdido", color: "oklch(0.62 0.22 25)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "var(--color-iamet-text-subtle)" };
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

const VERTICAL_ICONS: Record<string, React.ElementType> = {
  infraestructura: Server,
  seguridad: Shield,
  rfid: Cpu,
  "software-ia": Brain,
  "servicios-administrados": Headphones,
  educacion: GraduationCap,
  compliance: FileCheck,
};

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="neumorphic rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-[var(--color-iamet-text-subtle)]" />
      </div>
      <div>
        <p className="font-display text-2xl font-800 text-[var(--color-iamet-text)]">{value}</p>
        <p className="text-xs text-[var(--color-iamet-text-muted)] mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-[var(--color-iamet-text-subtle)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"leads" | "conversations" | "analytics">("leads");
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [selectedLead, setSelectedLead] = useState<number | null>(null);
  const [selectedConv, setSelectedConv] = useState<number | null>(null);

  const { data: allLeads = [], isLoading: leadsLoading } = trpc.leads.list.useQuery(
    { status: leadStatus || undefined },
    { enabled: isAuthenticated }
  );

  // Client-side search filter
  const leads = allLeads.filter((l) => {
    if (!leadSearch) return true;
    const q = leadSearch.toLowerCase();
    return (
      (l.company ?? "").toLowerCase().includes(q) ||
      (l.contactName ?? "").toLowerCase().includes(q) ||
      (l.email ?? "").toLowerCase().includes(q)
    );
  });

  const { data: conversations = [], isLoading: convsLoading } = trpc.agent.listAll.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: analytics } = trpc.analytics.dashboard.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: conversionSummary } = trpc.analytics.getSummary.useQuery(
    undefined,
    { enabled: isAuthenticated && activeTab === "analytics" }
  );

  const { data: attributionSummary } = trpc.analytics.getAttributionSummary.useQuery(
    undefined,
    { enabled: isAuthenticated && activeTab === "analytics" }
  );

  const updateLeadStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => trpc.useUtils().leads.list.invalidate(),
  });

  // ── Auth Guard ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-iamet-accent)]" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neumorphic rounded-2xl p-10 text-center space-y-5 max-w-sm w-full mx-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--color-iamet-accent-muted)] flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7 text-[var(--color-iamet-accent)]" />
          </div>
          <h2 className="font-display text-xl font-700 text-[var(--color-iamet-text)]">Acceso Restringido</h2>
          <p className="text-sm text-[var(--color-iamet-text-muted)]">
            Este panel es exclusivo para administradores de IAMET.
          </p>
          {!isAuthenticated ? (
            <a href="/admin/login">
              <Button className="w-full bg-[var(--color-iamet-accent)] text-white btn-press">
                Iniciar sesión
              </Button>
            </a>
          ) : (
            <p className="text-xs text-[var(--color-iamet-text-subtle)]">
              Tu cuenta no tiene permisos de administrador.
            </p>
          )}
        </div>
      </div>
    );
  }

  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => (l.score ?? 0) >= 70).length;
  const totalConvs = conversations.length;
  const avgScore = totalLeads > 0
    ? Math.round(leads.reduce((s, l) => s + (l.score ?? 0), 0) / totalLeads)
    : 0;

  return (
    <div className="min-h-screen bg-[var(--color-iamet-bg)] pt-16">
      <div className="container py-8 space-y-8">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-800 text-[var(--color-iamet-text)]">
              Panel Administrativo
            </h1>
            <p className="text-sm text-[var(--color-iamet-text-muted)] mt-1">
              Bienvenido, {user?.name ?? "Admin"} · IAMET Evolución Tecnológica
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[oklch(0.68_0.18_160)] animate-pulse" />
            <span className="text-xs text-[var(--color-iamet-text-subtle)]">Sistema activo</span>
          </div>
        </div>

        {/* ── Metrics ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Users} label="Total de Leads" value={totalLeads} sub="Todos los estados" color="oklch(0.65 0.20 240)" />
          <MetricCard icon={TrendingUp} label="Leads Hot" value={hotLeads} sub="Score ≥ 70" color="oklch(0.68 0.18 160)" />
          <MetricCard icon={MessageSquare} label="Conversaciones" value={totalConvs} sub="Con el Agente Virtual" color="oklch(0.70 0.22 280)" />
          <MetricCard icon={BarChart2} label="Score Promedio" value={`${avgScore}/100`} sub="Lead scoring automático" color="oklch(0.75 0.18 75)" />
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 neumorphic rounded-xl p-1 w-fit">
          {(["leads", "conversations", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${activeTab === tab ? "bg-[var(--color-iamet-accent)] text-white" : "text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-text)]"}`}
            >
              {tab === "leads" ? "Leads" : tab === "conversations" ? "Conversaciones" : "Analítica"}
            </button>
          ))}
        </div>

        {/* ── Leads Tab ───────────────────────────────────────────────────── */}
        {activeTab === "leads" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-iamet-text-subtle)]" />
                <input
                  type="text"
                  placeholder="Buscar lead..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  className="w-full neumorphic-inset rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] outline-none focus:ring-1 focus:ring-[var(--color-iamet-accent)] bg-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-iamet-text-subtle)]" />
                <select
                  value={leadStatus}
                  onChange={(e) => setLeadStatus(e.target.value)}
                  className="neumorphic-inset rounded-xl pl-9 pr-8 py-2.5 text-sm text-[var(--color-iamet-text)] outline-none focus:ring-1 focus:ring-[var(--color-iamet-accent)] bg-transparent appearance-none cursor-pointer"
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-iamet-text-subtle)] pointer-events-none" />
              </div>
            </div>

            {/* Table */}
            <div className="neumorphic rounded-2xl overflow-hidden">
              {leadsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--color-iamet-accent)]" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Users className="w-8 h-8 text-[var(--color-iamet-text-subtle)] mx-auto" />
                  <p className="text-sm text-[var(--color-iamet-text-muted)]">No se encontraron leads</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-iamet-border-subtle)]">
                        {["Empresa / Contacto", "Vertical", "Score", "Estado", "Fuente", "Fecha", "Acciones"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-iamet-text-subtle)] uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead, i) => {
                        const VIcon = VERTICAL_ICONS[lead.verticalSlug ?? ""] ?? Server;
                        return (
                          <motion.tr
                            key={lead.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-[var(--color-iamet-border-subtle)] hover:bg-[var(--color-iamet-surface-2)] transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[var(--color-iamet-accent-muted)] flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-4 h-4 text-[var(--color-iamet-accent)]" />
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--color-iamet-text)] text-xs">{lead.company ?? "—"}</p>
                                  <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">{lead.contactName ?? lead.email ?? "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {lead.verticalSlug ? (
                                <div className="flex items-center gap-1.5">
                                  <VIcon className="w-3.5 h-3.5 text-[var(--color-iamet-accent)]" />
                                  <span className="text-xs text-[var(--color-iamet-text-muted)] capitalize">{lead.verticalSlug.replace("-", " ")}</span>
                                </div>
                              ) : <span className="text-xs text-[var(--color-iamet-text-subtle)]">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <ScoreBadge score={lead.score ?? 0} />
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={lead.status ?? "new"} />
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-[var(--color-iamet-text-subtle)] capitalize">{lead.source ?? "—"}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-[var(--color-iamet-text-subtle)]">
                                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSelectedLead(selectedLead === lead.id ? null : lead.id)}
                                  className="p-1.5 rounded-lg hover:bg-[var(--color-iamet-accent-muted)] transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[var(--color-iamet-accent)]" />
                                </button>
                                <select
                                  value={lead.status ?? "new"}
                                  onChange={(e) => updateLeadStatus.mutate({ id: lead.id, status: e.target.value as "new" | "contacted" | "qualified" | "proposal" | "won" | "lost" })}
                                  className="text-[10px] bg-transparent text-[var(--color-iamet-text-subtle)] outline-none cursor-pointer"
                                >
                                  {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                    <option key={val} value={val}>{cfg.label}</option>
                                  ))}
                                </select>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Lead Detail Panel */}
            {selectedLead !== null && (() => {
              const lead = leads.find((l) => l.id === selectedLead);
              if (!lead) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="neumorphic rounded-2xl p-6 grid sm:grid-cols-2 gap-6"
                >
                  <div className="space-y-3">
                    <h3 className="font-display font-700 text-[var(--color-iamet-text)]">Detalle del Lead</h3>
                    {[
                      { icon: Building2, label: "Empresa", value: lead.company },
                      { icon: Users, label: "Contacto", value: lead.contactName },
                      { icon: Mail, label: "Email", value: lead.email },
                      { icon: Phone, label: "Teléfono", value: lead.phone },
                      { icon: Calendar, label: "Fecha", value: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString("es-MX") : null },
                    ].map(({ icon: Icon, label, value }) => value ? (
                      <div key={label} className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[var(--color-iamet-text-subtle)] flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">{label}</p>
                          <p className="text-xs text-[var(--color-iamet-text-muted)]">{value}</p>
                        </div>
                      </div>
                    ) : null)}
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-[var(--color-iamet-text)]">Problema descrito</h4>
                    <p className="text-xs text-[var(--color-iamet-text-muted)] leading-relaxed">
                      {lead.problemDescription ?? "Sin descripción"}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs text-[var(--color-iamet-text-subtle)]">Score:</span>
                      <ScoreBadge score={lead.score ?? 0} />
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </motion.div>
        )}

        {/* ── Conversations Tab ────────────────────────────────────────────── */}
        {activeTab === "conversations" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {convsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--color-iamet-accent)]" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <MessageSquare className="w-8 h-8 text-[var(--color-iamet-text-subtle)] mx-auto" />
                <p className="text-sm text-[var(--color-iamet-text-muted)]">No hay conversaciones registradas</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {conversations.map((conv, i: number) => (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="neumorphic rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--color-iamet-surface-2)] transition-colors"
                    onClick={() => setSelectedConv(selectedConv === conv.id ? null : conv.id as number)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[var(--color-iamet-accent-muted)] flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-[var(--color-iamet-accent)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-iamet-text)]">
                          Sesión #{conv.id}
                        </p>
                        <p className="text-xs text-[var(--color-iamet-text-subtle)]">
                          {conv.createdAt ? new Date(conv.createdAt).toLocaleString("es-MX") : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {conv.leadId && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-iamet-accent-muted)] text-[var(--color-iamet-accent)]">
                          Lead capturado
                        </span>
                      )}
                      <span className={`w-2 h-2 rounded-full ${conv.status === "active" ? "bg-[oklch(0.68_0.18_160)] animate-pulse" : "bg-[var(--color-iamet-text-subtle)]"}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Analytics Tab (Dashboard Comercial) ──────────────────────────── */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* KPIs de Conversión */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Calendar, label: "Reuniones Agendadas", value: conversionSummary?.meetingsBooked ?? 0, color: "oklch(0.68 0.18 160)" },
                { icon: Users, label: "Leads Generados", value: conversionSummary?.leadsGenerated ?? 0, color: "oklch(0.65 0.20 240)" },
                { icon: MessageSquare, label: "Sesiones de Chat", value: conversionSummary?.chatSessions ?? 0, color: "oklch(0.70 0.22 280)" },
                { icon: BarChart2, label: "Total de Eventos", value: conversionSummary?.totalEvents ?? 0, color: "oklch(0.75 0.18 75)" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="neumorphic rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                      <Icon className="w-4.5 h-4.5" style={{ color }} />
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[var(--color-iamet-text-subtle)]" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-800 text-[var(--color-iamet-text)]">{value}</p>
                    <p className="text-xs text-[var(--color-iamet-text-muted)] mt-0.5">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Eventos por Tipo + Interacción por Vertical */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="neumorphic rounded-2xl p-6 space-y-4">
                <h3 className="font-display font-700 text-[var(--color-iamet-text)]">Eventos por tipo</h3>
                {conversionSummary?.eventsByType && conversionSummary.eventsByType.length > 0 ? (
                  <div className="space-y-3">
                    {conversionSummary.eventsByType.map(({ event, count }) => {
                      const maxCount = Math.max(...conversionSummary.eventsByType.map((e) => e.count), 1);
                      const pct = Math.round((count / maxCount) * 100);
                      const color = event.includes("meeting") ? "oklch(0.68 0.18 160)" :
                                    event.includes("lead") ? "oklch(0.65 0.20 240)" :
                                    event.includes("chat") ? "oklch(0.70 0.22 280)" : "oklch(0.75 0.18 75)";
                      return (
                        <div key={event} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--color-iamet-text-muted)]">{event.replace(/_/g, " ")}</span>
                            <span className="text-xs font-semibold text-[var(--color-iamet-text)]">{count}</span>
                          </div>
                          <div className="h-1.5 bg-[var(--color-iamet-bg-tertiary)] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-iamet-text-subtle)]">Sin eventos aún. Los eventos se registran cuando los visitantes interactúan con las landing pages.</p>
                )}
              </div>

              <div className="neumorphic rounded-2xl p-6 space-y-4">
                <h3 className="font-display font-700 text-[var(--color-iamet-text)]">Interacción por vertical</h3>
                {conversionSummary?.eventsByVertical && conversionSummary.eventsByVertical.length > 0 ? (
                  <div className="space-y-3">
                    {conversionSummary.eventsByVertical.map(({ vertical, count }) => {
                      const VIcon = VERTICAL_ICONS[vertical ?? ""] ?? Server;
                      const maxCount = Math.max(...conversionSummary.eventsByVertical.map((e) => e.count), 1);
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={vertical} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <VIcon className="w-3.5 h-3.5 text-[var(--color-iamet-accent)]" />
                              <span className="text-xs text-[var(--color-iamet-text-muted)] capitalize">{(vertical ?? "sin vertical").replace(/-/g, " ")}</span>
                            </div>
                            <span className="text-xs font-semibold text-[var(--color-iamet-text)]">{count}</span>
                          </div>
                          <div className="h-1.5 bg-[var(--color-iamet-bg-tertiary)] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                              className="h-full rounded-full bg-gradient-to-r from-[var(--color-iamet-accent)] to-[var(--color-iamet-cyan)]"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-iamet-text-subtle)]">Sin datos de verticales aún.</p>
                )}
              </div>
            </div>

            {/* Actividad Reciente */}
            <div className="neumorphic rounded-2xl p-6 space-y-4">
              <h3 className="font-display font-700 text-[var(--color-iamet-text)]">Actividad reciente</h3>
              {conversionSummary?.recentEvents && conversionSummary.recentEvents.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {conversionSummary.recentEvents.map((ev, i) => {
                    const color = ev.event.includes("meeting") ? "oklch(0.68 0.18 160)" :
                                  ev.event.includes("lead") ? "oklch(0.65 0.20 240)" :
                                  ev.event.includes("chat") ? "oklch(0.70 0.22 280)" : "oklch(0.75 0.18 75)";
                    return (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-[var(--color-iamet-border)] last:border-0">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-xs text-[var(--color-iamet-text)] flex-1">{ev.event.replace(/_/g, " ")}</span>
                        {ev.vertical && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-iamet-bg-tertiary)] text-[var(--color-iamet-text-subtle)]">{ev.vertical}</span>
                        )}
                        <span className="text-[10px] text-[var(--color-iamet-text-subtle)] flex-shrink-0">
                          {new Date(ev.createdAt).toLocaleString("es-MX", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-iamet-text-subtle)]">Sin actividad reciente.</p>
              )}
            </div>

            {/* Attribution — Fuente, Campaña, Medium */}
            <div className="neumorphic rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-700 text-[var(--color-iamet-text)]">Attribution de Leads</h3>
                <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-iamet-bg-tertiary)] text-[var(--color-iamet-text-subtle)]">UTM + Click IDs</span>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Por Fuente */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--color-iamet-text-muted)] uppercase tracking-wider">Por Fuente</p>
                  {attributionSummary?.bySource && attributionSummary.bySource.length > 0 ? (
                    attributionSummary.bySource.map(({ source, leads: l, meetings: m }) => (
                      <div key={source} className="flex items-center justify-between py-1.5 border-b border-[var(--color-iamet-border)] last:border-0">
                        <span className="text-xs text-[var(--color-iamet-text-muted)] capitalize">{source || 'direct'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{l} leads</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{m} meet</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--color-iamet-text-subtle)]">Sin datos de fuente aún. Se registran cuando los leads incluyen UTM params.</p>
                  )}
                </div>
                {/* Por Campaña */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--color-iamet-text-muted)] uppercase tracking-wider">Por Campaña</p>
                  {attributionSummary?.byCampaign && attributionSummary.byCampaign.length > 0 ? (
                    attributionSummary.byCampaign.map(({ campaign, leads: l, meetings: m }) => (
                      <div key={campaign} className="flex items-center justify-between py-1.5 border-b border-[var(--color-iamet-border)] last:border-0">
                        <span className="text-xs text-[var(--color-iamet-text-muted)] truncate max-w-[120px]">{campaign}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{l} leads</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">{m} meet</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--color-iamet-text-subtle)]">Sin campañas registradas aún.</p>
                  )}
                </div>
                {/* Top Keywords */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--color-iamet-text-muted)] uppercase tracking-wider">Top Keywords (utm_term)</p>
                  {attributionSummary?.topKeywords && attributionSummary.topKeywords.length > 0 ? (
                    attributionSummary.topKeywords.map(({ keyword, count }) => (
                      <div key={keyword} className="flex items-center justify-between py-1.5 border-b border-[var(--color-iamet-border)] last:border-0">
                        <span className="text-xs text-[var(--color-iamet-text-muted)] truncate max-w-[140px]">{keyword}</span>
                        <span className="text-xs font-semibold text-[var(--color-iamet-text)]">{count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--color-iamet-text-subtle)]">Sin keywords registradas. Se capturan desde utm_term en la URL.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pipeline de Seguimiento Automático */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="neumorphic rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'oklch(0.65 0.20 240 / 0.15)' }}>
                    <Users className="w-4 h-4" style={{ color: 'oklch(0.65 0.20 240)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-iamet-text)]">Seguimiento de Leads</p>
                    <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">Emails automáticos post no-show</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Pendientes', value: attributionSummary?.followupStats?.pending ?? 0, color: 'oklch(0.75 0.18 75)' },
                    { label: 'Enviados', value: attributionSummary?.followupStats?.sent ?? 0, color: 'oklch(0.68 0.18 160)' },
                    { label: 'Fallidos', value: attributionSummary?.followupStats?.failed ?? 0, color: 'oklch(0.62 0.22 25)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded-xl bg-[var(--color-iamet-bg-tertiary)]">
                      <p className="font-display text-xl font-800 text-[var(--color-iamet-text)]">{value}</p>
                      <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">Total: {attributionSummary?.followupStats?.total ?? 0} seguimientos programados</p>
              </div>

              <div className="neumorphic rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'oklch(0.68 0.18 160 / 0.15)' }}>
                    <Calendar className="w-4 h-4" style={{ color: 'oklch(0.68 0.18 160)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-iamet-text)]">Recordatorios de Reuniones</p>
                    <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">24h / 2h / 30min antes</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Pendientes', value: attributionSummary?.reminderStats?.pending ?? 0, color: 'oklch(0.75 0.18 75)' },
                    { label: 'Enviados', value: attributionSummary?.reminderStats?.sent ?? 0, color: 'oklch(0.68 0.18 160)' },
                    { label: 'Fallidos', value: attributionSummary?.reminderStats?.failed ?? 0, color: 'oklch(0.62 0.22 25)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 rounded-xl bg-[var(--color-iamet-bg-tertiary)]">
                      <p className="font-display text-xl font-800 text-[var(--color-iamet-text)]">{value}</p>
                      <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">{label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">Total: {attributionSummary?.reminderStats?.total ?? 0} recordatorios programados</p>
              </div>
            </div>

            {/* Score Distribution (heredado) */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Hot Leads", range: "Score 70–100", count: leads.filter((l) => (l.score ?? 0) >= 70).length, color: "oklch(0.68 0.18 160)", icon: CheckCircle2 },
                { label: "Warm Leads", range: "Score 40–69", count: leads.filter((l) => (l.score ?? 0) >= 40 && (l.score ?? 0) < 70).length, color: "oklch(0.70 0.22 280)", icon: Clock },
                { label: "Cold Leads", range: "Score 0–39", count: leads.filter((l) => (l.score ?? 0) < 40).length, color: "oklch(0.62 0.22 25)", icon: AlertCircle },
              ].map(({ label, range, count, color, icon: Icon }) => (
                <div key={label} className="neumorphic rounded-2xl p-5 space-y-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-800 text-[var(--color-iamet-text)]">{count}</p>
                    <p className="text-xs font-medium text-[var(--color-iamet-text-muted)]">{label}</p>
                    <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">{range}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
