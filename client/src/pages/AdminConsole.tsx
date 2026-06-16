import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, MessageSquare, Globe, Clock, Monitor,
  MapPin, Wifi, ChevronDown, ChevronUp, RefreshCw,
  Activity, Eye, Bot, Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function timeSince(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return "ahora";
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

function getPageLabel(page: string | null): string {
  if (!page) return "—";
  const map: Record<string, string> = {
    "/": "Inicio",
    "/tech-advisor": "Tech Advisor",
    "/academy": "Academy",
    "/soluciones": "Soluciones",
    "/contacto": "Contacto",
    "/admin": "Admin",
  };
  return map[page] ?? page;
}

function getSectionLabel(section: string | null): string {
  if (!section) return "—";
  const map: Record<string, string> = {
    hero: "Hero / Abanico",
    chat: "Chat Agente",
    services: "Servicios",
    contact: "Contacto",
  };
  return map[section] ?? section;
}

function getFlagEmoji(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) return "🌐";
  const offset = 127397;
  return String.fromCodePoint(
    countryCode.toUpperCase().charCodeAt(0) + offset,
    countryCode.toUpperCase().charCodeAt(1) + offset
  );
}

// ─── Visitor Row ──────────────────────────────────────────────────────────────
function VisitorRow({ visitor }: { visitor: any }) {
  const [expanded, setExpanded] = useState(false);
  const eventsQuery = trpc.adminConsole.visitorEvents.useQuery(
    { visitorId: visitor.visitorId, limit: 20 },
    { enabled: expanded }
  );

  const isActive = visitor.chatActive;
  const hasChat = visitor.chatMessages > 0;

  return (
    <motion.div
      layout
      className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-sm shadow-sm overflow-hidden"
      style={{ boxShadow: "4px 4px 10px rgba(0,0,0,0.06), -2px -2px 6px rgba(255,255,255,0.8)" }}
    >
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/90 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Status dot */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-300"}`}
          />
          {isActive && (
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400 animate-ping opacity-60" />
          )}
        </div>

        {/* Visitor ID */}
        <span className="font-mono text-xs text-gray-400 w-20 truncate flex-shrink-0">
          {visitor.visitorId.slice(0, 8)}…
        </span>

        {/* Page + Section */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Monitor className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          <span className="text-xs text-gray-700 truncate">
            {getPageLabel(visitor.currentPage)}
          </span>
          {visitor.currentSection && (
            <>
              <span className="text-gray-300">›</span>
              <span className="text-xs text-gray-500 truncate">
                {getSectionLabel(visitor.currentSection)}
              </span>
            </>
          )}
        </div>

        {/* Chat badge */}
        {hasChat && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border-blue-200 flex-shrink-0"
          >
            <Bot className="w-3 h-3" />
            {visitor.chatMessages} msg
          </Badge>
        )}

        {/* Chat duration */}
        {visitor.chatDuration > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
            <Clock className="w-3 h-3" />
            {formatDuration(visitor.chatDuration)}
          </div>
        )}

        {/* Geo */}
        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
          <span className="text-base leading-none">{getFlagEmoji(visitor.countryCode)}</span>
          <span className="hidden sm:inline">{visitor.city ?? visitor.country ?? "Desconocido"}</span>
        </div>

        {/* Last seen */}
        <span className="text-xs text-gray-400 flex-shrink-0 hidden md:inline">
          {timeSince(visitor.lastSeenAt)}
        </span>

        {/* Expand */}
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded events */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <Separator />
            <div className="px-4 py-3 space-y-2">
              {/* Visitor details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 mb-0.5">IP</p>
                  <p className="font-mono text-gray-700">{visitor.ip ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">País</p>
                  <p className="text-gray-700">{visitor.country ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Ciudad</p>
                  <p className="text-gray-700">{visitor.city ?? "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Referrer</p>
                  <p className="text-gray-700 truncate">{visitor.referrer ?? "Directo"}</p>
                </div>
              </div>

              {/* User agent */}
              {visitor.userAgent && (
                <p className="text-xs text-gray-400 truncate">
                  <span className="text-gray-500">UA:</span> {visitor.userAgent}
                </p>
              )}

              {/* Events timeline */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Actividad reciente</p>
                {eventsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Cargando…
                  </div>
                ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {eventsQuery.data.map((ev: any) => (
                      <div key={ev.id} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400 w-16 flex-shrink-0">
                          {timeSince(ev.createdAt)}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {ev.event}
                        </Badge>
                        {ev.section && (
                          <span className="text-gray-500">{getSectionLabel(ev.section)}</span>
                        )}
                        {ev.metadata && (
                          <span className="text-gray-400 truncate">
                            {JSON.stringify(ev.metadata).slice(0, 60)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Sin eventos registrados</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 bg-white/70 backdrop-blur-sm border border-white/60"
      style={{ boxShadow: "4px 4px 10px rgba(0,0,0,0.06), -2px -2px 6px rgba(255,255,255,0.8)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, border: `1px solid ${color}40` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Console Page ───────────────────────────────────────────────────────
export default function AdminConsole() {
  const { user, loading } = useAuth();
  const [windowMinutes, setWindowMinutes] = useState(2);

  const statsQuery = trpc.adminConsole.stats.useQuery(undefined, {
    refetchInterval: 15_000,
  });

  const visitorsQuery = trpc.adminConsole.liveVisitors.useQuery(
    { windowMinutes },
    { refetchInterval: 10_000 }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]">
        <div
          className="rounded-2xl p-8 bg-white/80 backdrop-blur-sm border border-white/60 text-center max-w-sm"
          style={{ boxShadow: "6px 6px 14px rgba(0,0,0,0.08), -4px -4px 10px rgba(255,255,255,0.9)" }}
        >
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Eye className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Acceso restringido</h2>
          <p className="text-sm text-gray-500">Esta consola es exclusiva para administradores de IAMET.</p>
        </div>
      </div>
    );
  }

  const visitors = visitorsQuery.data ?? [];
  const stats = statsQuery.data;
  const activeVisitors = visitors.filter((v: any) => {
    const last = new Date(v.lastSeenAt).getTime();
    return Date.now() - last < windowMinutes * 60 * 1000;
  });
  const chatVisitors = visitors.filter((v: any) => v.chatMessages > 0);

  return (
    <div className="min-h-screen bg-[#F0F2F5] pr-[56px]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-500" />
              Consola de Monitoreo
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Visitantes en tiempo real · IAMET Evolución Tecnológica
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Ventana:</span>
            {[2, 5, 10].map((m) => (
              <button
                key={m}
                onClick={() => setWindowMinutes(m)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                  windowMinutes === m
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-white/70 text-gray-600 border border-white/60 hover:bg-white"
                }`}
              >
                {m}m
              </button>
            ))}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 bg-white/70 border-white/60"
              onClick={() => {
                visitorsQuery.refetch();
                statsQuery.refetch();
              }}
            >
              <RefreshCw className={`w-3 h-3 ${visitorsQuery.isFetching ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            icon={Wifi}
            label={`Activos (${windowMinutes}m)`}
            value={activeVisitors.length}
            color="#22c55e"
          />
          <MetricCard
            icon={Bot}
            label="Usando el chat"
            value={chatVisitors.length}
            color="#3b82f6"
          />
          <MetricCard
            icon={Users}
            label="Visitantes hoy"
            value={stats?.total ?? "—"}
            color="#8b5cf6"
          />
          <MetricCard
            icon={MessageSquare}
            label="Con interacción"
            value={stats?.withChat ?? "—"}
            color="#f59e0b"
          />
        </div>

        {/* Visitors Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              Visitantes activos
              <span className="text-xs font-normal text-gray-400">
                (últimos {windowMinutes} min)
              </span>
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              en chat
              <div className="w-2 h-2 rounded-full bg-gray-300 ml-2" />
              navegando
            </div>
          </div>

          {visitorsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando visitantes…</span>
            </div>
          ) : activeVisitors.length === 0 ? (
            <div
              className="rounded-2xl p-8 bg-white/70 backdrop-blur-sm border border-white/60 text-center"
              style={{ boxShadow: "4px 4px 10px rgba(0,0,0,0.06), -2px -2px 6px rgba(255,255,255,0.8)" }}
            >
              <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No hay visitantes activos en este momento</p>
              <p className="text-xs text-gray-400 mt-1">
                Los visitantes aparecerán aquí cuando naveguen el sitio
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {activeVisitors.map((visitor: any) => (
                  <motion.div
                    key={visitor.visitorId}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                  >
                    <VisitorRow visitor={visitor} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* All visitors (last 24h) */}
        {visitors.length > activeVisitors.length && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              Visitantes recientes
              <span className="text-xs font-normal text-gray-400">(fuera de ventana activa)</span>
            </h2>
            <div className="space-y-2 opacity-60">
              {visitors
                .filter((v: any) => !activeVisitors.includes(v))
                .slice(0, 10)
                .map((visitor: any) => (
                  <VisitorRow key={visitor.visitorId} visitor={visitor} />
                ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
