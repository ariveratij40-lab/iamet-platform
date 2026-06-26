import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { CheckCircle, XCircle, Loader2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TiendaVerificar() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const verifyMutation = trpc.storeAuth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      setTimeout(() => navigate("/tienda/login"), 2500);
    },
    onError: (e: { message: string }) => {
      setErrorMsg(e.message);
      setStatus("error");
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (!token) {
      setErrorMsg("No se encontró el token de verificación en la URL.");
      setStatus("error");
      return;
    }
    verifyMutation.mutate({ token });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#060d1f] flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white/5 border border-white/10 rounded-2xl p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 mb-2">
          <ShoppingBag className="h-8 w-8 text-cyan-400" />
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-cyan-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Verificando tu correo...</h2>
            <p className="text-sm text-slate-400">Por favor espera un momento.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">¡Correo verificado!</h2>
            <p className="text-sm text-slate-400">Tu cuenta está activa. Redirigiendo al login...</p>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: "100%", animation: "progress 2.5s linear forwards" }} />
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Error de verificación</h2>
            <p className="text-sm text-slate-400">{errorMsg || "El enlace es inválido o ha expirado."}</p>
            <Button onClick={() => navigate("/tienda/login")} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black">
              Ir al login
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
