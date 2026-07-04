import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from "lucide-react";

export default function VerifyEmail() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired" | "idle">(
    token ? "loading" : "idle"
  );
  const [message, setMessage] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendSent, setResendSent] = useState(false);

  const verifyMutation = trpc.subscribers.verifyEmail.useMutation();
  const resendMutation = trpc.subscribers.resendVerification.useMutation();

  useEffect(() => {
    if (!token) return;
    verifyMutation
      .mutateAsync({ token })
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        const msg: string = err?.message ?? "Error al verificar.";
        if (msg.includes("expirado")) {
          setStatus("expired");
        } else {
          setStatus("error");
        }
        setMessage(msg);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) return;
    try {
      await resendMutation.mutateAsync({
        email: resendEmail,
        origin: window.location.origin,
      });
      setResendSent(true);
    } catch (err: any) {
      setMessage(err?.message ?? "Error al reenviar.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-bold tracking-tight text-white cursor-pointer">
              <span className="text-blue-500">IA</span>MET
            </span>
          </Link>
        </div>

        <div
          className="rounded-2xl border border-white/10 p-8 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(30,30,46,0.9) 0%, rgba(15,15,25,0.95) 100%)",
            boxShadow:
              "8px 8px 16px rgba(0,0,0,0.4), -4px -4px 12px rgba(255,255,255,0.03)",
          }}
        >
          {/* Loading */}
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
              <h1 className="text-xl font-bold text-white mb-2">
                Verificando tu correo…
              </h1>
              <p className="text-slate-400 text-sm">Por favor espera un momento.</p>
            </>
          )}

          {/* Success */}
          {status === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">
                ¡Correo verificado!
              </h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link href="/login-suscriptor">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl">
                  Iniciar sesión
                </Button>
              </Link>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">
                Enlace inválido
              </h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link href="/registro">
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  Crear nueva cuenta
                </Button>
              </Link>
            </>
          )}

          {/* Expired */}
          {status === "expired" && (
            <>
              <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">
                Enlace expirado
              </h1>
              <p className="text-slate-400 text-sm mb-6">
                El enlace de verificación ha expirado. Solicita uno nuevo ingresando tu correo.
              </p>
              {!resendSent ? (
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={handleResend}
                    disabled={resendMutation.isPending || !resendEmail}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
                  >
                    {resendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Reenviar enlace
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Correo enviado. Revisa tu bandeja de entrada.</span>
                </div>
              )}
            </>
          )}

          {/* Idle (no token) */}
          {status === "idle" && (
            <>
              <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-white mb-2">
                Verifica tu correo
              </h1>
              <p className="text-slate-400 text-sm mb-6">
                Ingresa tu correo para reenviar el enlace de verificación.
              </p>
              {!resendSent ? (
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={handleResend}
                    disabled={resendMutation.isPending || !resendEmail}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
                  >
                    {resendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Mail className="w-4 h-4 mr-2" />
                    )}
                    Reenviar enlace
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Correo enviado. Revisa tu bandeja de entrada.</span>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          ¿Problemas?{" "}
          <a href="mailto:soporte@iamet.mx" className="text-blue-400 hover:underline">
            Contacta a soporte
          </a>
        </p>
      </div>
    </div>
  );
}
