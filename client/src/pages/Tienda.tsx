import { useState, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useStoreAuth } from "@/hooks/useStoreAuth";
import { StoreAuthModal } from "@/components/StoreAuthModal";
import { trpc } from "@/lib/trpc";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart, Search, Shield, Network, Monitor, Cable, Code2, Zap, Wrench,
  Plus, Minus, Trash2, Package, CheckCircle2, ChevronRight, X, Tag, Star
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Product = {
  id: number;
  name: string;
  slug: string;
  shortDesc: string | null;
  description: string | null;
  sku: string | null;
  priceRef: number | null;
  unit: string | null;
  imageUrl: string | null;
  featured: boolean;
  categoryName: string;
  categorySlug: string;
  tags: unknown;
};

type CartItem = {
  product: Product;
  quantity: number;
  notes: string;
};

// ─── Category Icons ───────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  seguridad: <Shield className="w-5 h-5" />,
  redes: <Network className="w-5 h-5" />,
  computo: <Monitor className="w-5 h-5" />,
  cableado: <Cable className="w-5 h-5" />,
  software: <Code2 className="w-5 h-5" />,
  energia: <Zap className="w-5 h-5" />,
  servicios: <Wrench className="w-5 h-5" />,
};

// ─── Product Image Map ────────────────────────────────────────────────────────
const PRODUCT_IMAGES: Record<string, string> = {
  "camara-ip-domo-4mp": "/manus-storage/cam-domo_6caf2a1b.jpg",
  "camara-ptz-4k-ia": "/manus-storage/cam-ptz_7e725eb4.png",
  "switch-24p-poe-plus": "/manus-storage/switch-poe_ebb39972.jpg",
  "access-point-wifi6-techo": "/manus-storage/access-point_f9dffcf6.png",
  "laptop-empresarial-i7-16gb": "/manus-storage/laptop-biz_2d8ed067.jpg",
  "ups-online-3kva-torre": "/manus-storage/ups-tower_cf48b2ce.jpg",
  "rack-abierto-42u": "/manus-storage/rack-42u_362067cf.jpg",
  "switch-administrable-24p": "/manus-storage/switch-rack_99807981.jpg",
};

