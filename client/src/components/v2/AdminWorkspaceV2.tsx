import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import IametTechLogoV2 from "./IametTechLogoV2";

export default function AdminWorkspaceV2({
  children,
}: {
  children: ReactNode;
}) {
  const [path] = useLocation();
  const { user, logout } = useLocalAuth();
  return (
    <div className="iamet-crm min-h-screen bg-[#07111f] text-slate-100">
      <header className="border-b border-white/10 bg-[#0b1829]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <Link href="/admin/crm" aria-label="IAMET · Panel de administración">
            <IametTechLogoV2 className="!w-36 text-white" />
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-slate-400 md:inline">
              {user?.email}
            </span>
            <Link href="/" className="flex items-center gap-1 text-blue-200">
              Ver sitio <ArrowUpRight size={15} />
            </Link>
            <button
              onClick={async () => {
                await logout();
                window.location.assign("/acceso");
              }}
              aria-label="Cerrar sesión"
              className="rounded-lg border border-white/10 p-2 hover:bg-white/5"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
        <nav
          aria-label="Áreas de administración"
          className="mx-auto flex max-w-7xl flex-wrap gap-2 px-5 pb-4"
        >
          {[
            { href: "/admin/crm", label: "CRM", Icon: LayoutDashboard },
            { href: "/admin/campanas", label: "Campañas", Icon: BarChart3 },
            {
              href: "/admin/garantias",
              label: "Garantías y órdenes",
              Icon: ShieldCheck,
            },
          ].map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={path === href ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium ${path === href ? "bg-blue-600/15 text-blue-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>
      <footer className="mx-auto max-w-7xl px-5 pb-8 text-xs text-slate-500">
        Acceso privado · IAMET · Tijuana, Mexicali, Tecate y Ensenada
      </footer>
    </div>
  );
}
