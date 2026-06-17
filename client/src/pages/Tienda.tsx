import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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

// ─── Quote Form ───────────────────────────────────────────────────────────────
function QuoteForm({ cart, onClose, onSuccess }: {
  cart: CartItem[];
  onClose: () => void;
  onSuccess: (refCode: string) => void;
}) {
  const [form, setForm] = useState({ visitorName: "", company: "", email: "", phone: "", notes: "" });
  const submitMutation = trpc.store.submitQuote.useMutation({
    onSuccess: (data) => onSuccess(data.refCode),
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [successRefCode, setSuccessRefCode] = useState<string | null>(null);

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
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/20 to-blue-900/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-20">
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
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
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
      <div className="max-w-7xl mx-auto px-4 py-8">
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

      {/* Cart Drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col border-white/10"
          style={{ background: "linear-gradient(180deg, #141d2e, #0f1623)" }}
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <ShoppingCart className="w-5 h-5 text-cyan-400" />
              Solicitud de Cotización
              {cart.length > 0 && (
                <Badge className="bg-cyan-600 text-white ml-auto">{cart.length} ítem{cart.length !== 1 ? "s" : ""}</Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-700" />
              <p className="text-slate-500">Tu carrito está vacío</p>
              <p className="text-xs text-slate-600">Agrega productos del catálogo para solicitar una cotización</p>
              <Button variant="outline" onClick={() => setCartOpen(false)} className="mt-2 border-white/10 text-slate-300">
                Ver catálogo
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
              <SheetFooter className="flex-col gap-3 pt-4 border-t border-white/10">
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
                  onClick={() => { setCartOpen(false); setQuoteOpen(true); }}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
                  style={{ boxShadow: "0 0 16px rgba(6,182,212,0.3)" }}
                >
                  <ChevronRight className="w-4 h-4" />
                  Solicitar cotización
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Quote Form Dialog */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent
          className="max-w-lg border-white/10"
          style={{ background: "linear-gradient(145deg, #1e2535, #141d2e)" }}
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-cyan-400" />
              Datos de contacto
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Completa tus datos y te enviaremos la cotización a tu correo.
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs text-slate-500 mb-2">
            {cart.length} producto{cart.length !== 1 ? "s" : ""} en la solicitud
          </div>
          <QuoteForm
            cart={cart}
            onClose={() => setQuoteOpen(false)}
            onSuccess={(refCode) => {
              setQuoteOpen(false);
              setCart([]);
              setSuccessRefCode(refCode);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={!!successRefCode} onOpenChange={() => setSuccessRefCode(null)}>
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
            <Button onClick={() => setSuccessRefCode(null)} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              Continuar explorando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