function getProductImage(slug: string, categorySlug: string): string {
  if (PRODUCT_IMAGES[slug]) return PRODUCT_IMAGES[slug];
  const fallbacks: Record<string, string> = {
    seguridad: "/manus-storage/cam-domo_6caf2a1b.jpg",
    redes: "/manus-storage/switch-rack_99807981.jpg",
    computo: "/manus-storage/laptop-biz_2d8ed067.jpg",
    cableado: "/manus-storage/rack-42u_362067cf.jpg",
    energia: "/manus-storage/ups-tower_cf48b2ce.jpg",
    software: "/manus-storage/laptop-biz_2d8ed067.jpg",
    servicios: "/manus-storage/switch-rack_99807981.jpg",
  };
  return fallbacks[categorySlug] ?? "/manus-storage/cam-domo_6caf2a1b.jpg";
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, inCart }: { product: Product; onAdd: (p: Product) => void; inCart: boolean }) {
  const [, navigate] = useLocation();
  const imgSrc = getProductImage(product.slug, product.categorySlug);

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "linear-gradient(145deg, #1e2535, #161c2a)",
        boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347",
      }}
    >
      {product.featured && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-amber-500/90 text-amber-950 text-xs font-semibold gap-1">
            <Star className="w-3 h-3" /> Destacado
          </Badge>
        </div>
      )}
      {/* Image — click navega al detalle */}
      <div
        className="relative h-44 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden cursor-pointer"
        onClick={() => navigate(`/tienda/${product.slug}`)}
      >
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400/30 bg-cyan-400/5">
            {product.categoryName}
          </Badge>
          {product.sku && (
            <span className="text-xs text-slate-500 font-mono">{product.sku}</span>
          )}
        </div>
        <h3
          className="text-sm font-semibold text-white leading-snug line-clamp-2 cursor-pointer hover:text-cyan-400 transition-colors"
          onClick={() => navigate(`/tienda/${product.slug}`)}
        >{product.name}</h3>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 flex-1">{product.shortDesc}</p>
        <div className="flex items-end justify-between mt-2 pt-2 border-t border-white/5">
          <div>
            {product.priceRef ? (
              <div>
                <span className="text-xs text-slate-500">Precio ref.</span>
                <div className="text-base font-bold text-cyan-400">
                  ${product.priceRef.toLocaleString("es-MX")} MXN
                </div>
                {product.unit && <span className="text-xs text-slate-500">por {product.unit}</span>}
              </div>
            ) : (
              <span className="text-sm text-slate-400 italic">Precio a consultar</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onAdd(product)}
            disabled={inCart}
            className={`gap-1 text-xs transition-all ${
              inCart
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                : "bg-cyan-600 hover:bg-cyan-500 text-white"
            }`}
            style={!inCart ? { boxShadow: "0 0 12px rgba(6,182,212,0.3)" } : {}}
          >
            {inCart ? <><CheckCircle2 className="w-3.5 h-3.5" /> En carrito</> : <><Plus className="w-3.5 h-3.5" /> Agregar</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────
function CartItemRow({ item, onQty, onRemove, onNotes }: {
  item: CartItem;
  onQty: (delta: number) => void;
  onRemove: () => void;
  onNotes: (v: string) => void;
}) {
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight line-clamp-2">{item.product.name}</p>
          {item.product.sku && <p className="text-xs text-slate-500 font-mono">{item.product.sku}</p>}
        </div>
        <button onClick={onRemove} className="text-slate-500 hover:text-red-400 transition-colors mt-0.5">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <button onClick={() => onQty(-1)} className="px-2 py-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <Minus className="w-3 h-3" />
          </button>
          <span className="px-2 text-sm font-semibold text-white min-w-[2rem] text-center">{item.quantity}</span>
          <button onClick={() => onQty(1)} className="px-2 py-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {item.product.priceRef && (
          <span className="text-xs text-cyan-400 font-medium">
            ${(item.product.priceRef * item.quantity).toLocaleString("es-MX")} MXN
          </span>
        )}
      </div>
      <Input
        placeholder="Notas (especificaciones, versión...)"
        value={item.notes}
        onChange={(e) => onNotes(e.target.value)}
        className="h-7 text-xs bg-white/5 border-white/10 text-slate-300 placeholder:text-slate-600"
      />
    </div>
  );
}

// ─── PDF Generator ─────────────────────────────────────────────────────────────────────────────────
type QuoteSnapshot = {
  refCode: string;
  items: CartItem[];
  contact: { visitorName: string; company: string; email: string; phone: string; notes: string };
};

