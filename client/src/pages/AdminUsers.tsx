import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Star,
  Zap,
  Crown,
  UserCheck,
  UserX,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  Building2,
  Mail,
  Phone,
  History,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const PLAN_CONFIG = {
  free: { label: "Gratuito", icon: Star, color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
  pro: { label: "Pro", icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
  enterprise: { label: "Enterprise", icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
};

const STATUS_CONFIG = {
  active: { label: "Activo", color: "text-green-400", bg: "bg-green-400/10", border: "border-green-400/20" },
  inactive: { label: "Inactivo", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20" },
  suspended: { label: "Suspendido", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
};

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

type SubscriberRow = {
  id: number; email: string; name: string; company: string | null; phone: string | null;
  plan: "free" | "pro" | "enterprise"; status: "active" | "inactive" | "suspended";
  createdAt: Date; updatedAt: Date;
};

type ConvRow = {
  id: number; sessionId: string; status: string; summary: string | null;
  detectedIntent: string | null; leadScore: number | null; createdAt: Date;
};

export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSubscriber, setSelectedSubscriber] = useState<SubscriberRow | null>(null);
  const [showConvs, setShowConvs] = useState(false);
  const LIMIT = 15;
  const utils = trpc.useUtils();

  const statsQuery = trpc.adminSubscribers.stats.useQuery(undefined, { refetchInterval: 30000 });
  const listQuery = trpc.adminSubscribers.list.useQuery({
    page, limit: LIMIT,
    search: search || undefined,
    plan: filterPlan !== "all" ? (filterPlan as "free" | "pro" | "enterprise") : undefined,
    status: filterStatus !== "all" ? (filterStatus as "active" | "inactive" | "suspended") : undefined,
  });
  const convsQuery = trpc.adminSubscribers.subscriberConversations.useQuery(
    { subscriberId: selectedSubscriber?.id ?? 0 },
    { enabled: showConvs && !!selectedSubscriber }
  );

  const updateMutation = trpc.adminSubscribers.update.useMutation({
    onSuccess: () => { toast.success("Suscriptor actualizado"); utils.adminSubscribers.list.invalidate(); utils.adminSubscribers.stats.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.adminSubscribers.delete.useMutation({
    onSuccess: () => { toast.success("Suscriptor eliminado"); utils.adminSubscribers.list.invalidate(); utils.adminSubscribers.stats.invalidate(); setSelectedSubscriber(null); },
    onError: (err) => toast.error(err.message),
  });

  const subscribers = (listQuery.data?.subscribers ?? []) as SubscriberRow[];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const stats = statsQuery.data;

  const handleDelete = (sub: SubscriberRow) => {
    if (confirm(`¿Eliminar a ${sub.name} (${sub.email})? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate({ id: sub.id });
    }
  };

  const STAT_CARDS = [
    { label: "Total", value: stats?.total ?? 0, icon: Users, color: "text-white", bg: "bg-white/5" },
    { label: "Activos", value: stats?.active ?? 0, icon: UserCheck, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Gratuitos", value: stats?.free ?? 0, icon: Star, color: "text-slate-400", bg: "bg-slate-400/10" },
    { label: "Pro", value: stats?.pro ?? 0, icon: Zap, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Enterprise", value: stats?.enterprise ?? 0, icon: Crown, color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { label: "Esta semana", value: stats?.newThisWeek ?? 0, icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-400/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Suscriptores</h1>
          <p className="text-slate-400 text-sm">Gestión de usuarios registrados en la plataforma</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl p-4 border border-white/5"
              style={{ background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)", boxShadow: "4px 4px 10px rgba(0,0,0,0.3)" }}>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-400 text-xs mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="rounded-2xl p-5 border border-white/5 mb-6"
        style={{ background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)" }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input placeholder="Buscar por nombre, correo o empresa..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 rounded-xl" />
          </div>
          <Select value={filterPlan} onValueChange={(v) => { setFilterPlan(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white rounded-xl">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1526] border-white/10">
              <SelectItem value="all" className="text-white">Todos los planes</SelectItem>
              <SelectItem value="free" className="text-white">Gratuito</SelectItem>
              <SelectItem value="pro" className="text-white">Pro</SelectItem>
              <SelectItem value="enterprise" className="text-white">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white rounded-xl">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d1526] border-white/10">
              <SelectItem value="all" className="text-white">Todos</SelectItem>
              <SelectItem value="active" className="text-white">Activos</SelectItem>
              <SelectItem value="inactive" className="text-white">Inactivos</SelectItem>
              <SelectItem value="suspended" className="text-white">Suspendidos</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => utils.adminSubscribers.list.invalidate()}
            className="text-slate-400 hover:text-white rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-white/5 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)", boxShadow: "6px 6px 16px rgba(0,0,0,0.35)" }}>
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">{total} suscriptor{total !== 1 ? "es" : ""}</span>
          <span className="text-slate-400 text-xs">Página {page} de {totalPages || 1}</span>
        </div>

        {listQuery.isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Cargando suscriptores...</p>
          </div>
        ) : subscribers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-blue-400/30 mx-auto mb-4" />
            <h4 className="text-white font-medium mb-2">Sin suscriptores</h4>
            <p className="text-slate-400 text-sm">
              {search || filterPlan !== "all" || filterStatus !== "all"
                ? "No se encontraron suscriptores con los filtros aplicados."
                : "Aún no hay usuarios registrados en la plataforma."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {subscribers.map((sub) => {
              const plan = PLAN_CONFIG[sub.plan] || PLAN_CONFIG.free;
              const status = STATUS_CONFIG[sub.status] || STATUS_CONFIG.active;
              const PlanIcon = plan.icon;
              return (
                <div key={sub.id} className="px-6 py-4 hover:bg-white/3 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/40 to-cyan-500/40 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {sub.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm">{sub.name}</span>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${plan.bg} ${plan.color} ${plan.border}`}>
                          <PlanIcon className="w-3 h-3" />{plan.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${status.bg} ${status.color} ${status.border}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{sub.email}</span>
                        {sub.company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{sub.company}</span>}
                        {sub.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{sub.phone}</span>}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(sub.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm"
                        onClick={() => { setSelectedSubscriber(sub); setShowConvs(true); }}
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg text-xs gap-1.5">
                        <History className="w-3.5 h-3.5" />Historial
                      </Button>
                      <Select value={sub.plan} onValueChange={(v) => updateMutation.mutate({ id: sub.id, plan: v as "free" | "pro" | "enterprise" })}>
                        <SelectTrigger className="w-28 h-8 bg-white/5 border-white/10 text-white text-xs rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1526] border-white/10">
                          <SelectItem value="free" className="text-white text-xs">Gratuito</SelectItem>
                          <SelectItem value="pro" className="text-white text-xs">Pro</SelectItem>
                          <SelectItem value="enterprise" className="text-white text-xs">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      {sub.status === "active" ? (
                        <Button variant="ghost" size="sm"
                          onClick={() => updateMutation.mutate({ id: sub.id, status: "suspended" })}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg" title="Suspender">
                          <UserX className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm"
                          onClick={() => updateMutation.mutate({ id: sub.id, status: "active" })}
                          className="text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg" title="Activar">
                          <UserCheck className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(sub)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-slate-400 text-sm">Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} de {total}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="text-slate-400 hover:text-white disabled:opacity-30 rounded-lg"><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="text-slate-400 hover:text-white disabled:opacity-30 rounded-lg"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal historial */}
      <Dialog open={showConvs} onOpenChange={setShowConvs}>
        <DialogContent className="bg-[#0d1526] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <History className="w-5 h-5 text-blue-400" />
              Historial de {selectedSubscriber?.name}
            </DialogTitle>
          </DialogHeader>
          {convsQuery.isLoading ? (
            <div className="py-8 text-center"><div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto" /></div>
          ) : !convsQuery.data || convsQuery.data.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Sin conversaciones registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(convsQuery.data as ConvRow[]).map((conv) => (
                <div key={conv.id} className="p-4 rounded-xl border border-white/5 bg-white/3">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-medium truncate">
                          {conv.summary || conv.detectedIntent || "Conversación con ARIA"}
                        </span>
                        <Badge variant="secondary" className={`text-xs flex-shrink-0 ${conv.status === "active" ? "bg-green-400/10 text-green-400" : "bg-slate-400/10 text-slate-400"}`}>
                          {conv.status === "active" ? "Activa" : conv.status === "completed" ? "Completada" : "Abandonada"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{formatDate(conv.createdAt)}</span>
                        {conv.leadScore !== null && conv.leadScore !== undefined && conv.leadScore > 0 && <span>Score: {conv.leadScore}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
