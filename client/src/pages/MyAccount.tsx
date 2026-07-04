import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useSubscriberAuth } from "@/hooks/useSubscriberAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  History,
  LogOut,
  User,
  Building2,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Star,
  Zap,
  Crown,
  ArrowLeft,
  Clock,
  Target,
} from "lucide-react";

const PLAN_CONFIG = {
  free: {
    label: "Gratuito",
    icon: Star,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/20",
  },
  pro: {
    label: "Pro",
    icon: Zap,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  enterprise: {
    label: "Enterprise",
    icon: Crown,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
  },
};

const STATUS_CONFIG = {
  active: { label: "Activa", color: "text-green-400", bg: "bg-green-400/10" },
  inactive: { label: "Inactiva", color: "text-slate-400", bg: "bg-slate-400/10" },
  suspended: { label: "Suspendida", color: "text-red-400", bg: "bg-red-400/10" },
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatRelative(date: Date | string) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return formatDate(date);
}

export default function MyAccount() {
  const [, navigate] = useLocation();
  const { subscriber, isAuthenticated, isLoading, logout } = useSubscriberAuth();
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const conversationsQuery = trpc.subscribers.myConversations.useQuery(
    { limit: LIMIT, offset: (page - 1) * LIMIT },
    { enabled: isAuthenticated }
  );

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
        <div
          className="max-w-md w-full text-center p-8 rounded-2xl border border-white/5"
          style={{
            background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)",
            boxShadow: "8px 8px 20px rgba(0,0,0,0.4)",
          }}
        >
          <div className="w-16 h-16 rounded-full bg-blue-400/10 flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">
            Inicia sesión para ver tu cuenta
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Necesitas iniciar sesión para acceder a tu historial de
            conversaciones y perfil.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/login-suscriptor")}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 rounded-xl"
            >
              Iniciar sesión
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/registro")}
              className="w-full text-slate-400 hover:text-white"
            >
              Crear cuenta gratuita
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const plan = PLAN_CONFIG[subscriber!.plan] || PLAN_CONFIG.free;
  const status = STATUS_CONFIG[subscriber!.status] || STATUS_CONFIG.active;
  const PlanIcon = plan.icon;

  const convs = conversationsQuery.data?.conversations ?? [];
  const total = conversationsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                Inicio
              </button>
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white font-medium text-sm">Mi cuenta</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna izquierda: Perfil */}
        <div className="space-y-6">
          {/* Card de perfil */}
          <div
            className="rounded-2xl p-6 border border-white/5"
            style={{
              background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)",
              boxShadow:
                "6px 6px 16px rgba(0,0,0,0.35), -3px -3px 8px rgba(30,58,138,0.06)",
            }}
          >
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-500/20">
                {subscriber!.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg">
                  {subscriber!.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border ${plan.bg} ${plan.color} ${plan.border}`}
                  >
                    <PlanIcon className="w-3 h-3" />
                    {plan.label}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-slate-300 truncate">{subscriber!.email}</span>
              </div>
              {subscriber!.company && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-300">{subscriber!.company}</span>
                </div>
              )}
              {subscriber!.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-slate-300">{subscriber!.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-slate-400">
                  Miembro desde {formatDate(subscriber!.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div
            className="rounded-2xl p-6 border border-white/5"
            style={{
              background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)",
              boxShadow:
                "6px 6px 16px rgba(0,0,0,0.35), -3px -3px 8px rgba(30,58,138,0.06)",
            }}
          >
            <h3 className="text-white font-semibold mb-4 text-sm">
              Resumen de actividad
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-cyan-400">{total}</div>
                <div className="text-xs text-slate-400 mt-1">Conversaciones</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/5">
                <div className="text-2xl font-bold text-blue-400">
                  {plan.label}
                </div>
                <div className="text-xs text-slate-400 mt-1">Plan actual</div>
              </div>
            </div>
          </div>

          {/* CTA: Volver al chat */}
          <Link href="/">
            <div
              className="rounded-2xl p-5 border border-cyan-500/20 cursor-pointer transition-all duration-200 hover:border-cyan-500/40"
              style={{
                background:
                  "linear-gradient(135deg, rgba(6,182,212,0.05) 0%, rgba(59,130,246,0.05) 100%)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">
                    Consultar a ARIA
                  </div>
                  <div className="text-slate-400 text-xs">
                    Iniciar nueva conversación
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 ml-auto" />
              </div>
            </div>
          </Link>
        </div>

        {/* Columna derecha: Historial */}
        <div className="lg:col-span-2">
          <div
            className="rounded-2xl border border-white/5 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)",
              boxShadow:
                "6px 6px 16px rgba(0,0,0,0.35), -3px -3px 8px rgba(30,58,138,0.06)",
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-400/10 flex items-center justify-center">
                  <History className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    Historial de conversaciones
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {total} conversaciones guardadas
                  </p>
                </div>
              </div>
            </div>

            {/* Lista */}
            <div className="divide-y divide-white/5">
              {conversationsQuery.isLoading ? (
                <div className="p-12 text-center">
                  <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">
                    Cargando conversaciones...
                  </p>
                </div>
              ) : convs.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-400/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-blue-400/50" />
                  </div>
                  <h4 className="text-white font-medium mb-2">
                    Sin conversaciones aún
                  </h4>
                  <p className="text-slate-400 text-sm mb-6">
                    Inicia una conversación con ARIA para que quede guardada en
                    tu historial.
                  </p>
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl">
                      Consultar a ARIA
                    </Button>
                  </Link>
                </div>
              ) : (
                convs.map((conv: { id: number; sessionId: string; status: string; summary: string | null; detectedIntent: string | null; leadScore: number | null; createdAt: Date; updatedAt: Date }) => (
                  <div
                    key={conv.id}
                    className="p-5 hover:bg-white/3 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-400/15 transition-colors">
                        <MessageSquare className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium text-sm truncate">
                            {conv.summary ||
                              conv.detectedIntent ||
                              "Conversación con ARIA"}
                          </span>
                          <Badge
                            variant="secondary"
                            className={`text-xs flex-shrink-0 ${
                              conv.status === "active"
                                ? "bg-green-400/10 text-green-400 border-green-400/20"
                                : conv.status === "completed"
                                ? "bg-blue-400/10 text-blue-400 border-blue-400/20"
                                : "bg-slate-400/10 text-slate-400 border-slate-400/20"
                            }`}
                          >
                            {conv.status === "active"
                              ? "Activa"
                              : conv.status === "completed"
                              ? "Completada"
                              : "Abandonada"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelative(conv.createdAt)}
                          </span>
                          {conv.leadScore !== null &&
                            conv.leadScore !== undefined &&
                            conv.leadScore > 0 && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                Score: {conv.leadScore}
                              </span>
                            )}
                          {conv.detectedIntent && (
                            <span className="text-slate-500 truncate">
                              {conv.detectedIntent}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-slate-400 text-sm">
                  Página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="text-slate-400 hover:text-white disabled:opacity-30"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
