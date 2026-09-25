import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Languages, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO =
  "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/logos/logo-iamet-v2-final.png";

export default function PublicHeaderV2() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const items = [
    { href: "/soluciones", label: language === "es" ? "Soluciones" : "Solutions" },
    { href: "/industrias", label: language === "es" ? "Industrias" : "Industries" },
    { href: "/academy", label: "Academy" },
    { href: "/tienda", label: language === "es" ? "Tienda" : "Store" },
    { href: "/contacto", label: language === "es" ? "Contacto" : "Contact" },
  ];

  const active = (href: string) =>
    location === href || (href !== "/" && location.startsWith(`${href}/`));

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "color-mix(in oklch, var(--color-iamet-bg) 92%, transparent)",
        borderBottom: "1px solid var(--color-iamet-border-subtle)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center">
          <img
            src={LOGO}
            alt="IAMET"
            className="h-9 w-auto object-contain"
          />
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {items.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
              style={{
                color: active(item.href)
                  ? "var(--color-iamet-accent)"
                  : "var(--color-iamet-text-muted)",
                background: active(item.href)
                  ? "var(--color-iamet-accent-muted)"
                  : "transparent",
              }}
            >
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setLanguage(language === "es" ? "en" : "es")}
            className="ml-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
            style={{ color: "var(--color-iamet-text-muted)" }}
            aria-label={language === "es" ? "Cambiar a inglés" : "Switch to Spanish"}
          >
            <Languages className="h-4 w-4" />
            {language.toUpperCase()}
          </button>

          <Link
            href="/tech-advisor"
            className="ml-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{
              background: "var(--color-iamet-accent)",
              color: "white",
              boxShadow: "0 8px 24px color-mix(in oklch, var(--color-iamet-accent) 22%, transparent)",
            }}
          >
            <MessageCircle className="h-4 w-4" />
            {language === "es" ? "Hablar con ARIA" : "Talk to ARIA"}
          </Link>
        </nav>

        <button
          type="button"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg lg:hidden"
          style={{ color: "var(--color-iamet-text)" }}
          onClick={() => setMobileOpen(v => !v)}
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="border-t px-5 py-4 lg:hidden"
          style={{
            background: "var(--color-iamet-bg)",
            borderColor: "var(--color-iamet-border-subtle)",
          }}
        >
          <nav className="mx-auto flex max-w-[1440px] flex-col gap-1">
            {items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{
                  color: active(item.href)
                    ? "var(--color-iamet-accent)"
                    : "var(--color-iamet-text)",
                  background: active(item.href)
                    ? "var(--color-iamet-accent-muted)"
                    : "transparent",
                }}
              >
                {item.label}
              </Link>
            ))}

            <div
              className="my-2 h-px"
              style={{ background: "var(--color-iamet-border-subtle)" }}
            />

            <button
              type="button"
              onClick={() => setLanguage(language === "es" ? "en" : "es")}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium"
              style={{ color: "var(--color-iamet-text)" }}
            >
              <Languages className="h-4 w-4" />
              {language === "es" ? "English" : "Español"}
            </button>

            <Link
              href="/tech-advisor"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
              style={{
                background: "var(--color-iamet-accent)",
                color: "white",
              }}
            >
              <MessageCircle className="h-4 w-4" />
              {language === "es" ? "Hablar con ARIA" : "Talk to ARIA"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
