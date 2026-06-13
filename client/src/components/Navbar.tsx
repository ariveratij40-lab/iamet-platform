import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const navItems = [
  {
    label: "Soluciones",
    href: "/soluciones",
    children: [
      { label: "Infraestructura Tecnológica", href: "/soluciones/infraestructura" },
      { label: "Seguridad Electrónica", href: "/soluciones/seguridad" },
      { label: "RFID y Automatización", href: "/soluciones/rfid" },
      { label: "Software e IA", href: "/soluciones/software-ia" },
      { label: "Servicios Administrados", href: "/soluciones/servicios-administrados" },
      { label: "Compliance y Auditoría", href: "/soluciones/compliance" },
    ],
  },
  { label: "Industrias", href: "/industrias" },
  { label: "Tech Advisor", href: "/tech-advisor" },
  { label: "Academy", href: "/academy" },
  { label: "Contacto", href: "/contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [location] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-[var(--color-iamet-border-subtle)]"
          : "bg-transparent"
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <img
              src="/manus-storage/logo-iamet-v2026-transparent_e88846a1.png"
              alt="IAMET Evolución Tecnológica"
              className="h-[66px] w-auto object-contain group-hover:opacity-90 transition-opacity duration-200"
              style={{ filter: "drop-shadow(0 0 6px oklch(0.55 0.22 240 / 0.4))" }}
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.children && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    location.startsWith(item.href)
                      ? "text-[var(--color-iamet-accent)] bg-[var(--color-iamet-accent-muted)]"
                      : "text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-text)] hover:bg-[var(--color-iamet-surface)]"
                  }`}
                >
                  {item.label}
                  {item.children && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === item.label ? "rotate-180" : ""}`}
                    />
                  )}
                </Link>

                {/* Dropdown */}
                <AnimatePresence>
                  {item.children && activeDropdown === item.label && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full left-0 mt-1 w-64 neumorphic rounded-xl overflow-hidden"
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-text)] hover:bg-[var(--color-iamet-surface-2)] transition-colors duration-150"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          {/* CTA + Auth */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link href="/admin">
                <Button
                  size="sm"
                  className="bg-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-hover)] text-white font-semibold btn-press glow-accent-sm"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost" size="sm" className="text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-text)]">
                    Iniciar Sesión
                  </Button>
                </a>
                <Link href="/contacto">
                  <Button
                    size="sm"
                    className="bg-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-hover)] text-white font-semibold btn-press glow-accent-sm"
                  >
                    Hablar con un Experto
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-text)] hover:bg-[var(--color-iamet-surface)] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="lg:hidden glass border-t border-[var(--color-iamet-border-subtle)] overflow-hidden"
          >
            <nav className="container py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-text)] hover:bg-[var(--color-iamet-surface)] transition-colors"
                  >
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className="ml-4 mt-1 flex flex-col gap-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-3 py-2 rounded-lg text-xs text-[var(--color-iamet-text-subtle)] hover:text-[var(--color-iamet-text-muted)] hover:bg-[var(--color-iamet-surface)] transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-3 border-t border-[var(--color-iamet-border-subtle)] flex flex-col gap-2">
                <Link href="/contacto">
                  <Button className="w-full bg-[var(--color-iamet-accent)] text-white font-semibold">
                    Hablar con un Experto
                  </Button>
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
