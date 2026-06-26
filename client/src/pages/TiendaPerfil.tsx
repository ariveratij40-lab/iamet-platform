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
  LogOut, Clock, CheckCircle2, XCircle, FileText, Eye
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pendiente",  color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  reviewed: { label: "En revisión", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  quoted:   { label: "Cotizado",   color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  closed:   { label: "Cerrado",    color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

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
      <div className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0f1623 0%, #141d2e 50%, #0f1623 100%)" }}>
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "linear-gradient(145deg, #1e2535, #161c2a)", boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347" }}>
            <Package className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="text-slate-400 text-sm">Inicia sesión para ver tu perfil.</p>
          <button onClick={() => navigate("/tienda/login")}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}>
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

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f1623 0%, #141d2e 50%, #0f1623 100%)" }}>
      {/* Navbar */}
      <div className="sticky top-0 z-50 border-b border-white/5"
        style={{ background: "rgba(15,22,35,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/tienda")} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              <span className="font-semibold text-white text-sm">Mi Perfil — Tienda IAMET</span>
            </div>
          </div>
          {user && (
            <button onClick={() => logout()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Cerrar sesión</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header de perfil */}
        <div className="rounded-2xl p-6 flex items-center gap-5"
          style={{ background: "linear-gradient(145deg, #1e2535, #161c2a)", boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347" }}>
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-cyan-600 text-white text-2xl font-bold">
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold text-white">{user?.name ?? "Usuario"}</h1>
            <p className="text-slate-400 text-sm">{user?.email ?? ""}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-cyan-400">
                {quotesLoading ? "..." : `${quotes?.length ?? 0} cotizaciones`}
              </span>
              {savedItems.length > 0 && (
                <span className="text-xs text-amber-400">
                  {savedItems.length} productos en carrito guardado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Carrito guardado */}
        {(cartLoading || savedItems.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Carrito guardado</h2>
            </div>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(145deg, #1e2535, #161c2a)", boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347" }}>
              {cartLoading ? (
                <div className="p-6 space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-12 bg-white/5 rounded-xl" />)}
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {savedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{item.productName}</p>
                        {item.productSku && <p className="text-xs text-slate-500 font-mono">{item.productSku}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">×{item.quantity}</span>
                        {item.priceRef && (
                          <span className="text-xs text-cyan-400 font-medium">
                            ${(item.priceRef * item.quantity).toLocaleString("es-MX")} MXN
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="px-5 py-3">
                    <Button
                      onClick={() => navigate("/tienda")}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Continuar con este carrito
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Historial de cotizaciones */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Mis cotizaciones</h2>
          </div>

          {quotesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 bg-white/5 rounded-2xl" />
              ))}
            </div>
          ) : !quotes || quotes.length === 0 ? (
            <div className="rounded-2xl p-12 text-center"
              style={{ background: "linear-gradient(145deg, #1e2535, #161c2a)", boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347" }}>
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Aún no tienes cotizaciones.</p>
              <Button onClick={() => navigate("/tienda")} className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white gap-2">
                <Package className="w-4 h-4" />
                Explorar catálogo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {quotes.map((quote) => {
                const st = STATUS_LABELS[quote.status] ?? STATUS_LABELS.pending;
                return (
                  <div key={quote.id} className="rounded-2xl p-5"
                    style={{ background: "linear-gradient(145deg, #1e2535, #161c2a)", boxShadow: "6px 6px 12px #0d1118, -4px -4px 10px #2a3347" }}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white font-mono">{quote.refCode}</span>
                          <Badge className={`text-xs border ${st.color}`}>{st.label}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(quote.createdAt).toLocaleDateString("es-MX", {
                            year: "numeric", month: "long", day: "numeric"
                          })}
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {(quote as any).items?.length ?? 0} producto{((quote as any).items?.length ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Separator className="bg-white/5 mb-3" />
                    <div className="space-y-1">
                      {((quote as any).items ?? []).slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 truncate max-w-[60%]">{item.productName}</span>
                          <span className="text-slate-500">×{item.quantity}</span>
                        </div>
                      ))}
                      {((quote as any).items?.length ?? 0) > 3 && (
                        <p className="text-xs text-slate-500 italic">
                          +{(quote as any).items.length - 3} más...
                        </p>
                      )}
                    </div>
                    {quote.notes && (
                      <p className="text-xs text-slate-500 mt-2 italic border-t border-white/5 pt-2">
                        Nota: {quote.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
