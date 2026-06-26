import { useState, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useStoreSession } from "@/hooks/useStoreSession";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, ArrowLeft, Star, Package, Tag, CheckCircle2,
  Plus, Minus, Trash2, ChevronRight, Shield, Network, Monitor,
  Cable, Code2, Zap, Wrench, ExternalLink, Info, ListChecks,
} from "lucide-react";
import { toast } from "sonner";

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
  specs?: unknown;
  related?: Product[];
};

type CartItem = {
  product: Product;
  quantity: number;
  notes: string;
};

// ─── Category Icons ───────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  seguridad: <Shield className="w-4 h-4" />,
  redes: <Network className="w-4 h-4" />,
  computo: <Monitor className="w-4 h-4" />,
  cableado: <Cable className="w-4 h-4" />,
  software: <Code2 className="w-4 h-4" />,
  energia: <Zap className="w-4 h-4" />,
  servicios: <Wrench className="w-4 h-4" />,
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

// ─── Default specs por categoría ─────────────────────────────────────────────
const DEFAULT_SPECS: Record<string, Record<string, string>> = {
  seguridad: {
    "Resolución": "4MP (2560×1440)",
    "Lente": "2.8mm fijo",
    "Visión nocturna": "IR hasta 30m",
    "Compresión": "H.265+",
    "Conectividad": "RJ45 10/100 PoE",
    "Protección": "IP67, IK10",
    "Alimentación": "PoE 802.3af / 12VDC",
    "Temperatura": "-30°C a +60°C",
  },
  redes: {
    "Puertos": "24x RJ45 Gigabit",
    "PoE": "802.3af/at, 370W total",
    "Uplinks": "4x SFP+ 10G",
    "Switching capacity": "128 Gbps",
    "Gestión": "Web GUI, CLI, SNMP v3",
    "VLANs": "802.1Q, hasta 4094",
    "Montaje": "1U rack 19\"",
    "Consumo máx.": "400W",
  },
  computo: {
    "Procesador": "Intel Core i7 12a Gen",
    "RAM": "16GB DDR4 3200MHz",
    "Almacenamiento": "512GB NVMe SSD",
    "Pantalla": "15.6\" FHD IPS",
    "Sistema operativo": "Windows 11 Pro",
    "Batería": "72Wh, hasta 10h",
    "Conectividad": "Wi-Fi 6, BT 5.2, USB-C",
    "Garantía": "1 año en sitio",
  },
  cableado: {
    "Categoría": "Cat6A",
    "Calibre": "23 AWG",
    "Longitud": "305m (caja)",
    "Impedancia": "100Ω ±15%",
    "Certificación": "TIA-568-C.2, ISO/IEC 11801",
    "Clasificación": "CMR (riser)",
    "Temperatura instalación": "0°C a +60°C",
    "Diámetro ext.": "7.0mm aprox.",
  },
  software: {
    "Tipo de licencia": "Suscripción anual",
    "Usuarios incluidos": "1 usuario",
    "Almacenamiento": "1TB OneDrive",
    "Aplicaciones": "Word, Excel, PowerPoint, Teams",
    "Plataformas": "Windows, macOS, iOS, Android",
    "Soporte": "Microsoft 24/7",
    "Actualizaciones": "Incluidas",
    "Facturación": "Anual o mensual",
  },
  energia: {
    "Potencia": "3kVA / 2.7kW",
    "Tipo": "Online doble conversión",
    "Autonomía": "8 min a plena carga",
    "Entrada": "120/208/240VAC ±10%",
    "Salida": "120/208VAC, THD <2%",
    "Gestión remota": "SNMP, USB, RS-232",
    "Baterías": "Selladas VRLA, reemplazables",
    "Temperatura": "0°C a +40°C",
  },
  servicios: {
    "Modalidad": "Presencial / Remoto",
    "Cobertura": "Nacional",
    "Tiempo de respuesta": "4 horas (SLA estándar)",
    "Certificaciones": "CompTIA, Cisco, Microsoft",
    "Reporte": "Informe técnico incluido",
    "Garantía de trabajo": "90 días",
    "Horario": "Lunes a viernes 8-18h",
    "Soporte post-servicio": "30 días incluido",
  },
};

