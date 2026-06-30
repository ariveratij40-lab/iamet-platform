import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  BookOpen, Upload, Search, Trash2, RefreshCw, FileText,
  File, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight
} from "lucide-react";

const CATEGORIES = [
  "Infraestructura", "CCTV", "Control de Acceso", "RFID", "Redes",
  "Energía", "Software", "IA", "Data Centers", "Industria 4.0",
  "Panduit", "Cisco", "Hikvision", "HID", "Zebra", "General"
];

function statusBadge(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    processing: { label: "Procesando", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    ready: { label: "Listo", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    error: { label: "Error", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  };
  const s = map[status] ?? { label: status, color: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
  return <Badge className={`text-xs border ${s.color}`}>{s.label}</Badge>;
}

function fileIcon(mimeType: string) {
  if (mimeType?.includes("pdf")) return <FileText className="w-4 h-4 text-red-400" />;
  if (mimeType?.includes("word") || mimeType?.includes("docx")) return <FileText className="w-4 h-4 text-blue-400" />;
  if (mimeType?.includes("sheet") || mimeType?.includes("xlsx")) return <FileText className="w-4 h-4 text-emerald-400" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

function fmtSize(bytes: number) {
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes > 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────

function UploadDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [manufacturer, setManufacturer] = useState("");
  const [tags, setTags] = useState("");
  const [uploading, setUploading] = useState(false);

  const upload = trpc.knowledge.uploadDocument.useMutation({
    onSuccess: () => {
      toast.success("Documento subido y en procesamiento");
      onSuccess();
      onClose();
      setFile(null); setTitle(""); setCategory("General"); setManufacturer(""); setTags("");
    },
    onError: (e) => toast.error(`Error al subir: ${e.message}`),
  });

  async function handleSubmit() {
    if (!file || !title) { toast.error("Selecciona un archivo y escribe un título"); return; }
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      await upload.mutateAsync({
        title,
        category: category || undefined,
        manufacturer: manufacturer || undefined,
        tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileBase64: base64,
      });
    } catch {
      // handled by onError
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111827] border-[#1e3a6e] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Subir Documento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* File picker */}
          <div
            className="border-2 border-dashed border-[#1e3a6e] rounded-lg p-6 text-center cursor-pointer hover:border-[#0066cc] transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                {fileIcon(file.type)}
                <span className="text-sm text-white">{file.name}</span>
                <span className="text-xs text-slate-500">{fmtSize(file.size)}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">PDF, Word, Excel, PowerPoint, Markdown, CSV</p>
                <p className="text-xs text-slate-600 mt-1">Clic para seleccionar</p>
              </>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Título *</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Catálogo Panduit 2026"
              className="bg-[#0d1b3e] border-[#1e3a6e] text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Categoría</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#0d1b3e] border-[#1e3a6e] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1b3e] border-[#1e3a6e]">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-white hover:bg-[#1e3a6e]">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Fabricante</label>
              <Input
                value={manufacturer}
                onChange={e => setManufacturer(e.target.value)}
                placeholder="Ej: Panduit"
                className="bg-[#0d1b3e] border-[#1e3a6e] text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Etiquetas (separadas por coma)</label>
            <Input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="cableado, cobre, TIA-568"
              className="bg-[#0d1b3e] border-[#1e3a6e] text-white"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 border-[#1e3a6e] text-slate-400" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-[#0066cc] hover:bg-[#0055aa] text-white"
              onClick={handleSubmit}
              disabled={uploading || !file || !title}
            >
              {uploading ? "Subiendo..." : "Subir documento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Document Row ─────────────────────────────────────────────────────────────

function DocumentRow({ doc, onDelete, onReprocess }: {
  doc: {
    id: number; title: string; category: string; mimeType: string;
    fileSize: number; status: string; chunkCount: number;
    manufacturer?: string | null; tags?: string[] | null;
    summary?: string | null; createdAt: string | Date;
  };
  onDelete: (id: number) => void;
  onReprocess: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#1e3a6e] last:border-0">
      <div
        className="flex items-center gap-3 px-4 py-3 hover:bg-[#0d1b3e] cursor-pointer transition-colors"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        {fileIcon(doc.mimeType)}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{doc.title}</p>
          <p className="text-xs text-slate-500">{doc.category}{doc.manufacturer ? ` · ${doc.manufacturer}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          {statusBadge(doc.status)}
          <span className="text-xs text-slate-500">{doc.chunkCount} chunks</span>
          <span className="text-xs text-slate-600">{fmtSize(doc.fileSize)}</span>
          <span className="text-xs text-slate-600">{new Date(doc.createdAt).toLocaleDateString("es-MX")}</span>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <Button
              variant="ghost" size="icon"
              className="w-6 h-6 text-slate-500 hover:text-[#00d4ff]"
              onClick={() => onReprocess(doc.id)}
              title="Reprocesar"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="w-6 h-6 text-slate-500 hover:text-red-400"
              onClick={() => onDelete(doc.id)}
              title="Eliminar"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
      {open && doc.summary && (
        <div className="mx-4 mb-3 p-3 bg-[#0a1628] rounded-lg">
          <p className="text-xs text-slate-400 mb-1">Resumen IA</p>
          <p className="text-xs text-slate-300">{doc.summary}</p>
          {doc.tags && doc.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {doc.tags.map(t => (
                <Badge key={t} variant="outline" className="text-xs border-[#1e3a6e] text-slate-400">{t}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AdminKnowledge() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { data, isLoading, refetch } = trpc.knowledge.listDocuments.useQuery({
    status: undefined,
  });

  const deleteDoc = trpc.knowledge.deleteDocument.useMutation({
    onSuccess: () => { toast.success("Documento eliminado"); refetch(); },
    onError: (e: { message: string }) => toast.error(`Error: ${e.message}`),
  });

  // No hay procedure de reprocess ni search aún — usamos deleteDocument como fallback
  const reprocessMock = { mutate: (_id: number) => toast.info("Reprocesamiento no disponible aún") };

  const searchQuery = { data: null as null | { results: { document: unknown }[] }, isLoading: false };

  const docs = Array.isArray(data) ? data : [];
  const filtered = search.length > 2
    ? docs.filter((d: { title: string; category: string; manufacturer?: string | null }) =>
        d.title?.toLowerCase().includes(search.toLowerCase()) ||
        d.category?.toLowerCase().includes(search.toLowerCase()) ||
        d.manufacturer?.toLowerCase().includes(search.toLowerCase())
      )
    : (category !== "all" ? docs.filter((d: { category: string }) => d.category === category) : docs);

  const stats = {
    total: docs.length,
    ready: docs.filter((d: { status: string }) => d.status === "ready").length,
    processing: docs.filter((d: { status: string }) => d.status === "processing").length,
    error: docs.filter((d: { status: string }) => d.status === "error").length,
    chunks: docs.reduce((sum: number, d: { chunkCount: number }) => sum + (d.chunkCount ?? 0), 0),
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Base de Conocimiento</h1>
            <p className="text-sm text-slate-400">Enterprise RAG — Documentos técnicos y comerciales</p>
          </div>
        </div>
        <Button
          className="bg-[#0066cc] hover:bg-[#0055aa] text-white"
          onClick={() => setUploadOpen(true)}
        >
          <Upload className="w-4 h-4 mr-2" />
          Subir documento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: FileText, color: "text-[#00d4ff]" },
          { label: "Listos", value: stats.ready, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Procesando", value: stats.processing, icon: Clock, color: "text-yellow-400" },
          { label: "Errores", value: stats.error, icon: AlertCircle, color: "text-red-400" },
          { label: "Chunks RAG", value: stats.chunks, icon: Search, color: "text-purple-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-[#0d1b3e] border-[#1e3a6e]">
            <CardContent className="p-3 flex items-center gap-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en la base de conocimiento..."
            className="pl-9 bg-[#0d1b3e] border-[#1e3a6e] text-white"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44 bg-[#0d1b3e] border-[#1e3a6e] text-white">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent className="bg-[#0d1b3e] border-[#1e3a6e]">
            <SelectItem value="all" className="text-white hover:bg-[#1e3a6e]">Todas</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c} className="text-white hover:bg-[#1e3a6e]">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de documentos */}
      <Card className="bg-[#111827] border-[#1e3a6e]">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-base">
            {search.length > 2 ? `Resultados de búsqueda: "${search}"` : "Documentos"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="text-slate-500 text-sm p-4">Cargando documentos...</p>}
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin documentos aún.</p>
              <p className="text-xs mt-1">Sube PDFs, Word, Excel o Markdown para alimentar el RAG.</p>
            </div>
          )}
          {filtered.map((doc: {
            id: number; title: string; category: string; mimeType: string;
            fileSize: number; status: string; chunkCount: number;
            manufacturer?: string | null; tags?: string[] | null;
            summary?: string | null; createdAt: string | Date;
          }) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              onDelete={(id) => deleteDoc.mutate({ id })}
              onReprocess={(id) => reprocessMock.mutate(id)}
            />
          ))}
        </CardContent>
      </Card>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
