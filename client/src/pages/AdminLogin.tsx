/**
 * Página de login local para administradores IAMET
 * Ruta: /admin/login
 * Diseño: neumorfismo con paleta IAMET (azul oscuro + cian)
 */
import { useState, useEffect } from "react";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const { login, isAuthenticated, loading: authLoading } = useLocalAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      window.location.href = returnTo ?? "/admin/crm";
    }
  }, [isAuthenticated, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña");
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Credenciales inválidas");
    }
    // Si ok=true, el useEffect de arriba redirige automáticamente
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a1628 100%)",
      }}
    >
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00d4ff 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0066cc 0%, transparent 70%)" }}
        />
      </div>

      {/* Card neumorfismo */}
      <div
        className="relative w-full max-w-md p-8 rounded-2xl"
        style={{
          background: "#0d1b2a",
          boxShadow:
            "8px 8px 20px rgba(0,0,0,0.6), -4px -4px 12px rgba(0,100,180,0.08), inset 0 1px 0 rgba(0,212,255,0.06)",
          border: "1px solid rgba(0,212,255,0.1)",
        }}
      >
        {/* Logo / Icono */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg, #0066cc, #00d4ff)",
              boxShadow: "0 4px 20px rgba(0,212,255,0.3)",
            }}
          >
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            IAMET Admin
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Acceso al panel de administración
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@iamet.mx"
              autoComplete="email"
              disabled={submitting}
              className="h-11"
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(0,212,255,0.15)",
                color: "white",
              }}
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
              Contraseña
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={submitting}
                className="h-11 pr-10"
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0,212,255,0.15)",
                  color: "white",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
              style={{
                background: "rgba(220,38,38,0.1)",
                border: "1px solid rgba(220,38,38,0.3)",
                color: "#fca5a5",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Botón */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 font-semibold text-white transition-all duration-150 active:scale-[0.97]"
            style={{
              background: submitting
                ? "rgba(0,100,180,0.4)"
                : "linear-gradient(135deg, #0066cc, #00d4ff)",
              boxShadow: submitting ? "none" : "0 4px 15px rgba(0,212,255,0.25)",
              border: "none",
            }}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verificando...
              </span>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          IAMET Evolución Tecnológica · Acceso restringido
        </p>
      </div>
    </div>
  );
}
