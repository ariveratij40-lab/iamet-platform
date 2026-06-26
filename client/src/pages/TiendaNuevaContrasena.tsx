import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TiendaNuevaContrasena() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) { setTokenError(true); return; }
    setToken(t);
  }, []);

  const resetMutation = trpc.storeAuth.resetPassword.useMutation({
    onSuccess: () => {
      setDone(true);
      setTimeout(() => navigate("/tienda/login"), 3000);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleReset = () => {
    if (password.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    if (password !== confirm) { toast.error("Las contraseñas no coinciden"); return; }
    resetMutation.mutate({ token, password });
  };

  return (
    <div className="min-h-screen bg-[#060d1f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#0a1628]/90 backdrop-blur border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/5">
          <div className="bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-cyan-500/10 border-b border-white/10 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 mb-4">
              <ShoppingBag className="h-8 w-8 text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Nueva contraseña</h1>
            <p className="text-sm text-slate-400 mt-1">IAMET Tienda</p>
          </div>

          <div className="p-8">
            {tokenError && (
              <div className="text-center space-y-4">
                <XCircle className="h-12 w-12 text-red-400 mx-auto" />
                <p className="text-white font-medium">Enlace inválido</p>
                <p className="text-sm text-slate-400">El enlace de recuperación no es válido o ha expirado.</p>
                <Button onClick={() => navigate("/tienda/login")} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black">
                  Ir al login
                </Button>
              </div>
            )}

            {!tokenError && !done && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Nueva contraseña (mín. 8 caracteres)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Nueva contraseña"
                      className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPass ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repetir contraseña"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      onKeyDown={e => e.key === "Enter" && handleReset()}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleReset}
                  disabled={resetMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
                >
                  {resetMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
                    : "Guardar nueva contraseña"
                  }
                </Button>
              </div>
            )}

            {done && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
                <p className="text-white font-medium">¡Contraseña actualizada!</p>
                <p className="text-sm text-slate-400">Redirigiendo al login...</p>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-slate-600 mt-4">IAMET Evolución Tecnológica · Tienda en línea</p>
      </div>
    </div>
  );
}
