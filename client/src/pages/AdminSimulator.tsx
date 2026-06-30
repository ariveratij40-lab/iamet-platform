import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, Trash2, CheckCircle, XCircle, Loader2, FlaskConical, User, Building2, TrendingUp, AlertTriangle } from "lucide-react";

const SCENARIO_ICONS: Record<string, React.ElementType> = {
  "cold-sme": User,
  "hot-enterprise": Building2,
  "lost-lead": XCircle,
  "reactivated-lead": TrendingUp,
};

const SCENARIO_COLORS: Record<string, string> = {
  "cold-sme": "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
  "hot-enterprise": "border-orange-200 bg-orange-50 dark:bg-orange-950/20",
  "lost-lead": "border-red-200 bg-red-50 dark:bg-red-950/20",
  "reactivated-lead": "border-green-200 bg-green-50 dark:bg-green-950/20",
};

export default function AdminSimulator() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const { data: scenarios } = trpc.simulator.getScenarios.useQuery();

  const runMutation = trpc.simulator.run.useMutation({
    onSuccess: (data) => {
      setResult(data);
      const passed = data.steps.filter((s: any) => s.success).length;
      toast.success(`Simulación completada: ${passed}/${data.steps.length} pasos exitosos`);
    },
    onError: (err) => toast.error(err.message),
  });

  const cleanupMutation = trpc.simulator.cleanup.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deletedLeads} lead(s) de simulación eliminados`);
      setResult(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleRun = () => {
    if (!selectedScenario) return;
    setResult(null);
    runMutation.mutate({ scenario: selectedScenario as any });
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-red-500";
    if (score >= 60) return "text-orange-500";
    if (score >= 40) return "text-yellow-500";
    return "text-gray-500";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FlaskConical className="h-6 w-6" /> Simulador de Lead
          </h1>
          <p className="text-muted-foreground mt-1">
            Ejecuta flujos completos de leads para probar y demostrar la plataforma
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => cleanupMutation.mutate()}
          disabled={cleanupMutation.isPending}
          className="text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Limpiar datos de simulación
        </Button>
      </div>

      {/* Scenario Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(scenarios ?? []).map((scenario) => {
          const Icon = SCENARIO_ICONS[scenario.id] ?? FlaskConical;
          const colorClass = SCENARIO_COLORS[scenario.id] ?? "";
          const isSelected = selectedScenario === scenario.id;
          return (
            <Card
              key={scenario.id}
              className={`cursor-pointer transition-all border-2 ${isSelected ? "border-primary ring-2 ring-primary/20" : colorClass} hover:border-primary/50`}
              onClick={() => setSelectedScenario(scenario.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium">{scenario.label}</div>
                  <div className="text-sm text-muted-foreground">{scenario.steps} pasos</div>
                </div>
                {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Run Button */}
      <Button
        onClick={handleRun}
        disabled={!selectedScenario || runMutation.isPending}
        size="lg"
        className="w-full"
      >
        {runMutation.isPending ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ejecutando simulación...</>
        ) : (
          <><Play className="h-4 w-4 mr-2" /> Ejecutar Simulación</>
        )}
      </Button>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Resultado de la Simulación</span>
                <div className="flex items-center gap-2">
                  {result.leadId && <Badge variant="secondary">Lead ID: {result.leadId}</Badge>}
                  <Badge variant="outline">{result.totalDurationMs}ms</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${scoreColor(result.finalScore)}`}>{result.finalScore}</div>
                  <div className="text-xs text-muted-foreground">Score Final</div>
                </div>
                <div className="flex-1">
                  <p className="text-sm">{result.summary}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Log de Ejecución</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.steps.map((step: any) => (
                  <div key={step.step} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex-shrink-0 mt-0.5">
                      {step.success
                        ? <CheckCircle className="h-4 w-4 text-green-500" />
                        : <XCircle className="h-4 w-4 text-red-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">#{step.step}</span>
                        <span className="font-medium text-sm">{step.action}</span>
                        {step.score !== undefined && (
                          <Badge variant="secondary" className={`text-xs ${scoreColor(step.score)}`}>
                            Score: {step.score}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{step.durationMs}ms</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
                      <p className="text-xs text-foreground/70 mt-0.5 font-mono">{step.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-700 dark:text-yellow-300">
              Los datos de simulación se guardan en la base de datos real con <code>source=simulator</code>.
              Usa el botón "Limpiar datos de simulación" para eliminarlos cuando termines.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
