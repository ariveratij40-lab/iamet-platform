import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { saveStoreSession, useStoreSession } from "@/hooks/useStoreSession";
import { customerDestination, staffDestination } from "@shared/account-access";
import IametTechLogoV2 from "@/components/v2/IametTechLogoV2";
import TiendaLogin from "./TiendaLogin";

export function CustomerAccessRoute() {
  const mode = new URLSearchParams(window.location.search).get("mode");
  return mode === "register" || mode === "forgot" ? (
    <TiendaLogin />
  ) : (
    <AccountAccessV2 />
  );
}
export default function AccountAccessV2() {
  const [path] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const explicitTeam =
    path === "/admin/login" || params.get("perfil") === "equipo";
  const explicitClient =
    path === "/tienda/login" || params.get("perfil") === "cliente";
  const [profile, setProfile] = useState<"cliente" | "equipo">(
    explicitTeam ? "equipo" : "cliente"
  );
  const chosen = useRef(explicitTeam || explicitClient);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const auth = useLocalAuth();
  const customer = useStoreSession();
  const clientLogin = trpc.storeAuth.login.useMutation();
  const clientTarget = customerDestination(params.get("returnTo"));
  const staffTarget = staffDestination(params.get("returnTo"));
  const admin = profile === "equipo";
  useEffect(() => {
    if (!chosen.current && !auth.loading && auth.isAdmin) setProfile("equipo");
  }, [auth.loading, auth.isAdmin]);
  useEffect(() => {
    if (admin && !auth.loading && auth.isAuthenticated && auth.isAdmin)
      window.location.assign(staffTarget);
  }, [admin, auth.loading, auth.isAuthenticated, auth.isAdmin, staffTarget]);
  function selectProfile(next: "cliente" | "equipo") {
    chosen.current = true;
    setProfile(next);
    setPassword("");
    setShowPassword(false);
    setError("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    try {
      if (admin) {
        const result = await auth.login(email.trim(), password);
        if (!result.ok) setError(result.error ?? "No se pudo iniciar sesión.");
      } else {
        const result = await clientLogin.mutateAsync({
          email: email.trim(),
          password,
        });
        saveStoreSession(result.token, result.user);
        window.location.assign(clientTarget);
      }
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
  const roleDenied = admin && auth.isAuthenticated && !auth.isAdmin;
  return (
    <div className="iamet-account min-h-[calc(100dvh-80px)] bg-[#07111f] px-5 py-10 text-slate-100 sm:py-16">
      <div className="mx-auto grid max-w-5xl items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <section className="order-2 pt-2 lg:order-1 lg:pt-12">
          <IametTechLogoV2 className="mb-8 !w-48" />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.22em] text-blue-400">
            Su conexión con IAMET
          </p>
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Un solo lugar para entrar.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
            Acceda a sus servicios y dé seguimiento a lo que necesita su
            empresa.
          </p>
          <div className="mt-8 space-y-5">
            <div className="flex gap-3">
              <UserRound className="mt-1 shrink-0 text-blue-400" size={21} />
              <div>
                <h2 className="font-semibold">Portal de clientes</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Pedidos, órdenes de servicio, garantías y seguimiento de
                  tickets.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 shrink-0 text-blue-400" size={21} />
              <div>
                <h2 className="font-semibold">Equipo IAMET</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Acceso autorizado al CRM, prospectos y conversaciones del
                  asistente.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section
          aria-label="Acceso a Mi cuenta"
          className="order-1 rounded-3xl border border-white/10 bg-[#0c1b2e] p-5 shadow-2xl sm:p-8 lg:order-2"
        >
          <h2 className="text-2xl font-semibold">Mi cuenta</h2>
          <p className="mt-2 text-sm text-slate-400">
            Seleccione su tipo de acceso.
          </p>
          <div
            role="group"
            aria-label="Tipo de acceso"
            className="my-6 grid grid-cols-2 gap-2 rounded-xl bg-[#07111f] p-1.5"
          >
            {(["cliente", "equipo"] as const).map(p => (
              <button
                key={p}
                type="button"
                aria-pressed={profile === p}
                disabled={submitting}
                onClick={() => selectProfile(p)}
                className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${profile === p ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
              >
                {p === "cliente" ? "Clientes" : "Equipo IAMET"}
              </button>
            ))}
          </div>
          <p className="mb-5 text-sm leading-6 text-slate-300">
            {admin
              ? "Ingrese con su cuenta de administrador para acceder al CRM."
              : "Ingrese con su cuenta de cliente para consultar su portal."}
          </p>
          {!admin && customer.isAuthenticated && (
            <div className="mb-5 rounded-xl border border-blue-400/20 bg-blue-500/10 p-4">
              <p className="break-all text-sm text-blue-100">
                Cuenta guardada: {customer.user?.email}
              </p>
              <Link
                href={clientTarget}
                className="mt-2 inline-block text-sm font-semibold text-blue-300 underline"
              >
                Continuar a mi portal →
              </Link>
              <p className="mt-2 text-xs text-slate-400">
                También puede ingresar con otra cuenta abajo.
              </p>
            </div>
          )}
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
                placeholder={admin ? "nombre@iamet.mx" : "nombre@empresa.com"}
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
            {(error || roleDenied) && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm leading-6 text-red-200"
              >
                {error ||
                  "Esta cuenta no tiene permisos de administrador para acceder al CRM."}
              </p>
            )}
            <button
              disabled={submitting || (admin && auth.loading)}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Ingresando…
                </>
              ) : (
                <>
                  {admin ? "Entrar al CRM" : "Entrar a mi portal"}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          {admin ? (
            <p className="mt-6 text-xs leading-6 text-slate-400">
              El acceso al CRM está reservado al personal autorizado. Si
              necesita recuperar su cuenta, contacte al administrador de IAMET.
            </p>
          ) : (
            <div className="mt-6 space-y-4 border-t border-white/10 pt-5 text-sm">
              <Link
                href="/tienda/login?mode=forgot&returnTo=%2Fgarantias"
                className="block text-blue-300 hover:underline"
              >
                ¿Olvidó su contraseña?
              </Link>
              <p className="text-slate-400">
                ¿Es su primera visita?{" "}
                <Link
                  href="/tienda/login?mode=register&returnTo=%2Fgarantias"
                  className="font-semibold text-blue-300 hover:underline"
                >
                  Crear cuenta de cliente
                </Link>
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
