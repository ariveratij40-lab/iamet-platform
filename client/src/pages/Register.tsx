import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  MessageSquare,
  History,
  Star,
  Shield,
  Zap,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Phone,
  Mail,
  User,
  Lock,
} from "lucide-react";

const BENEFITS = [
  {
    icon: History,
    title: "Historial de conversaciones",
    description:
      "Accede a todas tus conversaciones con el agente ARIA en cualquier momento. Retoma donde lo dejaste.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: MessageSquare,
    title: "Cotizaciones guardadas",
    description:
      "Tus solicitudes de cotización quedan vinculadas a tu cuenta para seguimiento rápido.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Zap,
    title: "Respuestas prioritarias",
    description:
      "Los suscriptores registrados reciben atención prioritaria de nuestros ingenieros especializados.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Star,
    title: "Contenido exclusivo",
    description:
      "Accede a guías técnicas, casos de estudio y recursos exclusivos de IAMET Academy.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Shield,
    title: "Perfil de empresa",
    description:
      "Mantén tu información empresarial actualizada para propuestas técnicas más precisas.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
];

export default function Register() {
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    phone: "",
  });

  const registerMutation = trpc.subscribers.register.useMutation({
    onSuccess: () => {
      setSuccess(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      name: form.name,
      email: form.email,
      password: form.password,
      company: form.company || undefined,
      phone: form.phone || undefined,
    });
  };

  const updateField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
        <div
          className="max-w-md w-full text-center p-8 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)",
            boxShadow:
              "8px 8px 16px rgba(0,0,0,0.4), -4px -4px 12px rgba(30,58,138,0.08)",
          }}
        >
          <div className="w-20 h-20 rounded-full bg-cyan-400/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            ¡Cuenta creada exitosamente!
          </h2>
          <p className="text-slate-400 mb-8">
            Ya puedes iniciar sesión y empezar a guardar el historial de tus
            conversaciones con ARIA.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => navigate("/login-suscriptor")}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 rounded-xl transition-all duration-200"
            >
              Iniciar sesión
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full text-slate-400 hover:text-white"
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer">
              IAMET
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span>¿Ya tienes cuenta?</span>
            <Link href="/login-suscriptor">
              <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium">
                Iniciar sesión
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Columna izquierda: Beneficios */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-4 py-1.5 text-cyan-400 text-sm font-medium mb-6">
              <Star className="w-4 h-4" />
              Acceso gratuito
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Registrate y guarda el{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                historial de tus proyectos
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Crea tu cuenta gratuita para acceder a todas tus conversaciones
              con ARIA, guardar cotizaciones y recibir atención prioritaria de
              nuestros ingenieros.
            </p>
          </div>

          {/* Beneficios */}
          <div className="space-y-4">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="flex items-start gap-4 p-4 rounded-xl border border-white/5 transition-all duration-200 hover:border-white/10"
                  style={{
                    background:
                      "linear-gradient(135deg, #0d1526 0%, #111827 100%)",
                    boxShadow:
                      "4px 4px 8px rgba(0,0,0,0.3), -2px -2px 6px rgba(30,58,138,0.05)",
                  }}
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${benefit.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${benefit.color}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">
                      {benefit.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Social proof */}
          <div
            className="p-4 rounded-xl border border-white/5"
            style={{
              background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((letter) => (
                  <div
                    key={letter}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 border-2 border-[#0a0f1e] flex items-center justify-center text-white text-xs font-bold"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-slate-300 text-sm">
                <span className="text-white font-semibold">+200 empresas</span>{" "}
                ya usan IAMET
              </p>
            </div>
            <p className="text-slate-400 text-xs">
              Empresas de manufactura, logística, salud y retail confían en
              nuestras soluciones tecnológicas.
            </p>
          </div>
        </div>

        {/* Columna derecha: Formulario */}
        <div
          className="rounded-2xl p-8 border border-white/5"
          style={{
            background: "linear-gradient(135deg, #0d1526 0%, #111827 100%)",
            boxShadow:
              "8px 8px 20px rgba(0,0,0,0.4), -4px -4px 12px rgba(30,58,138,0.08)",
          }}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Crear cuenta gratuita
            </h2>
            <p className="text-slate-400 text-sm">
              Sin tarjeta de crédito. Sin compromisos.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">
                Nombre completo *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Ej. Carlos Rodríguez"
                  value={form.name}
                  onChange={updateField("name")}
                  required
                  minLength={2}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">
                Correo electrónico *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="email"
                  placeholder="correo@empresa.com"
                  value={form.email}
                  onChange={updateField("email")}
                  required
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">
                Contraseña *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={updateField("password")}
                  required
                  minLength={8}
                  className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Empresa (opcional) */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">
                Empresa{" "}
                <span className="text-slate-500 font-normal">(opcional)</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="text"
                  placeholder="Nombre de tu empresa"
                  value={form.company}
                  onChange={updateField("company")}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl"
                />
              </div>
            </div>

            {/* Teléfono (opcional) */}
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm font-medium">
                Teléfono{" "}
                <span className="text-slate-500 font-normal">(opcional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={form.phone}
                  onChange={updateField("phone")}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl"
                />
              </div>
            </div>

            {/* Error */}
            {registerMutation.error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {registerMutation.error.message}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Crear cuenta gratuita
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <p className="text-center text-slate-500 text-xs">
              Al registrarte aceptas nuestros{" "}
              <span className="text-slate-400 cursor-pointer hover:text-white">
                Términos de servicio
              </span>{" "}
              y{" "}
              <span className="text-slate-400 cursor-pointer hover:text-white">
                Política de privacidad
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