function downloadQuotePdf(snapshot: QuoteSnapshot) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  // Header
  doc.setFillColor(15, 22, 35);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(6, 182, 212);
  doc.text("IAMET", margin, y + 6);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Evolución Tecnológica", margin, y + 12);
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 255);
  doc.text("SOLICITUD DE COTIZACIÓN", pageW - margin, y + 6, { align: "right" });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Ref: " + snapshot.refCode, pageW - margin, y + 12, { align: "right" });
  doc.text("Fecha: " + new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }), pageW - margin, y + 17, { align: "right" });
  y = 48;

  // Datos de contacto
  doc.setFillColor(30, 37, 53);
  doc.roundedRect(margin, y, pageW - margin * 2, 36, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(6, 182, 212);
  doc.text("DATOS DE CONTACTO", margin + 4, y + 7);
  const c = snapshot.contact;
  const col1 = margin + 4;
  const col2 = pageW / 2 + 4;
  doc.setFontSize(8.5);
  doc.setTextColor(220, 230, 245);
  doc.setFont("helvetica", "bold"); doc.text("Nombre:", col1, y + 15);
  doc.setFont("helvetica", "normal"); doc.text(c.visitorName || "—", col1 + 18, y + 15);
  doc.setFont("helvetica", "bold"); doc.text("Empresa:", col2, y + 15);
  doc.setFont("helvetica", "normal"); doc.text(c.company || "—", col2 + 19, y + 15);
  doc.setFont("helvetica", "bold"); doc.text("Email:", col1, y + 23);
  doc.setFont("helvetica", "normal"); doc.text(c.email || "—", col1 + 18, y + 23);
  doc.setFont("helvetica", "bold"); doc.text("Teléfono:", col2, y + 23);
  doc.setFont("helvetica", "normal"); doc.text(c.phone || "—", col2 + 19, y + 23);
  if (c.notes) {
    doc.setFont("helvetica", "bold"); doc.text("Notas:", col1, y + 31);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(c.notes, pageW - margin * 2 - 22), col1 + 18, y + 31);
  }
  y += 44;

  // Tabla de productos
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(6, 182, 212);
  doc.text("PRODUCTOS SOLICITADOS", margin, y);
  y += 5;
  doc.setFillColor(6, 182, 212);
  doc.rect(margin, y, pageW - margin * 2, 7, "F");
  doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(15, 22, 35);
  doc.text("#", margin + 2, y + 5);
  doc.text("Producto", margin + 10, y + 5);
  doc.text("SKU", pageW - margin - 60, y + 5);
  doc.text("Cant.", pageW - margin - 32, y + 5);
  doc.text("Precio Ref.", pageW - margin - 18, y + 5, { align: "right" });
  y += 7;
  snapshot.items.forEach((item, idx) => {
    const rowH = 8;
    if (idx % 2 === 0) { doc.setFillColor(22, 28, 42); doc.rect(margin, y, pageW - margin * 2, rowH, "F"); }
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(220, 230, 245);
    doc.text(String(idx + 1), margin + 2, y + 5.5);
    doc.text(doc.splitTextToSize(item.product.name, 80)[0], margin + 10, y + 5.5);
    doc.setTextColor(148, 163, 184);
    doc.text(item.product.sku ?? "—", pageW - margin - 60, y + 5.5);
    doc.setTextColor(220, 230, 245);
    doc.text(String(item.quantity), pageW - margin - 32, y + 5.5);
    const price = item.product.priceRef
      ? "$" + (item.product.priceRef * item.quantity).toLocaleString("es-MX") + " MXN"
      : "A consultar";
    doc.text(price, pageW - margin - 18, y + 5.5, { align: "right" });
    y += rowH;
  });
  const total = snapshot.items.reduce((s, i) => s + (i.product.priceRef ?? 0) * i.quantity, 0);
  if (total > 0) {
    y += 2;
    doc.setDrawColor(6, 182, 212); doc.setLineWidth(0.3); doc.line(margin, y, pageW - margin, y); y += 5;
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(6, 182, 212);
    doc.text("Total referencial:", pageW - margin - 50, y);
    doc.text("$" + total.toLocaleString("es-MX") + " MXN", pageW - margin - 18, y, { align: "right" });
    y += 8;
  }

  // Nota de validez
  y += 4;
  doc.setFillColor(22, 28, 42);
  doc.roundedRect(margin, y, pageW - margin * 2, 18, 3, 3, "F");
  doc.setFont("helvetica", "italic"); doc.setFontSize(7.5); doc.setTextColor(148, 163, 184);
  const nota = "Los precios indicados son de referencia y están sujetos a cambio. La cotización formal será enviada por nuestro equipo comercial en un plazo máximo de 24 horas hábiles. Este documento no constituye una factura ni un contrato de compra-venta.";
  doc.text(doc.splitTextToSize(nota, pageW - margin * 2 - 8), margin + 4, y + 6);

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setDrawColor(30, 37, 53); doc.setLineWidth(0.5); doc.line(margin, footerY - 3, pageW - margin, footerY - 3);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(100, 120, 150);
  doc.text("IAMET Evolución Tecnológica • www.iamet.com.mx", margin, footerY);
  doc.text("Ref: " + snapshot.refCode, pageW - margin, footerY, { align: "right" });

  doc.save("IAMET-Cotizacion-" + snapshot.refCode + ".pdf");
}

