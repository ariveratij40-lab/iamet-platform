import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, FileText, CheckCircle, XCircle, Loader2, Trash2, Package } from "lucide-react";

interface FileEntry {
  file: File;
  category: string;
  status: "pending" | "ready";
}

interface BatchResult {
  filename: string;
  status: "pending" | "processing" | "done" | "error";
  chunksCreated?: number;
  error?: string;
}

export default function AdminKnowledgeBatch() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [defaultCategory, setDefaultCategory] = useState("general");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: categories } = trpc.batchKnowledge.getCategories.useQuery();

  const startBatch = trpc.batchKnowledge.startBatch.useMutation({
    onSuccess: (data) => {
      setBatchId(data.batchId);
      setResults(files.map(f => ({ filename: f.file.name, status: "pending" })));
      // Poll for progress
      pollRef.current = setInterval(async () => {
        // Progress is tracked via getBatchStatus
      }, 1500);
      toast.success(`Procesando ${data.totalFiles} archivos...`);
    },
    onError: (err) => toast.error(`Error: ${err.message}`),
  });

  const { data: batchStatus } = trpc.batchKnowledge.getBatchStatus.useQuery(
    { batchId: batchId ?? "" },
    {
      enabled: !!batchId,
      refetchInterval: batchId ? 2000 : false,
    }
  );

  // React to batchStatus changes
  if (batchStatus) {
    const newResults = batchStatus.results as BatchResult[];
    if (JSON.stringify(newResults) !== JSON.stringify(results)) {
      setResults(newResults);
    }
    if (batchStatus.completedAt && batchId) {
      setBatchId(null);
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  }, [defaultCategory]);

  const addFiles = (newFiles: File[]) => {
    const supported = newFiles.filter(f => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      return ["pdf", "docx", "doc", "xlsx", "xls", "txt", "md", "csv", "pptx", "zip"].includes(ext);
    });
    setFiles(prev => [
      ...prev,
      ...supported.map(f => ({ file: f, category: defaultCategory, status: "ready" as const })),
    ]);
    if (supported.length < newFiles.length) {
      toast.warning(`${newFiles.length - supported.length} archivo(s) ignorados (formato no soportado)`);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileCategory = (index: number, category: string) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, category } : f));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    const fileInputs = await Promise.all(files.map(async (entry) => {
      const buffer = await entry.file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const isZip = entry.file.name.endsWith(".zip");
      return {
        filename: entry.file.name,
        mimeType: isZip ? "application/zip" : entry.file.type || "application/octet-stream",
        base64Content: base64,
        metadata: {
          title: entry.file.name.replace(/\.[^.]+$/, ""),
          category: entry.category,
          tags: [entry.category],
        },
      };
    }));

    const isZip = files.length === 1 && files[0].file.name.endsWith(".zip");
    startBatch.mutate({ files: fileInputs, isZip, defaultCategory });
  };

  const isProcessing = !!batchId;
  const processedCount = results.filter(r => r.status === "done" || r.status === "error").length;
  const progress = results.length > 0 ? Math.round((processedCount / results.length) * 100) : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Carga Masiva de Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Sube múltiples documentos al RAG en un solo proceso. Soporta PDF, Word, Excel, Markdown, CSV y ZIP.
        </p>
      </div>

      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Arrastra archivos aquí o haz clic para seleccionar</p>
          <p className="text-sm text-muted-foreground mt-1">PDF, Word, Excel, Markdown, CSV, PowerPoint, ZIP</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.md,.csv,.pptx,.zip"
            className="hidden"
            onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
          />
        </CardContent>
      </Card>

      {/* Default Category */}
      {files.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Categoría por defecto:</span>
          <Select value={defaultCategory} onValueChange={setDefaultCategory}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(categories ?? []).map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{files.length} archivo(s) seleccionado(s)</span>
              <Button variant="ghost" size="sm" onClick={() => setFiles([])} disabled={isProcessing}>
                <Trash2 className="h-4 w-4 mr-1" /> Limpiar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {files.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm flex-1 truncate">{entry.file.name}</span>
                <span className="text-xs text-muted-foreground">{(entry.file.size / 1024).toFixed(0)} KB</span>
                <Select value={entry.category} onValueChange={(v) => updateFileCategory(i, v)} disabled={isProcessing}>
                  <SelectTrigger className="w-40 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? []).map(c => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)} disabled={isProcessing}>
                  <XCircle className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
              Progreso del Batch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground text-center">{processedCount} / {results.length} archivos procesados</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {r.status === "done" && <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />}
                  {r.status === "error" && <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />}
                  {r.status === "processing" && <Loader2 className="h-3 w-3 animate-spin text-blue-500 flex-shrink-0" />}
                  {r.status === "pending" && <div className="h-3 w-3 rounded-full bg-muted flex-shrink-0" />}
                  <span className="flex-1 truncate">{r.filename}</span>
                  {r.status === "done" && <Badge variant="secondary" className="text-xs">{r.chunksCreated} chunks</Badge>}
                  {r.status === "error" && <span className="text-xs text-red-500 truncate max-w-32">{r.error}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={files.length === 0 || isProcessing || startBatch.isPending}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...</>
        ) : (
          <><Package className="h-4 w-4 mr-2" /> Iniciar Carga Masiva ({files.length} archivos)</>
        )}
      </Button>
    </div>
  );
}
