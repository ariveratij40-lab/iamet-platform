import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Send, Ban, RefreshCw, Eye, Clock, CheckCircle2, XCircle,
  AlertTriangle, Filter, Mail, User, Building2, Layers,
  ChevronDown, ChevronUp, Calendar, BarChart3
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: "Pendiente",  color: "bg-yellow-500/15 text-yellow-700 border-yellow-300", icon: <Clock className="w-3 h-3" /> },
  sent:     { label: "Enviado",    color: "bg-green-500/15 text-green-700 border-green-300",    icon: <CheckCircle2 className="w-3 h-3" /> },
  failed:   { label: "Fallido",    color: "bg-red-500/15 text-red-700 border-red-300",          icon: <XCircle className="w-3 h-3" /> },
  skipped:  { label: "Cancelado",  color: "bg-gray-400/15 text-gray-600 border-gray-300",       icon: <Ban className="w-3 h-3" /> },
};

const TYPE_LABELS: Record<string, string> = {
  "24h": "24h — Check-in",
  "48h": "48h — Caso de uso",
  "72h": "72h — Urgencia",
  "7d":  "7 días — Reactivación",
};

const VERTICAL_LABELS: Record<string, string> = {
  cctv: "CCTV", "control-acceso": "Control de Acceso", rfid: "RFID",
  "data-center": "Data Center", cableado: "Cableado", redes: "Redes",
  "wifi-industrial": "WiFi Industrial", "ia-empresarial": "IA Empresarial",
  software: "Software", "servicios-administrados": "Servicios Administrados",
  "audio-voceo": "Audio y Voceo", "salas-juntas": "Salas de Juntas",
  automatizacion: "Automatización", fabricantes: "Fabricantes",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-bold ${color}`}>
      {score}
    </span>
  );
}

function formatDate(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

function nextSendLabel(scheduledAt: number, status: string) {
  if (status !== "pending") return null;
  const diff = scheduledAt - Date.now();
  if (diff <= 0) return "Listo para enviar";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `En ${Math.floor(h / 24)}d ${h % 24}h`;
  return `En ${h}h ${m}m`;
}

export default function AdminSeguimientos() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verticalFilter, setVerticalFilter] = useState<string>("all");
  const [leadSearch, setLeadSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [previewFollowup, setPreviewFollowup] = useState<any | null>(null);

  const { data: followups = [], isLoading, refetch } = trpc.adminFollowups.list.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter, limit: 200 },
    { refetchInterval: 30000 }
  );
  const { data: stats } = trpc.adminFollowups.getStats.useQuery(undefined, { refetchInterval: 30000 });

  const cancelMutation = trpc.adminFollowups.cancel.useMutation({
    onSuccess: () => { toast.success("Seguimiento cancelado"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const sendNowMutation = trpc.adminFollowups.sendNow.useMutation({
    onSuccess: () => { toast.success("Email enviado correctamente"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const retryMutation = trpc.adminFollowups.retry.useMutation({
    onSuccess: () => { toast.success("Seguimiento reprogramado para el próximo ciclo"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return followups.filter(f => {
      if (verticalFilter !== "all" && f.vertical !== verticalFilter) return false;
      if (leadSearch.trim()) {
        const q = leadSearch.toLowerCase();
        if (!f.leadName.toLowerCase().includes(q) && !(f.company ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [followups, verticalFilter, leadSearch]);

  if (!user) {
    window.location.href = "/admin/login";
    return null;
  }
  if ((user as any).role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Acceso restringido a administradores.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Cola de Seguimientos</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Automatización IA de seguimiento post-lead — secuencias 24h / 48h / 72h / 7d
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { key: "total",   label: "Total",      color: "text-foreground",   bg: "bg-muted/40" },
            { key: "pending", label: "Pendientes", color: "text-yellow-700",   bg: "bg-yellow-50 dark:bg-yellow-900/20" },
            { key: "sent",    label: "Enviados",   color: "text-green-700",    bg: "bg-green-50 dark:bg-green-900/20" },
            { key: "failed",  label: "Fallidos",   color: "text-red-700",      bg: "bg-red-50 dark:bg-red-900/20" },
            { key: "skipped", label: "Cancelados", color: "text-muted-foreground", bg: "bg-muted/40" },
          ].map(({ key, label, color, bg }) => (
            <Card key={key} className={`${bg} border-0 shadow-sm`}>
              <CardContent className="p-4 text-center">
                <div className={`text-3xl font-bold ${color}`}>{(stats as any)?.[key] ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
                <SelectItem value="skipped">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verticalFilter} onValueChange={setVerticalFilter}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Vertical" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las verticales</SelectItem>
                {Object.entries(VERTICAL_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Buscar lead o empresa..."
              value={leadSearch}
              onChange={e => setLeadSearch(e.target.value)}
              className="w-64"
            />

            <div className="flex items-center text-sm text-muted-foreground ml-auto">
              <BarChart3 className="w-4 h-4 mr-1" />
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lead</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Secuencia</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Programado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Enviado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Score IA</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Cargando seguimientos...
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No hay seguimientos con los filtros seleccionados.
                    </td>
                  </tr>
                )}
                {filtered.map(f => {
                  const isExpanded = expandedId === f.id;
                  const st = STATUS_LABELS[f.status] ?? STATUS_LABELS.pending;
                  const nextLabel = nextSendLabel(f.scheduledAt, f.status);
                  return (
                    <>
                      <tr
                        key={f.id}
                        className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : f.id)}
                      >
                        {/* Lead */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                              {f.leadName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">{f.leadName}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                {f.company && <><Building2 className="w-3 h-3" />{f.company}</>}
                                {f.vertical && <><Layers className="w-3 h-3 ml-1" />{VERTICAL_LABELS[f.vertical] ?? f.vertical}</>}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Secuencia */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            {TYPE_LABELS[f.type] ?? f.type}
                          </span>
                        </td>
                        {/* Estado */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${st.color}`}>
                            {st.icon} {st.label}
                          </span>
                          {nextLabel && (
                            <div className="text-xs text-muted-foreground mt-0.5">{nextLabel}</div>
                          )}
                        </td>
                        {/* Programado */}
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(f.scheduledAt)}
                          </div>
                        </td>
                        {/* Enviado */}
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {f.sentAt ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-3 h-3" />
                              {formatDate(f.sentAt)}
                            </div>
                          ) : "—"}
                        </td>
                        {/* Score */}
                        <td className="px-4 py-3">
                          <ScoreBadge score={f.leadScore} />
                        </td>
                        {/* Acciones */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {/* Preview email */}
                            {f.emailBody && (
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 px-2 text-xs gap-1"
                                onClick={() => setPreviewFollowup(f)}
                              >
                                <Eye className="w-3 h-3" /> Ver
                              </Button>
                            )}
                            {/* Enviar ahora */}
                            {["pending", "failed"].includes(f.status) && (
                              <Button
                                size="sm" variant="outline"
                                className="h-7 px-2 text-xs gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                                onClick={() => sendNowMutation.mutate({ id: f.id })}
                                disabled={sendNowMutation.isPending}
                              >
                                <Send className="w-3 h-3" /> Enviar
                              </Button>
                            )}
                            {/* Reintentar fallidos */}
                            {f.status === "failed" && (
                              <Button
                                size="sm" variant="outline"
                                className="h-7 px-2 text-xs gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                                onClick={() => retryMutation.mutate({ id: f.id })}
                                disabled={retryMutation.isPending}
                              >
                                <RefreshCw className="w-3 h-3" /> Reintentar
                              </Button>
                            )}
                            {/* Cancelar */}
                            {f.status === "pending" && (
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 px-2 text-xs gap-1 text-red-600 hover:bg-red-50"
                                onClick={() => cancelMutation.mutate({ id: f.id })}
                                disabled={cancelMutation.isPending}
                              >
                                <Ban className="w-3 h-3" /> Cancelar
                              </Button>
                            )}
                            <button className="ml-1 text-muted-foreground">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded row — Auditoría */}
                      {isExpanded && (
                        <tr key={`${f.id}-detail`} className="bg-muted/20 border-b">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="font-semibold mb-2 flex items-center gap-1 text-muted-foreground">
                                  <User className="w-3 h-3" /> Datos del Lead
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div><span className="text-muted-foreground">Nombre:</span> {f.leadName}</div>
                                  <div><span className="text-muted-foreground">Email:</span> {f.leadEmail}</div>
                                  {f.company && <div><span className="text-muted-foreground">Empresa:</span> {f.company}</div>}
                                  {f.vertical && <div><span className="text-muted-foreground">Vertical:</span> {VERTICAL_LABELS[f.vertical] ?? f.vertical}</div>}
                                  <div><span className="text-muted-foreground">Lead ID:</span> #{f.leadId}</div>
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold mb-2 flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3 h-3" /> Auditoría de Tiempos
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div><span className="text-muted-foreground">Creado:</span> {formatDate(f.createdAt)}</div>
                                  <div><span className="text-muted-foreground">Programado:</span> {formatDate(f.scheduledAt)}</div>
                                  <div><span className="text-muted-foreground">Enviado:</span> {f.sentAt ? formatDate(f.sentAt) : "—"}</div>
                                  <div><span className="text-muted-foreground">Secuencia:</span> {TYPE_LABELS[f.type] ?? f.type}</div>
                                  <div><span className="text-muted-foreground">Estado final:</span> {STATUS_LABELS[f.status]?.label ?? f.status}</div>
                                </div>
                              </div>
                              <div>
                                <div className="font-semibold mb-2 flex items-center gap-1 text-muted-foreground">
                                  <Mail className="w-3 h-3" /> Asunto del Email
                                </div>
                                <div className="text-xs bg-background border rounded p-2 text-muted-foreground">
                                  {f.emailSubject ?? "Sin asunto generado aún"}
                                </div>
                                {f.emailBody && (
                                  <Button
                                    size="sm" variant="outline"
                                    className="mt-2 h-7 text-xs gap-1 w-full"
                                    onClick={() => setPreviewFollowup(f)}
                                  >
                                    <Eye className="w-3 h-3" /> Ver email completo
                                  </Button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={!!previewFollowup} onOpenChange={() => setPreviewFollowup(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Preview del Email — {previewFollowup?.leadName}
            </DialogTitle>
          </DialogHeader>
          {previewFollowup && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 rounded p-3">
                  <div className="text-xs text-muted-foreground mb-1">Para</div>
                  <div className="font-medium">{previewFollowup.leadEmail}</div>
                </div>
                <div className="bg-muted/40 rounded p-3">
                  <div className="text-xs text-muted-foreground mb-1">Asunto</div>
                  <div className="font-medium">{previewFollowup.emailSubject ?? "—"}</div>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/30 px-3 py-2 text-xs text-muted-foreground font-medium border-b">
                  Contenido del email (generado por IA)
                </div>
                <div
                  className="p-4 text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewFollowup.emailBody ?? "" }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                {["pending", "failed"].includes(previewFollowup.status) && (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      sendNowMutation.mutate({ id: previewFollowup.id });
                      setPreviewFollowup(null);
                    }}
                    disabled={sendNowMutation.isPending}
                  >
                    <Send className="w-4 h-4" /> Enviar ahora
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setPreviewFollowup(null)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