// ─── Quote Form ─────────────────────────────────────────────────────────────────────────────────
function QuoteForm({ cart, onClose, onSuccess }: {
  cart: CartItem[];
  onClose: () => void;
  onSuccess: (refCode: string, contact: QuoteSnapshot["contact"]) => void;
}) {
  const [form, setForm] = useState({ visitorName: "", company: "", email: "", phone: "", notes: "" });
  const submitMutation = trpc.store.submitQuote.useMutation({
    onSuccess: (data) => onSuccess(data.refCode, form),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      ...form,
      items: cart.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        productSku: i.product.sku ?? undefined,
        quantity: i.quantity,
        notes: i.notes || undefined,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Nombre *</Label>
          <Input required value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
            className="bg-white/5 border-white/10 text-white" placeholder="Tu nombre" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Empresa</Label>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="bg-white/5 border-white/10 text-white" placeholder="Nombre de empresa" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Email *</Label>
          <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="bg-white/5 border-white/10 text-white" placeholder="correo@empresa.com" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-slate-400">Teléfono</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="bg-white/5 border-white/10 text-white" placeholder="+52 55 0000 0000" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-400">Notas adicionales</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="bg-white/5 border-white/10 text-white resize-none h-20" placeholder="Especificaciones, plazos, preguntas..." />
      </div>
      {submitMutation.error && (
        <p className="text-xs text-red-400">{submitMutation.error.message}</p>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-white/10 text-slate-300">
          Cancelar
        </Button>
        <Button type="submit" disabled={submitMutation.isPending} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white">
          {submitMutation.isPending ? "Enviando..." : "Enviar solicitud"}
        </Button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Tienda() {
  const [, navigate] = useLocation();
  const { visitor, isAuthenticated, login } = useStoreAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<"items" | "form">("items");
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [successRefCode, setSuccessRefCode] = useState<string | null>(null);
  const [quoteSnapshot, setQuoteSnapshot] = useState<QuoteSnapshot | null>(null);

  // Resetear paso al cerrar el drawer
  const handleCartOpenChange = (open: boolean) => {
    setCartOpen(open);
    if (!open) setCartStep("items");
  };

  const { data: categories, isLoading: catsLoading } = trpc.store.getCategories.useQuery();
  const { data: products, isLoading: prodsLoading } = trpc.store.getProducts.useQuery({});

  // Seed data on first load if empty
  const seedMutation = trpc.store.seedData.useMutation();
  const utils = trpc.useUtils();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (selectedCategory !== "all") result = result.filter((p) => p.categorySlug === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.shortDesc ?? "").toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, selectedCategory, search]);

  const cartIds = useMemo(() => new Set(cart.map((i) => i.product.id)), [cart]);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      if (prev.find((i) => i.product.id === product.id)) return prev;
      return [...prev, { product, quantity: 1, notes: "" }];
    });
  }, []);

  const updateQty = useCallback((id: number, delta: number) => {
    setCart((prev) => prev.map((i) => i.product.id === id
      ? { ...i, quantity: Math.max(1, i.quantity + delta) }
      : i
    ));
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const updateNotes = useCallback((id: number, notes: string) => {
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, notes } : i));
  }, []);

  const handleSeedAndRefresh = async () => {
    await seedMutation.mutateAsync();
    utils.store.getCategories.invalidate();
    utils.store.getProducts.invalidate();
  };

  const totalRef = cart.reduce((sum, i) => sum + (i.product.priceRef ?? 0) * i.quantity, 0);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f1623 0%, #141d2e 50%, #0f1623 100%)" }}>
      {/* Auth Guard */}
      <StoreAuthModal
        open={!isAuthenticated}
        onAuthenticated={login}
        onExit={() => navigate("/")}
      />

      {/* Welcome Banner */}
      {isAuthenticated && visitor && (
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-2 text-center">
          <span className="text-sm text-cyan-300">
            Bienvenido, <strong>{visitor.name}</strong> — Estás viendo precios y puedes solicitar cotizaciones
          </span>
        </div>
      )}

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-blue-900/10" />
        <div className="relative max-w-7xl mx-auto px-4 pr-16 py-16 sm:py-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400 text-sm font-medium tracking-wide uppercase">Tienda IAMET</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Catálogo de Productos<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  y Servicios Tecnológicos
                </span>
              </h1>
              <p className="text-slate-400 max-w-lg">
                Selecciona los productos que necesitas y solicita una cotización personalizada.
                Nuestro equipo te contactará en menos de 24 horas.
              </p>
            </div>
            <div
              className="flex-shrink-0 rounded-2xl p-6 text-center"
              style={{ background: "linear-gradient(145deg, #1e2535, #161c2a)", boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347" }}
            >
              <div className="text-4xl font-bold text-cyan-400">{products?.length ?? 0}</div>
              <div className="text-slate-400 text-sm">productos disponibles</div>
              <Separator className="my-3 bg-white/10" />
              <div className="text-2xl font-bold text-white">{categories?.length ?? 0}</div>
              <div className="text-slate-400 text-sm">categorías</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-30 border-b border-white/5" style={{ background: "rgba(15,22,35,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 pr-16 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Buscar productos, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-9"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedCategory === "all"
                    ? "bg-cyan-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Todos
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat.slug
                      ? "bg-cyan-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {CATEGORY_ICONS[cat.slug]}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <Button
            onClick={() => setCartOpen(true)}
            className="relative gap-2 bg-cyan-600 hover:bg-cyan-500 text-white flex-shrink-0"
            style={{ boxShadow: cart.length > 0 ? "0 0 16px rgba(6,182,212,0.4)" : undefined }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cotización</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-500 text-amber-950 text-xs font-bold flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 pr-16 py-8">
        {/* Seed prompt */}
        {!prodsLoading && (!products || products.length === 0) && (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">El catálogo está vacío. Carga los productos de ejemplo para comenzar.</p>
            <Button onClick={handleSeedAndRefresh} disabled={seedMutation.isPending} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              {seedMutation.isPending ? "Cargando..." : "Cargar catálogo de ejemplo"}
            </Button>
          </div>
        )}

        {prodsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(145deg, #1e2535, #161c2a)" }}>
                <Skeleton className="h-44 bg-white/5" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-20 bg-white/5" />
                  <Skeleton className="h-4 w-full bg-white/5" />
                  <Skeleton className="h-3 w-3/4 bg-white/5" />
                  <Skeleton className="h-8 w-full bg-white/5 mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 && products && products.length > 0 && (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No se encontraron productos para "{search}"</p>
                <button onClick={() => { setSearch(""); setSelectedCategory("all"); }} className="text-cyan-400 text-sm mt-2 hover:underline">
                  Limpiar filtros
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product as Product}
                  onAdd={addToCart}
                  inCart={cartIds.has(product.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cart Drawer — 2 pasos: productos + formulario de contacto */}
      <Sheet open={cartOpen} onOpenChange={handleCartOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col border-white/10 p-0"
          style={{ background: "linear-gradient(180deg, #141d2e, #0f1623)" }}
        >
          {/* Header con indicador de pasos */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {cartStep === "form" && (
                  <button
                    onClick={() => setCartStep("items")}
                    className="text-slate-400 hover:text-white transition-colors mr-1"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                )}
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                <span className="text-white font-semibold">
                  {cartStep === "items" ? "Solicitud de Cotización" : "Datos de Contacto"}
                </span>
              </div>
              {cart.length > 0 && cartStep === "items" && (
                <Badge className="bg-cyan-600 text-white">{cart.length} ítem{cart.length !== 1 ? "s" : ""}</Badge>
              )}
            </div>
            {/* Indicador de pasos */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-cyan-600 text-white">1</div>
                <span className={`text-xs ${cartStep === "items" ? "text-cyan-400" : "text-slate-500"}`}>Productos</span>
              </div>
              <div className="flex-1 h-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  cartStep === "form" ? "bg-cyan-600 text-white" : "bg-white/10 text-slate-500"
                }`}>2</div>
                <span className={`text-xs ${cartStep === "form" ? "text-cyan-400" : "text-slate-500"}`}>Contacto</span>
              </div>
            </div>
          </div>

          {/* Paso 1: Lista de productos */}
          {cartStep === "items" && (
            cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
                <ShoppingCart className="w-12 h-12 text-slate-700" />
                <p className="text-slate-500">Tu carrito está vacío</p>
                <p className="text-xs text-slate-600">Agrega productos del catálogo para solicitar una cotización</p>
                <Button variant="outline" onClick={() => handleCartOpenChange(false)} className="mt-2 border-white/10 text-slate-300">
                  Ver catálogo
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 px-6 py-4">
                  {cart.map((item) => (
                    <CartItemRow
                      key={item.product.id}
                      item={item}
                      onQty={(d) => updateQty(item.product.id, d)}
                      onRemove={() => removeFromCart(item.product.id)}
                      onNotes={(v) => updateNotes(item.product.id, v)}
                    />
                  ))}
                </div>
                <div className="px-6 pb-6 pt-4 border-t border-white/10 flex-shrink-0 space-y-3">
                  {totalRef > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Total referencial:</span>
                      <span className="text-cyan-400 font-bold">${totalRef.toLocaleString("es-MX")} MXN</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 text-center">
                    Los precios son de referencia. El precio final se confirma en la cotización.
                  </p>
                  <Button
                    onClick={() => setCartStep("form")}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
                    style={{ boxShadow: "0 0 16px rgba(6,182,212,0.3)" }}
                  >
                    Continuar con mis datos
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )
          )}

          {/* Paso 2: Formulario de contacto */}
          {cartStep === "form" && (
            <>
              {/* Resumen de productos */}
              <div className="px-6 py-3 border-b border-white/5 flex-shrink-0">
                <p className="text-xs text-slate-500 mb-2">{cart.length} producto{cart.length !== 1 ? "s" : ""} en tu solicitud:</p>
                <div className="flex flex-wrap gap-1.5">
                  {cart.map((item) => (
                    <span key={item.product.id} className="text-xs px-2 py-0.5 rounded-full text-cyan-400"
                      style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}
                    >
                      {item.quantity}× {item.product.name.length > 22 ? item.product.name.slice(0, 22) + "…" : item.product.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <QuoteForm
                  cart={cart}
                  onClose={() => handleCartOpenChange(false)}
                  onSuccess={(refCode, contact) => {
                    const snap: QuoteSnapshot = { refCode, items: [...cart], contact };
                    handleCartOpenChange(false);
                    setCart([]);
                    setSuccessRefCode(refCode);
                    setQuoteSnapshot(snap);
                  }}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Success Dialog */}
      <Dialog open={!!successRefCode} onOpenChange={() => { setSuccessRefCode(null); setQuoteSnapshot(null); }}>
        <DialogContent
          className="max-w-md text-center border-white/10"
          style={{ background: "linear-gradient(145deg, #1e2535, #141d2e)" }}
        >
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">¡Solicitud enviada!</h3>
              <p className="text-slate-400 text-sm">Tu solicitud de cotización fue recibida correctamente.</p>
            </div>
            <div
              className="rounded-xl px-6 py-3 text-center"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}
            >
              <p className="text-xs text-slate-400 mb-1">Número de referencia</p>
              <p className="text-lg font-bold text-cyan-400 font-mono">{successRefCode}</p>
            </div>
            <p className="text-xs text-slate-500">
              Nuestro equipo revisará tu solicitud y te contactará en menos de 24 horas hábiles.
            </p>
            <div className="flex flex-col gap-2 w-full">
              {quoteSnapshot && (
                <Button
                  onClick={() => downloadQuotePdf(quoteSnapshot)}
                  variant="outline"
                  className="w-full gap-2 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Descargar resumen en PDF
                </Button>
              )}
              <Button onClick={() => { setSuccessRefCode(null); setQuoteSnapshot(null); }} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                Continuar explorando
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
