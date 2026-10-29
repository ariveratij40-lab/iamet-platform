import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Languages, Menu, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import SolutionsMenuV2 from "./SolutionsMenuV2";

const LOGO =
  "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/logos/logo-iamet-v2-final.png";

export default function PublicHeaderV2() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const es = language === "es";
  useEffect(() => setMobileOpen(false), [location]);
  const items = [
    { href: "/", label: es ? "Inicio" : "Home" },
    { href: "/soluciones", label: es ? "Soluciones" : "Solutions" },
    { href: "/industrias", label: es ? "Industrias" : "Industries" },
    { href: "/academy", label: "Academy" },
    { href: "/tienda", label: es ? "Tienda" : "Store" },
    { href: "/tech-advisor", label: es ? "Asesor virtual" : "Virtual advisor" },
  ];
  const active = (href: string) =>
    location === href || (href !== "/" && location.startsWith(`${href}/`));
  const toggleLanguage = () => setLanguage(es ? "en" : "es");
  const contact = es ? "Contáctanos" : "Contact us";

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,.03)]"
      onKeyDown={event => {
        if (event.key === "Escape") {
          setMobileOpen(false);
          document.getElementById("public-menu-toggle")?.focus();
        }
      }}
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-6 px-5 lg:px-8 xl:gap-10">
        <Link
          href="/"
          aria-label={es ? "IAMET — Inicio" : "IAMET — Home"}
          className="flex shrink-0 items-center rounded focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <img
            src={LOGO}
            alt="IAMET"
            className="h-[46.8px] w-auto object-contain"
          />
        </Link>

        <nav
          aria-label={es ? "Navegación principal" : "Main navigation"}
          className="ml-auto hidden h-full items-center gap-5 lg:flex xl:gap-7"
        >
          {items.map(item =>
            item.href === "/soluciones" ? (
              <SolutionsMenuV2 key={item.href} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active(item.href) ? "page" : undefined}
                className={`inline-flex h-full items-center whitespace-nowrap border-b-2 pt-0.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${active(item.href) ? "border-blue-600 text-blue-600" : "border-transparent text-slate-600 hover:border-blue-200 hover:text-blue-600"}`}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden shrink-0 items-center gap-4 border-l border-slate-200 pl-5 lg:flex xl:pl-7">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={es ? "Cambiar a inglés" : "Switch to Spanish"}
            className="inline-flex h-10 items-center gap-1.5 rounded-md px-1 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Languages className="h-4 w-4" />
            {language.toUpperCase()}
          </button>
          <Link
            href="/contacto"
            aria-current={active("/contacto") ? "page" : undefined}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {contact}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          id="public-menu-toggle"
          type="button"
          className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
          onClick={() => setMobileOpen(open => !open)}
          aria-label={
            es
              ? mobileOpen
                ? "Cerrar menú"
                : "Abrir menú"
              : mobileOpen
                ? "Close menu"
                : "Open menu"
          }
          aria-expanded={mobileOpen}
          aria-controls="public-mobile-menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div
          id="public-mobile-menu"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-80px)] overflow-y-auto border-b border-t border-slate-200 bg-white px-5 py-4 shadow-lg lg:hidden"
        >
          <nav
            aria-label={es ? "Navegación móvil" : "Mobile navigation"}
            className="mx-auto flex max-w-[1440px] flex-col"
          >
            {items.map(item =>
              item.href === "/soluciones" ? (
                <SolutionsMenuV2
                  key={item.href}
                  mobile
                  onNavigate={() => setMobileOpen(false)}
                />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active(item.href) ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-between border-b border-slate-100 px-3 text-sm font-medium ${active(item.href) ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {item.label}
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              )
            )}
            <div className="mt-4 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-slate-600"
              >
                <Languages className="h-4 w-4" />
                {es ? "English" : "Español"}
              </button>
              <Link
                href="/contacto"
                onClick={() => setMobileOpen(false)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {contact}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
