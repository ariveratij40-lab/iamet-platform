import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ShoppingBag, Mail, User, Phone, Loader2, CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import type { StoreVisitor } from "@/hooks/useStoreAuth";

type Step = "register" | "check_email" | "sent" | "verify";

interface Props {
  open: boolean;
  onAuthenticated: (visitor: StoreVisitor) => void;
}

export function StoreAuthModal({ open, onAuthenticated }: Props) {
  const [step, setStep] = useState<Step>("register");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [token, setToken] = useState("");
  const [emailExists, setEmailExists] = useState(false);

  const registerMutation = trpc.storeAuth.register.useMutation({
    onSuccess: () => setStep("sent"),
    onError: (e) => toast.error(e.message),
  });

  const verifyMutation = trpc.storeAuth.verify.useMutation({
    onSuccess: (data) => {
      toast.success(`¡Bienvenido, ${data.visitor.name}!`);
      onAuthenticated({ name: data.visitor.name, email: data.visitor.email, sessionToken: data.sessionToken });
    },
    onError: (e) => toast.error(e.message),
  });

  const resendMutation = trpc.storeAuth.resend.useMutation({
    onSuccess: () => toast.success("Correo reenviado"),
    onError: (e) => toast.error(e.message),
  });

  const checkEmailQuery = trpc.storeAuth.checkEmail.useQuery(
    { email: form.email },
    { enabled: step === "check_email" && !!form.email }
  );

  // When check_email query resolves, decide next step
  if (step === "check_email" && checkEmailQuery.data) {
    if (checkEmailQuery.data.verified) {
      // Already verified — ask for token directly
      setStep("verify");
    } else if (checkEmailQuery.data.exists) {
      // Exists but not verified — resend
      setEmailExists(true);
      setStep("sent");
    } else {
      // New user — register
      setStep("register");
    }
  }

  const handleRegister = () => {
    if (!form.name.trim()) { toast.error("Por favor ingresa tu nombre"); return; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("Ingresa un email válido"); return; }
    registerMutation.mutate({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() || undefined });
  };

  const handleVerify = () => {
    if (!token.trim()) { toast.error("Ingresa el token de verificación"); return; }
    verifyMutation.mutate({ token: token.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md bg-[#0a1628] border border-cyan-500/20 text-white p-0 overflow-hidden"
        onInteractOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-white/10 p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 mb-3">
            <ShoppingBag className="h-7 w-7 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Tienda IAMET</h2>
          <p className="text-sm text-slate-400 mt-1">
            {step === "sent"
              ? "Revisa tu correo electrónico"
              : step === "verify"
              ? "Ingresa tu token de acceso"
              : "Regístrate para acceder al catálogo"}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* ── Step: Register ── */}
          {step === "register" && (
            <>
              <p className="text-sm text-slate-400 text-center">
                Para ver precios y solicitar cotizaciones, necesitamos tus datos de contacto. Solo toma 30 segundos.
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">Nombre completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Tu nombre"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      onKeyDown={e => e.key === "Enter" && handleRegister()}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">Correo electrónico *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="tu@empresa.com"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      onKeyDown={e => e.key === "Enter" && handleRegister()}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-400 mb-1 block">Teléfono (opcional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+52 55 1234 5678"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                      onKeyDown={e => e.key === "Enter" && handleRegister()}
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={handleRegister}
                disabled={registerMutation.isPending}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-11"
              >
                {registerMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
                  : <><ArrowRight className="h-4 w-4 mr-2" />Acceder a la tienda</>
                }
              </Button>
              <p className="text-xs text-slate-500 text-center">
                Al registrarte aceptas que IAMET te contacte con información sobre tus solicitudes.
              </p>
            </>
          )}

          {/* ── Step: Email Sent ── */}
          {step === "sent" && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                <Mail className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">Correo enviado a</p>
                <p className="text-cyan-400 font-semibold">{form.email}</p>
              </div>
              <p className="text-sm text-slate-400">
                Hemos enviado un enlace de verificación a tu correo. Haz clic en el enlace para acceder a la tienda.
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
                <strong>¿No ves el correo?</strong> Revisa tu carpeta de spam o correo no deseado.
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => resendMutation.mutate({ email: form.email })}
                  disabled={resendMutation.isPending}
                  className="w-full border-white/10 text-slate-300 hover:text-white text-sm"
                >
                  {resendMutation.isPending
                    ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Reenviando...</>
                    : <><RefreshCw className="h-3 w-3 mr-1" />Reenviar correo</>
                  }
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep("verify")}
                  className="w-full text-slate-400 hover:text-white text-sm"
                >
                  Ya tengo el token de verificación
                </Button>
              </div>
            </div>
          )}

          {/* ── Step: Verify Token ── */}
          {step === "verify" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 text-center">
                Ingresa el token que recibiste en tu correo electrónico para acceder a la tienda.
              </p>
              <div>
                <Label className="text-xs text-slate-400 mb-1 block">Token de verificación</Label>
                <Input
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="Pega aquí el token del correo"
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 font-mono text-sm"
                  onKeyDown={e => e.key === "Enter" && handleVerify()}
                />
              </div>
              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-11"
              >
                {verifyMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verificando...</>
                  : <><CheckCircle className="h-4 w-4 mr-2" />Verificar y acceder</>
                }
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep("register")}
                className="w-full text-slate-400 hover:text-white text-sm"
              >
                Volver al registro
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
