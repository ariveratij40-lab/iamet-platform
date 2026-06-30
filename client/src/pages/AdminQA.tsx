import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Play, CheckCircle, XCircle, Loader2, TestTube2, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface QAResult {
  testId: string;
  name: string;
  passed: boolean;
  score: number;
  actualTools: string[];
  expectedTools: string[];
  actualIntent: string;
  agentResponse: string;
  durationMs: number;
  error?: string;
  runAt: number;
}

export default function AdminQA() {
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [localResults, setLocalResults] = useState<Record<string, QAResult>>({});

  const { data: tests } = trpc.agentQA.listTests.useQuery();
  const { data: latestResults, refetch: refetchResults } = trpc.agentQA.getLatestResults.useQuery();

  const runTestMutation = trpc.agentQA.runTest.useMutation({
    onSuccess: (data) => {
      const result = data as QAResult;
      setLocalResults(prev => ({ ...prev, [result.testId]: result }));
      setRunningTest(null);
      if (result.passed) {
        toast.success(`✅ ${result.name} — PASÓ (${result.score}/100)`);
      } else {
        toast.error(`❌ ${result.name} — FALLÓ (${result.score}/100)`);
      }
      refetchResults();
    },
    onError: (err) => {
      setRunningTest(null);
      toast.error(err.message);
    },
  });

  const runSuiteMutation = trpc.agentQA.runSuite.useMutation({
    onSuccess: (data) => {
      const suiteResult = data as { results: QAResult[]; passed: number; totalTests: number };
      const results = suiteResult.results;
      const newLocal: Record<string, QAResult> = {};
      results.forEach(r => { newLocal[r.testId] = r; });
      setLocalResults(newLocal);
      toast.success(`Suite completada: ${suiteResult.passed}/${suiteResult.totalTests} pruebas pasaron`);
      refetchResults();
    },
    onError: (err) => toast.error(err.message),
  });

  const getResult = (testId: string): QAResult | undefined => {
    return localResults[testId] ?? (latestResults as QAResult[] | undefined)?.find(r => r.testId === testId);
  };

  const allResults = Object.values(localResults).length > 0 ? Object.values(localResults) : (latestResults as QAResult[] ?? []);
  const passedCount = allResults.filter(r => r.passed).length;
  const totalRun = allResults.length;
  const avgScore = totalRun > 0 ? Math.round(allResults.reduce((s, r) => s + r.score, 0) / totalRun) : 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TestTube2 className="h-6 w-6" /> QA del Agente
          </h1>
          <p className="text-muted-foreground mt-1">
            Valida que el agente SDR responde correctamente a diferentes escenarios comerciales
          </p>
        </div>
        <Button
          onClick={() => runSuiteMutation.mutate({})}
          disabled={runSuiteMutation.isPending}
        >
          {runSuiteMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ejecutando suite...</>
          ) : (
            <><Play className="h-4 w-4 mr-2" /> Ejecutar Suite Completa</>
          )}
        </Button>
      </div>

      {/* Summary */}
      {totalRun > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{passedCount}</div>
              <div className="text-xs text-muted-foreground">Pruebas Pasadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{totalRun - passedCount}</div>
              <div className="text-xs text-muted-foreground">Pruebas Fallidas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold">{avgScore}</div>
              <div className="text-xs text-muted-foreground">Score Promedio</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-3">
        {(tests ?? []).map((test) => {
          const result = getResult(test.id);
          const isRunning = runningTest === test.id;
          const isExpanded = expandedTest === test.id;

          return (
            <Card key={test.id} className={result ? (result.passed ? "border-green-200" : "border-red-200") : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {isRunning ? (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    ) : result ? (
                      result.passed
                        ? <CheckCircle className="h-5 w-5 text-green-500" />
                        : <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                  </div>

                  {/* Test info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{test.name}</span>
                      <Badge variant="outline" className="text-xs">{test.scenario}</Badge>
                      {result && (
                        <Badge
                          variant={result.passed ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {result.score}/100
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{test.userMessage}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {result && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setExpandedTest(isExpanded ? null : test.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={isRunning || runSuiteMutation.isPending}
                      onClick={() => {
                        setRunningTest(test.id);
                        runTestMutation.mutate({ testId: test.id });
                      }}
                    >
                      {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && result && (
                  <div className="mt-4 space-y-3 border-t pt-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="font-medium text-xs text-muted-foreground mb-1">HERRAMIENTAS ESPERADAS</div>
                        <div className="flex flex-wrap gap-1">
                          {result.expectedTools.map(t => (
                            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-xs text-muted-foreground mb-1">HERRAMIENTAS USADAS</div>
                        <div className="flex flex-wrap gap-1">
                          {result.actualTools.map(t => {
                            const expected = result.expectedTools.includes(t);
                            return (
                              <Badge key={t} variant={expected ? "default" : "outline"} className="text-xs">{t}</Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-xs text-muted-foreground mb-1">RESPUESTA DEL AGENTE</div>
                      <p className="text-xs bg-muted/30 rounded p-2 max-h-24 overflow-y-auto">{result.agentResponse}</p>
                    </div>
                    {result.error && (
                      <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded p-2">{result.error}</div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Duración: {result.durationMs}ms</span>
                      <span>Intent detectado: {result.actualIntent}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
