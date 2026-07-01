import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, Clock, User, Mail, Phone, Building2, CheckCircle2, XCircle, RefreshCw, Loader2, ChevronDown, ChevronUp, Link2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30", icon: <Clock size={12} /> },
  confirmed: { label: "Confirmada", color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: <CheckCircle2 size={12} /> },
  cancelled: { label: "Cancelada", color: "bg-red-500/20 text-red-300 border-red-500/30", icon: <XCircle size={12} /> },
  completed: { label: "Completada", color: "bg-green-500/20 text-green-300 border-green-500/30", icon: <CheckCircle2 size={12} /> },
};

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function AdminReuiones() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingUrl, setEditingUrl] = useState<Record<number, string>>({});

  const { data: meetings, isLoading, refetch } = trpc.adminCalendar.getMeetings.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter, limit: 100 },
    { enabled: !!user && user.role === "admin" }
  );

  const updateMeetingUrl = trpc.adminCalendar.updateMeetingUrl.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Link de reunión guardado");
      refetch();
      setEditingUrl(prev => { const n = { ...prev }; delete n[vars.id]; return n; });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStatus = trpc.adminCalendar.updateMeetingStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060d18" }}>
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/admin/login";
    return null;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#060d18" }}>
        <XCircle size={48} className="text-red-400" />
        <p className="text-white text-lg">Acceso restringido a administradores.</p>
        <Button onClick={() => navigate("/admin")} variant="outline">Ir al Dashboard</Button>
      </div>
    );
  }

  const meetingList = (meetings as any[]) ?? [];
  const counts = {
    all: meetingList.length,
    confirmed: meetingList.filter(m => m.status === "confirmed").length,
    pending: meetingList.filter(m => m.status === "pending").length,
    completed: meetingList.filter(m => m.status === "completed").length,
    cancelled: meetingList.filter(m => m.status === "cancelled").length,
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar size={24} className="text-blue-400" />
              Smart Calendar — Reuniones
            </h1>
            <p className="text-slate-400 text-sm mt-1">Gestión de reuniones agendadas con ingenieros IAMET</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2" style={{ borderColor: "rgba(100,181,246,0.3)", color: "#90caf9" }}>
            <RefreshCw size={14} />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { key: "all", label: "Total", count: counts.all },
            { key: "confirmed", label: "Confirmadas", count: counts.confirmed },
            { key: "pending", label: "Pendientes", count: counts.pending },
            { key: "completed", label: "Completadas", count: counts.completed },
            { key: "cancelled", label: "Canceladas", count: counts.cancelled },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className="rounded-xl p-3 text-center transition-all duration-200"
              style={{
                background: statusFilter === key ? "rgba(21,101,192,0.3)" : "rgba(17,34,64,0.8)",
                border: `1px solid ${statusFilter === key ? "rgba(100,181,246,0.5)" : "rgba(30,58,95,0.8)"}`,
                boxShadow: statusFilter === key ? "0 0 12px rgba(21,101,192,0.2)" : "none",
              }}
            >
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 h-9 text-sm" style={{ background: "rgba(17,34,64,0.8)", border: "1px solid rgba(30,58,95,0.8)", color: "white" }}>
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent style={{ background: "#0d1b2a", border: "1px solid rgba(30,58,95,0.8)" }}>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-slate-400 text-sm">{meetingList.length} reunión(es)</span>
        </div>

        {/* Meeting List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-blue-400">
            <Loader2 size={24} className="animate-spin" />
            <span>Cargando reuniones...</span>
          </div>
        ) : meetingList.length === 0 ? (
          <div className="text-center py-16 rounded-xl" style={{ background: "rgba(17,34,64,0.5)", border: "1px solid rgba(30,58,95,0.8)" }}>
            <Calendar size={40} className="text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No hay reuniones {statusFilter !== "all" ? `con estado "${STATUS_LABELS[statusFilter]?.label}"` : ""}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetingList.map((meeting: any) => {
              const statusInfo = STATUS_LABELS[meeting.status] ?? STATUS_LABELS.pending;
              const isExpanded = expandedId === meeting.id;
              return (
                <div
                  key={meeting.id}
                  className="rounded-xl overflow-hidden transition-all duration-200"
                  style={{ background: "rgba(17,34,64,0.8)", border: "1px solid rgba(30,58,95,0.8)" }}
                >
                  {/* Row header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                  >
                    {/* Date/Time */}
                    <div className="flex-shrink-0 text-center w-16">
                      <p className="text-blue-400 text-xs font-medium">{meeting.date ? new Date(meeting.date + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short" }).toUpperCase() : "—"}</p>
                      <p className="text-white text-lg font-bold leading-tight">{meeting.date ? new Date(meeting.date + "T12:00:00").getDate() : "—"}</p>
                      <p className="text-slate-400 text-xs">{meeting.startTime ?? "—"}</p>
                    </div>

                    {/* Client info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">{meeting.clientName}</p>
                      <p className="text-slate-400 text-sm truncate">{meeting.clientEmail}{meeting.company ? ` · ${meeting.company}` : ""}</p>
                      <p className="text-blue-300 text-xs truncate mt-0.5">{meeting.topic}</p>
                    </div>

                    {/* Engineer */}
                    <div className="hidden md:block flex-shrink-0 text-right">
                      <p className="text-slate-300 text-sm">{meeting.engineerName}</p>
                      <p className="text-slate-500 text-xs">{meeting.startTime} – {meeting.endTime}</p>
                    </div>

                    {/* Status + expand */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(30,58,95,0.5)" }}>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Fecha y hora</p>
                          <p className="text-white text-sm">{formatDate(meeting.date)}</p>
                          <p className="text-blue-300 text-sm">{meeting.startTime} – {meeting.endTime} hrs</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Ingeniero</p>
                          <p className="text-white text-sm">{meeting.engineerName}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Contacto</p>
                          <p className="text-white text-sm">{meeting.clientName}</p>
                          <p className="text-slate-400 text-xs">{meeting.clientEmail}</p>
                          {meeting.clientPhone && <p className="text-slate-400 text-xs">{meeting.clientPhone}</p>}
                          {meeting.company && <p className="text-slate-400 text-xs">{meeting.company}</p>}
                        </div>
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Tema</p>
                          <p className="text-white text-sm">{meeting.topic}</p>
                        </div>
                        {meeting.specialistId && (
                          <div>
                            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Especialista IA</p>
                            <p className="text-blue-300 text-sm">{meeting.specialistId}</p>
                          </div>
                        )}

                        {/* meetingUrl editable */}
                        <div className="col-span-2 md:col-span-3">
                          <p className="text-slate-500 text-xs uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Link2 size={11} /> Link de Reunión Virtual
                          </p>
                          <div className="flex gap-2">
                            <Input
                              value={editingUrl[meeting.id] ?? meeting.meetingUrl ?? ""}
                              onChange={(e) => setEditingUrl(prev => ({ ...prev, [meeting.id]: e.target.value }))}
                              placeholder="https://meet.google.com/xxx-xxxx-xxx"
                              className="flex-1 h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updateMeetingUrl.isPending}
                              onClick={() => updateMeetingUrl.mutate({ id: meeting.id, meetingUrl: editingUrl[meeting.id] ?? meeting.meetingUrl ?? "" })}
                              className="h-8 px-3 border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
                            >
                              <Save size={13} className="mr-1" /> Guardar
                            </Button>
                            {(meeting.meetingUrl || editingUrl[meeting.id]) && (
                              <a
                                href={editingUrl[meeting.id] ?? meeting.meetingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 h-8 rounded-md text-xs font-medium bg-green-500/10 text-green-300 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                              >
                                <Link2 size={12} /> Abrir
                              </a>
                            )}
                          </div>
                          <p className="text-slate-600 text-xs mt-1">Este link se incluirá automáticamente en los recordatorios de 24h, 2h y 30min.</p>
                        </div>
                      </div>

                      {/* Status actions */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: "rgba(30,58,95,0.5)" }}>
                        <span className="text-slate-400 text-xs">Cambiar estado:</span>
                        {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
                          <button
                            key={s}
                            disabled={meeting.status === s || updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: meeting.id, status: s })}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-40 ${STATUS_LABELS[s]?.color}`}
                            style={{ border: `1px solid` }}
                          >
                            {STATUS_LABELS[s]?.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
