import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShoppingBag, Mail, Lock, User, Phone, Building2,
  Eye, EyeOff, Loader2, ArrowRight, CheckCircle, ArrowLeft
} from "lucide-react";

type Mode = "login" | "register" | "forgot" | "forgot_sent";

interface StoreUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
}

const STORE_TOKEN_KEY = "iamet_store_token";
const STORE_USER_KEY = "iamet_store_user";

export function saveStoreSession(token: string, user: StoreUser) {
  localStorage.setItem(STORE_TOKEN_KEY, token);
  localStorage.setItem(STORE_USER_KEY, JSON.stringify(user));
}

export function getStoreSession(): { token: string; user: StoreUser } | null {
  const token = localStorage.getItem(STORE_TOKEN_KEY);
  const raw = localStorage.getItem(STORE_USER_KEY);
  if (!token || !raw) return null;
  try {
    return { token, user: JSON.parse(raw) };
  } catch {
    return null;
  }
}

export function clearStoreSession() {
  localStorage.removeItem(STORE_TOKEN_KEY);
  localStorage.removeItem(STORE_USER_KEY);
}

export default function TiendaLogin() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  // Register form
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", confirm: "", phone: "", company: "" });
  // Forgot form
  const [forgotEmail, setForgotEmail] = useState("");

  const loginMutation = trpc.storeAuth.login.useMutation({
    onSuccess: (data) => {
      saveStoreSession(data.token, data.user);
      toast.success(`¡Bienvenido, ${data.user.name}!`);
      navigate("/tienda");
    },
    onError: (e) => toast.error(e.message),
  });

  const registerMutation = trpc.storeAuth.register.useMutation({
    onSuccess: () => {
      toast.success("Cuenta creada. Revisa tu correo para verificarla.");
      setMode("login");
    },
    onError: (e) => toast.error(e.message),
  });

  const forgotMutation = trpc.storeAuth.forgotPassword.useMutation({
    onSuccess: () => setMode("forgot_sent"),
    onError: (e) => toast.error(e.message),
  });

  const handleLogin = () => {
    if (!loginForm.email || !loginForm.password) { toast.error("Completa todos los campos"); return; }
    loginMutation.mutate({ email: loginForm.email, password: loginForm.password });
  };

  const handleRegister = () => {
    if (!regForm.name.trim()) { toast.error("Ingresa tu nombre"); return; }
    if (!regForm.email.trim()) { toast.error("Ingresa tu correo"); return; }
    if (regForm.password.length < 8) { toast.error("La contraseña debe tener al menos 8 caracteres"); return; }
    if (regForm.password !== regForm.confirm) { toast.error("Las contraseñas no coinciden"); return; }
    registerMutation.mutate({
      name: regForm.name.trim(),
      email: regForm.email.trim(),
      password: regForm.password,
      phone: regForm.phone.trim() || undefined,
      company: regForm.company.trim() || undefined,
      origin: window.location.origin,
    });
  };

  const handleForgot = () => {
    if (!forgotEmail.trim()) { toast.error("Ingresa tu correo"); return; }
    forgotMutation.mutate({ email: forgotEmail.trim(), origin: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-[#060d1f] flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzBmMjI0MCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-[#0a1628]/90 backdrop-blur border border-cyan-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-cyan-500/5">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500/10 via-blue-600/10 to-cyan-500/10 border-b border-white/10 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 mb-4">
              <ShoppingBag className="h-8 w-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">IAMET Tienda</h1>
            <p className="text-sm text-slate-400 mt-1">
              {mode === "login" && "Inicia sesión para acceder al catálogo"}
              {mode === "register" && "Crea tu cuenta para solicitar cotizaciones"}
              {mode === "forgot" && "Recupera tu contraseña"}
              {mode === "forgot_sent" && "Revisa tu correo"}
            </p>
          </div>

          <div className="p-8">
            {/* ── LOGIN ── */}
            {mode === "login" && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      value={loginForm.email}
                      onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="tu@empresa.com"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-slate-400">Contraseña</Label>
                    <button
                      onClick={() => setMode("forgot")}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPass ? "text" : "password"}
                      value={loginForm.password}
                      onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Tu contraseña"
                      className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  disabled={loginMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
                >
                  {loginMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Iniciando sesión...</>
                    : <><ArrowRight className="h-4 w-4 mr-2" />Iniciar sesión</>
                  }
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0a1628] px-3 text-slate-500">¿No tienes cuenta?</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setMode("register")}
                  className="w-full h-10 border-white/10 text-slate-300 hover:text-white hover:border-cyan-500/40 bg-transparent"
                >
                  Crear cuenta nueva
                </Button>
              </div>
            )}

            {/* ── REGISTER ── */}
            {mode === "register" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-slate-400">Nombre completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={regForm.name}
                        onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Tu nombre"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-slate-400">Correo electrónico *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        value={regForm.email}
                        onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="tu@empresa.com"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Contraseña * (mín. 8)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showPass ? "text" : "password"}
                        value={regForm.password}
                        onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Contraseña"
                        className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      />
                      <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPass ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Confirmar contraseña *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showPass2 ? "text" : "password"}
                        value={regForm.confirm}
                        onChange={e => setRegForm(f => ({ ...f, confirm: e.target.value }))}
                        placeholder="Repetir"
                        className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      />
                      <button type="button" onClick={() => setShowPass2(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                        {showPass2 ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="tel"
                        value={regForm.phone}
                        onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+52 55 1234 5678"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-400">Empresa</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={regForm.company}
                        onChange={e => setRegForm(f => ({ ...f, company: e.target.value }))}
                        placeholder="Tu empresa"
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={registerMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
                >
                  {registerMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creando cuenta...</>
                    : <><ArrowRight className="h-4 w-4 mr-2" />Crear cuenta</>
                  }
                </Button>

                <button
                  onClick={() => setMode("login")}
                  className="w-full flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white transition-colors py-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Ya tengo cuenta, iniciar sesión
                </button>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {mode === "forgot" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400 text-center">
                  Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.
                </p>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="tu@empresa.com"
                      className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500/50"
                      onKeyDown={e => e.key === "Enter" && handleForgot()}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleForgot}
                  disabled={forgotMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold"
                >
                  {forgotMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</>
                    : "Enviar enlace de recuperación"
                  }
                </Button>
                <button
                  onClick={() => setMode("login")}
                  className="w-full flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-white transition-colors py-1"
                >
                  <ArrowLeft className="h-3 w-3" /> Volver al login
                </button>
              </div>
            )}

            {/* ── FORGOT SENT ── */}
            {mode === "forgot_sent" && (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mx-auto">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Correo enviado</h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña. Válido por 2 horas.
                  </p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300">
                  Revisa también tu carpeta de spam o correo no deseado.
                </div>
                <Button
                  variant="outline"
                  onClick={() => setMode("login")}
                  className="w-full border-white/10 text-slate-300 hover:text-white bg-transparent"
                >
                  Volver al login
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-4">
          IAMET Evolución Tecnológica · Tienda en línea
        </p>
      </div>
    </div>
  );
}
