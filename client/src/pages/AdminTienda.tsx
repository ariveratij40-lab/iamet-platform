import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Package, Upload, X, Image as ImageIcon,
  FileText, ChevronDown, ChevronUp, Search, ToggleLeft, ToggleRight,
  Loader2, CheckCircle, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  shortDesc?: string | null;
  description?: string | null;
  sku?: string | null;
  priceRef?: number | null;
  unit?: string | null;
  imageUrl?: string | null;
  dataSheetUrl?: string | null;
  deliveryTime?: string | null;
  featured: boolean;
  active: boolean;
  specs?: Record<string, string> | null;
  tags?: string[] | null;
  createdAt: Date;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

// ─── Spec Editor ─────────────────────────────────────────────────────────────
function SpecEditor({ specs, onChange }: { specs: Record<string, string>; onChange: (s: Record<string, string>) => void }) {
  const [entries, setEntries] = useState<[string, string][]>(() => Object.entries(specs));

  const update = (idx: number, key: string, val: string) => {
    const next = [...entries];
    next[idx] = [key, val];
    setEntries(next);
    onChange(Object.fromEntries(next.filter(([k]) => k.trim())));
  };

  const add = () => setEntries([...entries, ["", ""]]);
  const remove = (idx: number) => {
    const next = entries.filter((_, i) => i !== idx);
    setEntries(next);
    onChange(Object.fromEntries(next.filter(([k]) => k.trim())));
  };

  return (
    <div className="space-y-2">
      {entries.map(([k, v], i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder="Característica" value={k} onChange={e => update(i, e.target.value, v)} className="flex-1 text-sm" />
          <Input placeholder="Valor" value={v} onChange={e => update(i, k, e.target.value)} className="flex-1 text-sm" />
          <Button variant="ghost" size="icon" onClick={() => remove(i)} className="h-8 w-8 text-red-400 hover:text-red-600">
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full text-xs">
        <Plus className="h-3 w-3 mr-1" /> Agregar especificación
      </Button>
    </div>
  );
}

// ─── File Upload Button ───────────────────────────────────────────────────────
function FileUploadButton({
  label, accept, currentUrl, onUploaded, mimeType
}: {
  label: string; accept: string; currentUrl?: string | null;
  onUploaded: (url: string) => void; mimeType: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.adminStoreV2.uploadFile.useMutation();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ base64, mimeType: file.type || mimeType, fileName: file.name });
        onUploaded(result.url);
        toast.success(`${label} subido correctamente`);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error(`Error al subir ${label.toLowerCase()}`);
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <div className="flex gap-2 items-center">
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading} className="text-xs">
          {uploading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
          {uploading ? "Subiendo..." : `Subir ${label}`}
        </Button>
        {currentUrl && (
          <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Ver archivo
          </a>
        )}
      </div>
      {currentUrl && mimeType.startsWith("image") && (
        <img src={currentUrl} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-white/10" />
      )}
    </div>
  );
}

// ─── Product Form ─────────────────────────────────────────────────────────────
function ProductForm({
  product, categories, onSave, onClose
}: {
  product?: Product | null; categories: Category[];
  onSave: () => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: product?.id,
    categoryId: product?.categoryId ?? (categories[0]?.id ?? 0),
    name: product?.name ?? "",
    shortDesc: product?.shortDesc ?? "",
    description: product?.description ?? "",
    sku: product?.sku ?? "",
    priceRef: product?.priceRef?.toString() ?? "",
    unit: product?.unit ?? "pieza",
    imageUrl: product?.imageUrl ?? "",
    dataSheetUrl: product?.dataSheetUrl ?? "",
    deliveryTime: product?.deliveryTime ?? "",
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    specs: (product?.specs as Record<string, string>) ?? {},
    tags: (product?.tags as string[] ?? []).join(", "),
  });

  const upsert = trpc.adminStoreV2.upsertProduct.useMutation({
    onSuccess: () => { toast.success(product ? "Producto actualizado" : "Producto creado"); onSave(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.categoryId) { toast.error("Nombre y categoría son obligatorios"); return; }
    upsert.mutate({
      ...form,
      id: form.id,
      priceRef: form.priceRef ? parseFloat(form.priceRef) : undefined,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      specs: form.specs,
    } as any);
  };

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      <Tabs defaultValue="basic">
        <TabsList className="w-full">
          <TabsTrigger value="basic" className="flex-1 text-xs">Información básica</TabsTrigger>
          <TabsTrigger value="specs" className="flex-1 text-xs">Especificaciones</TabsTrigger>
          <TabsTrigger value="media" className="flex-1 text-xs">Imagen y ficha</TabsTrigger>
        </TabsList>

        {/* ── Tab: Básico ── */}
        <TabsContent value="basic" className="space-y-3 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-slate-400 mb-1 block">Nombre del producto *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Cámara IP Domo 4MP" />
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">Categoría *</Label>
              <Select value={form.categoryId.toString()} onValueChange={v => setForm(f => ({ ...f, categoryId: parseInt(v) }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">SKU</Label>
              <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="CAM-DOMO-4MP" />
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">Precio de referencia (MXN)</Label>
              <Input type="number" value={form.priceRef} onChange={e => setForm(f => ({ ...f, priceRef: e.target.value }))} placeholder="2800" />
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">Unidad</Label>
              <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pieza / kit / licencia" />
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">Tiempo de entrega</Label>
              <Input value={form.deliveryTime} onChange={e => setForm(f => ({ ...f, deliveryTime: e.target.value }))} placeholder="3-5 días hábiles" />
            </div>
            <div>
              <Label className="text-xs text-slate-400 mb-1 block">Etiquetas (separadas por coma)</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="cámara, IP, PoE" />
            </div>
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Descripción corta</Label>
            <Input value={form.shortDesc} onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))} placeholder="Resumen en una línea" />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">Descripción completa</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Descripción detallada del producto..." />
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} />
              <Label className="text-xs">Destacado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label className="text-xs">Activo en tienda</Label>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Specs ── */}
        <TabsContent value="specs" className="pt-3">
          <p className="text-xs text-slate-400 mb-3">Agrega las especificaciones técnicas del producto (clave → valor).</p>
          <SpecEditor specs={form.specs} onChange={specs => setForm(f => ({ ...f, specs }))} />
        </TabsContent>

        {/* ── Tab: Media ── */}
        <TabsContent value="media" className="space-y-4 pt-3">
          <div>
            <Label className="text-xs text-slate-400 mb-2 block flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Imagen del producto
            </Label>
            <FileUploadButton
              label="Imagen"
              accept="image/*"
              mimeType="image/jpeg"
              currentUrl={form.imageUrl}
              onUploaded={url => setForm(f => ({ ...f, imageUrl: url }))}
            />
            <p className="text-xs text-slate-500 mt-1">También puedes pegar una URL directamente:</p>
            <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="mt-1 text-xs" />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-2 block flex items-center gap-1">
              <FileText className="h-3 w-3" /> Ficha técnica (PDF)
            </Label>
            <FileUploadButton
              label="Ficha técnica PDF"
              accept=".pdf,application/pdf"
              mimeType="application/pdf"
              currentUrl={form.dataSheetUrl}
              onUploaded={url => setForm(f => ({ ...f, dataSheetUrl: url }))}
            />
            <p className="text-xs text-slate-500 mt-1">También puedes pegar una URL directamente:</p>
            <Input value={form.dataSheetUrl} onChange={e => setForm(f => ({ ...f, dataSheetUrl: e.target.value }))} placeholder="https://..." className="mt-1 text-xs" />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-2 border-t border-white/10">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
        <Button onClick={handleSubmit} disabled={upsert.isPending} className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black">
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {product ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminTienda() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | undefined>();
  const [editProduct, setEditProduct] = useState<Product | null | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "visitors">("products");

  const utils = trpc.useUtils();

  const { data: categoriesData } = trpc.store.getCategories.useQuery();
  const { data: productsData, isLoading } = trpc.adminStoreV2.getProducts.useQuery(
    { page, limit: 20, categoryId: selectedCat },
    { refetchInterval: 30000 }
  );
  const { data: visitors } = trpc.adminStoreV2.getVisitors.useQuery(undefined, { enabled: activeTab === "visitors" });

  const toggleActive = trpc.adminStoreV2.toggleActive.useMutation({
    onSuccess: () => { utils.adminStoreV2.getProducts.invalidate(); toast.success("Estado actualizado"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteProduct = trpc.adminStoreV2.deleteProduct.useMutation({
    onSuccess: () => { utils.adminStoreV2.getProducts.invalidate(); setDeleteConfirm(null); toast.success("Producto eliminado"); },
    onError: (e) => toast.error(e.message),
  });

  const categories: Category[] = (categoriesData as any) ?? [];
  const products: Product[] = (productsData as any)?.products ?? [];
  const total: number = (productsData as any)?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const filtered = search
    ? products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase()))
    : products;

  const getCatName = (id: number) => categories.find(c => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-cyan-400" /> Gestión de Tienda
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">{total} productos en el catálogo</p>
        </div>
        <Button onClick={() => setEditProduct(null)} className="bg-cyan-500 hover:bg-cyan-600 text-black text-sm">
          <Plus className="h-4 w-4 mr-1" /> Nuevo producto
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
        {(["products", "visitors"] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === t ? "bg-cyan-500 text-black" : "text-slate-400 hover:text-white"}`}
          >
            {t === "products" ? "Productos" : "Visitantes registrados"}
          </button>
        ))}
      </div>

      {activeTab === "products" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o SKU..." className="pl-9 text-sm" />
            </div>
            <Select value={selectedCat?.toString() ?? "all"} onValueChange={v => setSelectedCat(v === "all" ? undefined : parseInt(v))}>
              <SelectTrigger className="w-44 text-sm"><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 text-xs">
                    <th className="text-left px-4 py-3 font-medium">Producto</th>
                    <th className="text-left px-4 py-3 font-medium">Categoría</th>
                    <th className="text-left px-4 py-3 font-medium">SKU</th>
                    <th className="text-right px-4 py-3 font-medium">Precio ref.</th>
                    <th className="text-left px-4 py-3 font-medium">Entrega</th>
                    <th className="text-center px-4 py-3 font-medium">Estado</th>
                    <th className="text-center px-4 py-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Cargando productos...
                    </td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      {search ? "No se encontraron productos" : "No hay productos. Haz clic en \"Nuevo producto\" para comenzar."}
                    </td></tr>
                  ) : filtered.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="h-10 w-10 object-cover rounded-lg border border-white/10 flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                              <Package className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white text-sm leading-tight">{p.name}</p>
                            <p className="text-xs text-slate-400 line-clamp-1">{p.shortDesc}</p>
                            <div className="flex gap-1 mt-0.5">
                              {p.featured && <Badge className="text-[10px] px-1 py-0 bg-amber-500/20 text-amber-400 border-amber-500/30">Destacado</Badge>}
                              {p.dataSheetUrl && <Badge className="text-[10px] px-1 py-0 bg-blue-500/20 text-blue-400 border-blue-500/30"><FileText className="h-2.5 w-2.5 mr-0.5" />Ficha</Badge>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">{getCatName(p.categoryId)}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{p.sku ?? "—"}</td>
                      <td className="px-4 py-3 text-right text-cyan-400 font-medium text-sm">
                        {p.priceRef ? `$${p.priceRef.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{p.deliveryTime ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleActive.mutate({ id: p.id })}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${p.active ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-slate-500/20 text-slate-400 hover:bg-slate-500/30"}`}
                        >
                          {p.active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                          {p.active ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          <Button variant="ghost" size="icon" onClick={() => setEditProduct(p)} className="h-7 w-7 text-slate-400 hover:text-cyan-400">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(p.id)} className="h-7 w-7 text-slate-400 hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-xs text-slate-400">
                <span>Página {page} de {totalPages} ({total} productos)</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-7 text-xs">Anterior</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-7 text-xs">Siguiente</Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "visitors" && (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs">
                  <th className="text-left px-4 py-3 font-medium">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Teléfono</th>
                  <th className="text-center px-4 py-3 font-medium">Verificado</th>
                  <th className="text-left px-4 py-3 font-medium">Registrado</th>
                </tr>
              </thead>
              <tbody>
                {!visitors ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
                ) : (visitors as any[]).length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-slate-400">No hay visitantes registrados aún</td></tr>
                ) : (visitors as any[]).map((v: any) => (
                  <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{v.name}</td>
                    <td className="px-4 py-3 text-slate-300">{v.email}</td>
                    <td className="px-4 py-3 text-slate-400">{v.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {v.verifiedAt ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle className="h-3 w-3" /> Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                          <AlertCircle className="h-3 w-3" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(v.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={editProduct !== undefined} onOpenChange={open => !open && setEditProduct(undefined)}>
        <DialogContent className="max-w-2xl bg-[#0f1729] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Package className="h-5 w-5 text-cyan-400" />
              {editProduct ? "Editar producto" : "Nuevo producto"}
            </DialogTitle>
          </DialogHeader>
          {editProduct !== undefined && (
            <ProductForm
              product={editProduct}
              categories={categories}
              onSave={() => { setEditProduct(undefined); utils.adminStoreV2.getProducts.invalidate(); }}
              onClose={() => setEditProduct(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm bg-[#0f1729] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">¿Eliminar producto?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">Esta acción no se puede deshacer. El producto será eliminado permanentemente del catálogo.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancelar</Button>
            <Button
              onClick={() => deleteConfirm && deleteProduct.mutate({ id: deleteConfirm })}
              disabled={deleteProduct.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteProduct.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
