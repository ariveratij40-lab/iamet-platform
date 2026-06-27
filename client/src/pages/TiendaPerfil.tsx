import { useState } from "react";
import { useLocation } from "wouter";
import { useStoreSession } from "@/hooks/useStoreSession";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, Package, ClipboardList, ShoppingCart,
  LogOut, Clock, CheckCircle2, XCircle, FileText,
  ChevronDown, ChevronUp, RefreshCw, Calendar, Building2,
  Phone, Mail
} from "lucide-react";

// ─── Status helpers ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; message: string }> = {
  pending: {
    label: "Pendiente",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: <Clock className="w-3 h-3" />,
    message: "El equipo de IAMET revisará tu solicitud en breve.",
  },
  reviewed: {
    label: "En revisión",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: <RefreshCw className="w-3 h-3" />,
    message: "Tu solicitud está siendo procesada por nuestro equipo.",
  },
  quoted: {
    label: "Cotizado",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: <CheckCircle2 className="w-3 h-3" />,
    message: "Tu cotización fue procesada. Revisa tu correo para la propuesta formal.",
  },
  closed: {
    label: "Cerrado",
    color: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    icon: <XCircle className="w-3 h-3" />,
    message: "Esta solicitud fue cerrada.",
  },
};

// ─── Quote Card (expandible) ──────────────────────────────────────────────────
function QuoteCard({ quote }: { quote: any }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[quote.status] ?? STATUS_CONFIG.pending;
  const items: any[] = quote.items ?? [];

  const date = new Date(quote.createdAt).toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });
  const time = new Date(quote.createdAt).toLocaleTimeString("es-MX", {
    hour: "2-digit", minute: "2-digit",
  });

  const statusBg =
    quote.status === "quoted"   ? "rgba(16,185,129,0.08)"  :
    quote.status === "reviewed" ? "rgba(59,130,246,0.08)"  :
    quote.status === "closed"   ? "rgba(100,116,139,0.08)" :
                                  "rgba(245,158,11,0.08)";
  const statusBorder =
    quote.status === "quoted"   ? "1px solid rgba(16,185,129,0.2)"  :
    quote.status === "reviewed" ? "1px solid rgba(59,130,246,0.2)"  :
    quote.status === "closed"   ? "1px solid rgba(100,116,139,0.2)" :
                                  "1px solid rgba(245,158,11,0.2)";
  const statusTextClass =
    quote.status === "quoted"   ? "text-emerald-400 font-medium" :
    quote.status === "reviewed" ? "text-blue-400 font-medium"    :
    quote.status === "closed"   ? "text-slate-400 font-medium"   :
                                  "text-amber-400 font-medium";

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "linear-gradient(145deg, #1e2535, #161c2a)",
        boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347",
      }}
    >
      {/* Header clickeable */}
      <button
        className="w-full flex items-center justify-between p-5 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(6,182,212,0.12)",
              boxShadow: "inset 2px 2px 4px #0d1118, inset -2px -2px 4px #2a3347",
            }}
          >
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white font-mono">{quote.refCode}</span>
              <Badge className={`text-xs gap-1 border ${status.color}`}>
                {status.icon}
                {status.label}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{date}</span>
              <span className="text-slate-600">·</span>
              <span>{time}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-xs text-slate-500">
            {items.length} prod{items.length !== 1 ? "s" : ""}
          </span>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-500" />
          }
        </div>
      </button>

      {/* Detalle expandido */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4 space-y-4">
          {/* Lista completa de productos */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Productos solicitados
            </p>
            {items.length > 0 ? (
              <div className="space-y-1.5">
                {items.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="w-3.5 h-3.5 text-cyan-400/60 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{item.productName}</p>
                        {item.productSku && (
                          <p className="text-xs text-slate-500 font-mono">{item.productSku}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">×{item.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Sin productos registrados</p>
            )}
          </div>

          {/* Notas del cliente */}
          {quote.notes && (
            <div
              className="rounded-lg p-3 text-xs"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <span className="text-slate-500 font-medium">Notas: </span>
              <span className="text-slate-300">{quote.notes}</span>
            </div>
          )}

          {/* Mensaje de seguimiento */}
          <div
            className="rounded-lg p-3 text-xs"
            style={{ background: statusBg, border: statusBorder }}
          >
            <p className={statusTextClass}>{status.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TiendaPerfil() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading, logout } = useStoreSession();

  const token = typeof window !== "undefined" ? localStorage.getItem("store_token") ?? "" : "";

  const { data: quotes, isLoading: quotesLoading } = trpc.storeAuth.getMyQuotes.useQuery(
    { token },
    { enabled: isAuthenticated && !!token }
  );
  const { data: savedCart, isLoading: cartLoading } = trpc.storeAuth.getSavedCart.useQuery(
    { token },
    { enabled: isAuthenticated && !!token }
  );

  // Guard
  if (!loading && !isAuthenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0f1623 0%, #141d2e 50%, #0f1623 100%)" }}
      >
        <div className="max-w-sm w-full text-center space-y-6">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, #1e2535, #161c2a)",
              boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347",
            }}
          >
            <Package className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-slate-400 text-sm">Inicia sesión para ver tu perfil.</p>
          <button
            onClick={() => navigate("/tienda/login")}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  const savedItems = (savedCart?.items ?? []) as Array<{
    productId: number; productName: string; productSku?: string;
    quantity: number; imageUrl?: string; priceRef?: number;
  }>;

  const quotedCount = (quotes ?? []).filter((q: any) => q.status === "quoted").length;

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0f1623 0%, #141d2e 50%, #0f1623 100%)" }}
    >
      {/* Navbar */}
      <div
        className="sticky top-0 z-50 border-b border-white/5"
        style={{ background: "rgba(15,22,35,0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/tienda")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Tienda</span>
          </button>
          <span className="text-sm font-semibold text-white">Mi Perfil</span>
          {user && (
            <button
              onClick={() => { logout(); navigate("/tienda/login"); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Salir</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Tarjeta de usuario */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(145deg, #1e2535, #161c2a)",
            boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347",
          }}
        >
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 shrink-0">
              <AvatarFallback className="bg-cyan-600 text-white text-xl font-bold">
                {(user?.name ?? "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">{user?.name ?? "Usuario"}</h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                <Mail className="w-3 h-3 shrink-0" />
                <span className="truncate">{user?.email ?? ""}</span>
              </div>
              {(user as any)?.phone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span>{(user as any).phone}</span>
                </div>
              )}
              {(user as any)?.company && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span>{(user as any).company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "rgba(6,182,212,0.08)",
                border: "1px solid rgba(6,182,212,0.15)",
              }}
            >
              <p className="text-2xl font-bold text-cyan-400">
                {quotesLoading ? "—" : (quotes?.length ?? 0)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Solicitudes enviadas</p>
            </div>
            <div
              className="rounded-xl p-3 text-center"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <p className="text-2xl font-bold text-emerald-400">
                {quotesLoading ? "—" : quotedCount}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Cotizaciones recibidas</p>
            </div>
          </div>
        </div>

        {/* Carrito guardado */}
        {(cartLoading || savedItems.length > 0) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Carrito guardado</h2>
                {savedItems.length > 0 && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                    {savedItems.length}
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => navigate("/tienda")}
                className="text-xs h-7 bg-amber-600 hover:bg-amber-500 text-white gap-1"
              >
                <ShoppingCart className="w-3 h-3" /> Continuar
              </Button>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #1e2535, #161c2a)",
                boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347",
              }}
            >
              {cartLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-10 bg-white/5 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {savedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.productName}</p>
                        {item.productSku && (
                          <p className="text-xs text-slate-500 font-mono">{item.productSku}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-400">×{item.quantity}</span>
                        {item.priceRef && (
                          <span className="text-xs text-cyan-400 font-medium">
                            ${(item.priceRef * item.quantity).toLocaleString("es-MX")} MXN
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Historial de solicitudes */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Mis cotizaciones</h2>
              {!quotesLoading && quotes && quotes.length > 0 && (
                <Badge className="bg-slate-700/60 text-slate-300 border-slate-600/30 text-xs">
                  {quotes.length}
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/tienda")}
              className="text-xs h-7 border-white/10 text-slate-400 hover:text-white gap-1"
            >
              <ShoppingCart className="w-3 h-3" /> Nueva solicitud
            </Button>
          </div>

          {quotesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 bg-white/5 rounded-2xl" />
              ))}
            </div>
          ) : !quotes || quotes.length === 0 ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{
                background: "linear-gradient(145deg, #1e2535, #161c2a)",
                boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347",
              }}
            >
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">Sin solicitudes aún</p>
              <p className="text-xs text-slate-600 mt-1">
                Agrega productos al carrito y envía tu primera solicitud de cotización.
              </p>
              <Button
                onClick={() => navigate("/tienda")}
                className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white gap-2 text-sm"
              >
                <Package className="w-4 h-4" />
                Explorar catálogo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Haz clic en una solicitud para ver todos los productos incluidos.
              </p>
              {quotes.map((quote) => (
                <QuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          )}
        </section>

        <Separator className="bg-white/5" />
        <p className="text-center text-xs text-slate-600 pb-4">
          IAMET Evolución Tecnológica · Tienda en línea
        </p>
      </div>
    </div>
  );
}
