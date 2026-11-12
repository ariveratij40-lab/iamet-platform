import { useRef, useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { saveStoreSession, clearStoreSession } from "@/hooks/useStoreSession";
import { customerDestination, staffDestination } from "@shared/account-access";
import TiendaLogin from "./TiendaLogin";

export function CustomerAccessRoute() {
  const mode = new URLSearchParams(window.location.search).get("mode");
  return mode === "register" || mode === "forgot" || mode === "resend" ? (
    <TiendaLogin />
  ) : (
    <AccountAccessV2 />
  );
}
export default function AccountAccessV2() {
  const params = new URLSearchParams(window.location.search);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/access", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json"))
        throw new Error("No se pudo conectar. Intente nuevamente más tarde.");
      const result = await response.json();
      if (!response.ok || !result.ok)
        throw new Error(result.error ?? "No se pudo iniciar sesión.");
      if (result.kind === "admin") {
        clearStoreSession();
        localStorage.setItem("iamet_local_user", JSON.stringify(result.user));
        window.location.assign(staffDestination(params.get("returnTo")));
      } else if (result.kind === "customer" && result.token && result.user) {
        localStorage.removeItem("iamet_local_user");
        saveStoreSession(result.token, result.user);
        window.location.assign(customerDestination(params.get("returnTo")));
      } else throw new Error("No se pudo iniciar sesión.");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo conectar. Intente nuevamente."
      );
    } finally {
      setPassword("");
      submittingRef.current = false;
      setSubmitting(false);
    }
  }
  return (
    <div className="iamet-account flex min-h-[calc(100dvh-80px)] items-start justify-center bg-[#07111f] px-5 py-10 text-slate-100 sm:py-16">
      <section
        aria-label="Acceso a Mi cuenta"
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0c1b2e] p-6 shadow-2xl sm:p-8"
      >
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mb-7 mt-2 text-sm text-slate-400">
          Bienvenido a su cuenta IAMET.
        </p>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label
              htmlFor="account-email"
              className="mb-2 block text-sm text-slate-300"
            >
              Correo electrónico
            </label>
            <input
              id="account-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={320}
              value={email}
              disabled={submitting}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              className="h-12 w-full rounded-xl border border-slate-700 bg-[#07111f] px-4 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label
              htmlFor="account-password"
              className="mb-2 block text-sm text-slate-300"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="account-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={1000}
                value={password}
                disabled={submitting}
                onChange={e => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-[#07111f] pl-4 pr-12 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword(p => !p)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm leading-6 text-red-200"
            >
              {error}
            </p>
          )}
          <button
            disabled={submitting}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Ingresando…
              </>
            ) : (
              <>
                Iniciar sesión
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
        {error.toLowerCase().includes("verifi") && (
          <Link
            href="/tienda/login?mode=resend&returnTo=%2Fgarantias"
            className="mt-4 block text-sm font-semibold text-blue-300 hover:underline"
          >
            Reenviar confirmación de correo
          </Link>
        )}
        <Link
          href="/tienda/login?mode=forgot&returnTo=%2Fgarantias"
          className="mt-5 block text-sm text-blue-300 hover:underline"
        >
          ¿Olvidó su contraseña?
        </Link>
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-sm leading-6 text-slate-400">
            Al registrarse podrá consultar sus pedidos, tramitar garantías y dar
            seguimiento a sus tickets en un solo lugar.
          </p>
          <Link
            href="/tienda/login?mode=register&returnTo=%2Fgarantias"
            className="mt-3 inline-block text-sm font-semibold text-blue-300 hover:underline"
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    </div>
  );
}
