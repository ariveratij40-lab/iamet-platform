import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Activity, Database, Mail, Brain, Search, Shield, Loader2 } from "lucide-react";

const SERVICE_ICONS: Record<string, React.ElementType> = {
  database: Database,
  email: Mail,
  llm: Brain,
  rag: Search,
  auth: Shield,
  storage: Activity,
};

const STATUS_COLORS: Record<string, string> = {
  ok: "text-green-500",
  degraded: "text-yellow-500",
  down: "text-red-500",
  unknown: "text-gray-400",
};

const STATUS_BG: Record<string, string> = {
  ok: "border-green-200 bg-green-50 dark:bg-green-950/20",
  degraded: "border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20",
  down: "border-red-200 bg-red-50 dark:bg-red-950/20",
  unknown: "border-border",
};

export default function AdminHealth() {
  const { data: healthStatus, refetch, isFetching } = trpc.health.getStatus.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const { data: errorSummary } = trpc.health.getErrorSummary.useQuery();

  const handleRefresh = () => {
    refetch();
    toast.info("Verificando servicios...");
  };

  const services = healthStatus ? Object.entries(healthStatus as Record<string, any>) : [];
  const allOk = services.every(([, s]) => s.status === "ok");
  const hasDown = services.some(([, s]) => s.status === "down");
  const hasDegraded = services.some(([, s]) => s.status === "degraded");

  const overallStatus = hasDown ? "down" : hasDegraded ? "degraded" : allOk ? "ok" : "unknown";
  const overallLabel = { ok: "Todos los servicios operativos", degraded: "Degradación detectada", down: "Servicio caído", unknown: "Verificando..." }[overallStatus];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6" /> Monitor de Salud
          </h1>
          <p className="text-muted-foreground mt-1">Estado en tiempo real de todos los servicios de la plataforma</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Overall Status Banner */}
      <Card className={`border-2 ${STATUS_BG[overallStatus]}`}>
        <CardContent className="p-4 flex items-center gap-4">
          {overallStatus === "ok" && <CheckCircle className="h-8 w-8 text-green-500" />}
          {overallStatus === "degraded" && <AlertTriangle className="h-8 w-8 text-yellow-500" />}
          {overallStatus === "down" && <XCircle className="h-8 w-8 text-red-500" />}
          {overallStatus === "unknown" && <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />}
          <div>
            <div className="font-semibold text-lg">{overallLabel}</div>
            <div className="text-sm text-muted-foreground">
              {services.length} servicios monitoreados · Actualización automática cada 30s
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(([name, service]) => {
          const Icon = SERVICE_ICONS[name] ?? Activity;
          const status = service.status ?? "unknown";
          return (
            <Card key={name} className={`border ${STATUS_BG[status]}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${STATUS_COLORS[status]}`} />
                    <span className="font-medium capitalize">{name}</span>
                  </div>
                  <Badge
                    variant={status === "ok" ? "default" : status === "degraded" ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {status.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  {service.latencyMs !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Latencia</span>
                      <span className={service.latencyMs > 1000 ? "text-yellow-500" : "text-foreground"}>
                        {service.latencyMs}ms
                      </span>
                    </div>
                  )}
                  {service.message && (
                    <p className="text-xs text-muted-foreground mt-1">{service.message}</p>
                  )}
                  {service.details && typeof service.details === "object" && (
                    Object.entries(service.details as Record<string, any>).slice(0, 3).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                        <span>{String(v)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Error Summary */}
      {errorSummary && (errorSummary as any[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Resumen de Errores Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(errorSummary as any[]).map((err, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <div>
                      <span className="font-medium capitalize">{err.service}</span>
                      <span className="text-muted-foreground ml-2">{err.message}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">{err.count}x</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(err.lastSeen).toLocaleTimeString("es-MX")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tareas Programadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: "Briefing Ejecutivo Diario", schedule: "07:00 AM CST", status: "ok" },
              { name: "Seguimientos de Leads", schedule: "Cada hora", status: "ok" },
              { name: "Recordatorios de Reuniones", schedule: "Cada 30 min", status: "ok" },
            ].map((task) => (
              <div key={task.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{task.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{task.schedule}</span>
                  <Badge variant="secondary" className="text-xs">Activo</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