// ─── Cart Item Row ────────────────────────────────────────────────────────────
function CartItemRow({ item, onQty, onRemove }: {
  item: CartItem;
  onQty: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: "rgba(255,255,255,0.04)" }}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white leading-snug">{item.product.name}</p>
          {item.product.sku && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.product.sku}</p>}
        </div>
        <button onClick={onRemove} className="text-slate-500 hover:text-red-400 transition-colors p-0.5">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <button onClick={() => onQty(-1)} className="px-2 py-1 text-slate-400 hover:text-white transition-colors text-xs">
            <Minus className="w-3 h-3" />
          </button>
          <span className="px-2 text-xs font-semibold text-white">{item.quantity}</span>
          <button onClick={() => onQty(1)} className="px-2 py-1 text-slate-400 hover:text-white transition-colors text-xs">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {item.product.priceRef && (
          <span className="text-xs text-cyan-400 font-semibold ml-auto">
            ${(item.product.priceRef * item.quantity).toLocaleString("es-MX")} MXN
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Related Product Mini Card ────────────────────────────────────────────────
function RelatedCard({ product, onAdd, inCart }: { product: Product; onAdd: () => void; inCart: boolean }) {
  const [, navigate] = useLocation();
  const imgSrc = getProductImage(product.slug, product.categorySlug);
  return (
    <div
      className="group rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        background: "linear-gradient(145deg, #1e2535, #161c2a)",
        boxShadow: "4px 4px 10px #0d1118, -3px -3px 8px #2a3347",
      }}
    >
      <div
        className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden"
        onClick={() => navigate(`/tienda/${product.slug}`)}
      >
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div className="p-3 space-y-2">
        <p
          className="text-xs font-semibold text-white leading-snug line-clamp-2 cursor-pointer hover:text-cyan-400 transition-colors"
          onClick={() => navigate(`/tienda/${product.slug}`)}
        >
          {product.name}
        </p>
        {product.priceRef && (
          <p className="text-xs text-cyan-400 font-bold">${product.priceRef.toLocaleString("es-MX")} MXN</p>
        )}
        <Button
          size="sm"
          onClick={onAdd}
          disabled={inCart}
          className={`w-full text-xs gap-1 h-7 ${
            inCart
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
              : "bg-cyan-600 hover:bg-cyan-500 text-white"
          }`}
        >
          {inCart ? <><CheckCircle2 className="w-3 h-3" /> En carrito</> : <><Plus className="w-3 h-3" /> Agregar</>}
        </Button>
      </div>
    </div>
  );
}

// ─── Quote Form Modal ─────────────────────────────────────────────────────────
function QuoteModal({
  open,
  onClose,
  cart,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  onSuccess: (refCode: string) => void;
}) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", notes: "" });
  const submitMutation = trpc.store.submitQuote.useMutation({
    onSuccess: (data) => {
      onSuccess(data.refCode);
      setForm({ name: "", company: "", email: "", phone: "", notes: "" });
    },
    onError: () => toast.error("Error al enviar la solicitud. Intenta de nuevo."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    submitMutation.mutate({
      visitorName: form.name,
      company: form.company || undefined,
      email: form.email,
      phone: form.phone || undefined,
      notes: form.notes || undefined,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productSku: item.product.sku ?? undefined,
        quantity: item.quantity,
        notes: item.notes || undefined,
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md border-white/10"
        style={{ background: "linear-gradient(145deg, #1a2236, #141b2d)", color: "white" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Solicitar Cotización</DialogTitle>
          <DialogDescription className="text-slate-400">
            {cart.length} producto{cart.length !== 1 ? "s" : ""} seleccionado{cart.length !== 1 ? "s" : ""}. Te contactaremos en menos de 24h.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Nombre *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Tu nombre"
                required
                className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Empresa</Label>
              <Input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Nombre empresa"
                className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="correo@empresa.com"
              required
              className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Teléfono</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+52 55 0000 0000"
              className="h-8 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Notas adicionales</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Cantidad requerida, instalación, plazo de entrega..."
              rows={3}
              className="text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
            />
          </div>
          {/* Product summary */}
          <div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(255,255,255,0.04)" }}>
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between text-xs text-slate-300">
                <span className="truncate flex-1">{item.product.name}</span>
                <span className="ml-2 text-slate-400 flex-shrink-0">x{item.quantity}</span>
              </div>
            ))}
          </div>
          <Button
            type="submit"
            disabled={submitMutation.isPending || !form.name || !form.email}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
            style={{ boxShadow: "0 0 20px rgba(6,182,212,0.3)" }}
          >
            {submitMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ refCode, onClose }: { refCode: string; onClose: () => void }) {
  return (
    <Dialog open={!!refCode} onOpenChange={onClose}>
      <DialogContent
        className="max-w-sm text-center border-white/10"
        style={{ background: "linear-gradient(145deg, #1a2236, #141b2d)", color: "white" }}
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(34,197,94,0.15)", boxShadow: "0 0 24px rgba(34,197,94,0.3)" }}
          >
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">¡Solicitud enviada!</h3>
            <p className="text-sm text-slate-400">Tu número de referencia es:</p>
            <p className="text-xl font-mono font-bold text-cyan-400 mt-1">{refCode}</p>
          </div>
          <p className="text-xs text-slate-500 text-center">
            Nuestro equipo revisará tu solicitud y te contactará en menos de 24 horas hábiles.
          </p>
          <Button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500 text-white w-full">
            Continuar comprando
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductoDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated, loading } = useStoreSession();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [successRef, setSuccessRef] = useState("");
  const [activeTab, setActiveTab] = useState<"specs" | "description">("specs");

  const { data: product, isLoading, error } = trpc.store.getProduct.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const addToCart = useCallback((p: Product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === p.id);
      if (exists) return prev;
      return [...prev, { product: p, quantity: 1, notes: "" }];
    });
    toast.success(`${p.name} agregado al carrito`);
  }, []);

  const updateQty = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const cartTotal = cart.reduce((sum, i) => sum + (i.product.priceRef ?? 0) * i.quantity, 0);
  const inCart = product ? cart.some((i) => i.product.id === product.id) : false;

  // Parse specs
  const specs: Record<string, string> = (() => {
    if (!product) return {};
    if (product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)) {
      return product.specs as Record<string, string>;
    }
    return DEFAULT_SPECS[product.categorySlug] ?? {};
  })();

  const tags = Array.isArray(product?.tags) ? (product.tags as string[]) : [];

  if (isLoading) {
    return (
      <div
        className="min-h-screen pt-16 pr-14 pb-8"
        style={{ background: "linear-gradient(135deg, #0f1623 0%, #111827 50%, #0a0f1a 100%)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-6 w-48 bg-white/5" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-80 rounded-2xl bg-white/5" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 bg-white/5" />
              <Skeleton className="h-4 w-1/2 bg-white/5" />
              <Skeleton className="h-20 bg-white/5" />
              <Skeleton className="h-12 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        className="min-h-screen pt-16 pr-14 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #0f1623 0%, #111827 50%, #0a0f1a 100%)" }}
      >
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 text-slate-600 mx-auto" />
          <h2 className="text-xl font-semibold text-white">Producto no encontrado</h2>
          <p className="text-slate-400 text-sm">El producto que buscas no existe o fue removido.</p>
          <Button onClick={() => navigate("/tienda")} className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver a la tienda
          </Button>
        </div>
      </div>
    );
  }

  const imgSrc = getProductImage(product.slug, product.categorySlug);

  return (
    <div
      className="min-h-screen pt-16 pr-14"
      style={{ background: "linear-gradient(135deg, #0f1623 0%, #111827 50%, #0a0f1a 100%)" }}
    >
      {/* Guard de autenticación — redirige a login si no está autenticado */}
      {!loading && !isAuthenticated && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4" style={{ background: "rgba(10,15,26,0.97)" }}>
          <div className="max-w-sm w-full text-center space-y-5">
            <Package className="w-12 h-12 text-cyan-400 mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Acceso requerido</h2>
              <p className="text-slate-400 text-sm">Inicia sesión para ver el detalle del producto.</p>
            </div>
            <button onClick={() => navigate("/tienda/login")} className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-white" style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}>
              Iniciar sesión en la Tienda
            </button>
            <button onClick={() => navigate("/tienda")} className="text-slate-400 hover:text-white text-sm transition-colors">
              Volver al catálogo
            </button>
          </div>
        </div>
      )}
      {/* Floating cart button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl text-white font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, #0891b2, #0e7490)",
              boxShadow: "0 0 24px rgba(6,182,212,0.4), 4px 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{cart.length} ítem{cart.length !== 1 ? "s" : ""}</span>
            {cartTotal > 0 && (
              <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs">
                ${cartTotal.toLocaleString("es-MX")} MXN
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
          <button onClick={() => navigate("/")} className="hover:text-cyan-400 transition-colors">Inicio</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate("/tienda")} className="hover:text-cyan-400 transition-colors">Tienda</button>
          <ChevronRight className="w-3 h-3" />
          <button
            onClick={() => navigate(`/tienda?cat=${product.categorySlug}`)}
            className="hover:text-cyan-400 transition-colors"
          >
            {product.categoryName}
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-300 truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div
              className="rounded-3xl overflow-hidden relative"
              style={{
                background: "linear-gradient(145deg, #1e2535, #161c2a)",
                boxShadow: "8px 8px 20px #0d1118, -6px -6px 16px #2a3347",
                aspectRatio: "1/1",
              }}
            >
              {product.featured && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge className="bg-amber-500/90 text-amber-950 text-xs font-semibold gap-1">
                    <Star className="w-3 h-3" /> Destacado
                  </Badge>
                </div>
              )}
              <img
                src={imgSrc}
                alt={product.name}
                className="w-full h-full object-contain p-8"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          </motion.div>

          {/* Right: Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.05 }}
            className="flex flex-col gap-4"
          >
            {/* Category + SKU */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-xs text-cyan-400 border-cyan-400/30 bg-cyan-400/5 gap-1"
              >
                {CATEGORY_ICONS[product.categorySlug]}
                {product.categoryName}
              </Badge>
              {product.sku && (
                <span className="text-xs text-slate-500 font-mono bg-white/5 px-2 py-0.5 rounded-lg">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{product.name}</h1>

            {/* Short description */}
            {product.shortDesc && (
              <p className="text-sm text-slate-300 leading-relaxed">{product.shortDesc}</p>
            )}

            {/* Price */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: "linear-gradient(145deg, #1e2535, #161c2a)",
                boxShadow: "4px 4px 10px #0d1118, -3px -3px 8px #2a3347",
              }}
            >
              {product.priceRef ? (
                <div className="flex items-end gap-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Precio de referencia</p>
                    <p className="text-3xl font-bold text-cyan-400">
                      ${product.priceRef.toLocaleString("es-MX")}
                      <span className="text-lg text-slate-400 ml-1">MXN</span>
                    </p>
                    {product.unit && (
                      <p className="text-xs text-slate-500 mt-0.5">por {product.unit}</p>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2 py-1">
                    <Info className="w-3 h-3" />
                    Precio orientativo
                  </div>
                </div>
              ) : (
                <p className="text-lg text-slate-300 italic">Precio a consultar — solicita tu cotización</p>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-slate-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <Separator className="bg-white/10" />

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => {
                  if (!inCart) addToCart(product as Product);
                  setQuoteOpen(true);
                }}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold gap-2 h-12"
                style={{ boxShadow: "0 0 20px rgba(6,182,212,0.35)" }}
              >
                <ShoppingCart className="w-5 h-5" />
                Cotizar este producto
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  addToCart(product as Product);
                  setCartOpen(true);
                }}
                disabled={inCart}
                className="flex-1 border-white/20 text-white hover:bg-white/10 h-12 gap-2"
              >
                {inCart ? (
                  <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> En el carrito</>
                ) : (
                  <><Plus className="w-4 h-4" /> Agregar al carrito</>
                )}
              </Button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "🔒", label: "Cotización sin compromiso" },
                { icon: "⚡", label: "Respuesta en 24h" },
                { icon: "🛡️", label: "Soporte post-venta" },
              ].map((b) => (
                <div
                  key={b.label}
                  className="rounded-xl p-2 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-lg mb-0.5">{b.icon}</div>
                  <p className="text-[10px] text-slate-500 leading-tight">{b.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs: Specs / Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-12"
        >
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, #1a2236, #141b2d)",
              boxShadow: "8px 8px 20px #0d1118, -6px -6px 16px #2a3347",
            }}
          >
            {/* Tab headers */}
            <div className="flex border-b border-white/10">
              {[
                { key: "specs", label: "Especificaciones técnicas", icon: <ListChecks className="w-4 h-4" /> },
                { key: "description", label: "Descripción completa", icon: <Info className="w-4 h-4" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as "specs" | "description")}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 border-b-2 ${
                    activeTab === tab.key
                      ? "text-cyan-400 border-cyan-400 bg-cyan-400/5"
                      : "text-slate-400 border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {activeTab === "specs" ? (
                  <motion.div
                    key="specs"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {Object.keys(specs).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 rounded-xl overflow-hidden border border-white/10">
                        {Object.entries(specs).map(([key, value], idx) => (
                          <div
                            key={key}
                            className={`flex items-start gap-3 px-4 py-3 ${
                              idx % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"
                            } border-b border-white/5 last:border-b-0`}
                          >
                            <span className="text-xs text-slate-500 w-36 flex-shrink-0 pt-0.5">{key}</span>
                            <span className="text-xs text-slate-200 font-medium flex-1">{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Especificaciones no disponibles para este producto.</p>
                        <p className="text-xs mt-1">Solicita una cotización y te enviaremos la ficha técnica completa.</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="description"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {product.description ? (
                      <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                      </div>
                    ) : product.shortDesc ? (
                      <p className="text-sm text-slate-300 leading-relaxed">{product.shortDesc}</p>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Descripción detallada no disponible.</p>
                        <p className="text-xs mt-1">Contáctanos para más información sobre este producto.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Related products */}
        {product.related && product.related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Productos relacionados</h2>
              <button
                onClick={() => navigate(`/tienda?cat=${product.categorySlug}`)}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                Ver todos <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {((product.related ?? []) as unknown as Product[]).map((rel) => (
                <RelatedCard
                  key={rel.id}
                  product={rel}
                  onAdd={() => addToCart(rel)}
                  inCart={cart.some((i) => i.product.id === rel.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Cart Drawer */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent
          side="right"
          className="w-80 border-white/10 flex flex-col"
          style={{ background: "linear-gradient(180deg, #1a2236, #141b2d)" }}
        >
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
              Carrito de cotización
              <Badge className="bg-cyan-600 text-white text-xs ml-auto">{cart.length}</Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Tu carrito está vacío</p>
              </div>
            ) : (
              cart.map((item) => (
                <CartItemRow
                  key={item.product.id}
                  item={item}
                  onQty={(d) => updateQty(item.product.id, d)}
                  onRemove={() => removeFromCart(item.product.id)}
                />
              ))
            )}
          </div>
          {cart.length > 0 && (
            <SheetFooter className="flex-col gap-2 pt-4 border-t border-white/10">
              {cartTotal > 0 && (
                <div className="flex justify-between text-sm text-slate-300 px-1">
                  <span>Total referencial</span>
                  <span className="font-bold text-cyan-400">${cartTotal.toLocaleString("es-MX")} MXN</span>
                </div>
              )}
              <Button
                onClick={() => { setCartOpen(false); setQuoteOpen(true); }}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold gap-2"
                style={{ boxShadow: "0 0 16px rgba(6,182,212,0.3)" }}
              >
                <Tag className="w-4 h-4" />
                Solicitar cotización
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Quote Modal */}
      <QuoteModal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        cart={cart}
        onSuccess={(ref) => {
          setQuoteOpen(false);
          setSuccessRef(ref);
          setCart([]);
        }}
      />

      {/* Success Modal */}
      {successRef && (
        <SuccessModal
          refCode={successRef}
          onClose={() => setSuccessRef("")}
        />
      )}
    </div>
  );
}
