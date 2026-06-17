import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Shield, Cpu, Zap, BookOpen, Phone, LogIn,
  LayoutDashboard, ChevronRight, ChevronLeft, X, Home,
  Server, Brain, Headphones, FileCheck, Globe, Activity, ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// ─── Nav items con iconos ─────────────────────────────────────────────────────
const navItems = [
  {
    label: "Soluciones",
    icon: LayoutGrid,
    href: "/soluciones",
    children: [
      { label: "Infraestructura Tecnológica", href: "/soluciones/infraestructura", icon: Server },
      { label: "Seguridad Electrónica", href: "/soluciones/seguridad", icon: Shield },
      { label: "RFID y Automatización", href: "/soluciones/rfid", icon: Cpu },
      { label: "Software e IA", href: "/soluciones/software-ia", icon: Brain },
      { label: "Servicios Administrados", href: "/soluciones/servicios-administrados", icon: Headphones },
      { label: "Compliance y Auditoría", href: "/soluciones/compliance", icon: FileCheck },
    ],
  },
  { label: "Industrias", icon: Globe, href: "/industrias" },
  { label: "Tech Advisor", icon: Zap, href: "/tech-advisor" },
  { label: "Academy", icon: BookOpen, href: "/academy" },
  { label: "Tienda", icon: ShoppingCart, href: "/tienda" },
  { label: "Contacto", icon: Phone, href: "/contacto" },
];

export default function Navbar() {
  const [expanded, setExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const handleItemClick = useCallback((item: typeof navItems[0]) => {
    if (item.children) {
      setActiveSubmenu(prev => prev === item.label ? null : item.label);
    } else {
      setExpanded(false);
      setActiveSubmenu(null);
      if (item.href) navigate(item.href);
    }
  }, [navigate]);

  const sidebarWidth = expanded ? 260 : 56;

  return (
    <>
      {/* ── Logo fijo — esquina superior izquierda ──────────────────────────── */}
      <div className="fixed top-0 left-0 z-50 p-3">
        <Link href="/">
          <img
            src="/manus-storage/logo-iamet-v2-final_a0aa3f89.png"
            alt="IAMET"
            className="h-[52px] w-auto object-contain hover:opacity-90 transition-opacity duration-200"
            style={{ filter: "drop-shadow(0 1px 4px oklch(0.55 0.18 255 / 0.20))" }}
          />
        </Link>
      </div>

      {/* ── Overlay cuando el sidebar está expandido ────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "oklch(0 0 0 / 0.45)", backdropFilter: "blur(2px)" }}
            onClick={() => { setExpanded(false); setActiveSubmenu(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar derecho ─────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          background: "var(--color-iamet-bg-secondary)",
          borderLeft: "1px solid var(--color-iamet-border-subtle)",
          boxShadow: expanded ? "-4px 0 32px oklch(0 0 0 / 0.4)" : "-2px 0 12px oklch(0 0 0 / 0.2)",
        }}
      >
        {/* Toggle button */}
        <div className="flex items-center justify-end p-3 border-b border-[var(--color-iamet-border-subtle)] h-[68px] flex-shrink-0">
          <button
            onClick={() => { setExpanded(!expanded); if (expanded) setActiveSubmenu(null); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-iamet-text-subtle)] hover:text-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-surface)] transition-all duration-150 btn-press"
            aria-label={expanded ? "Colapsar menú" : "Expandir menú"}
          >
            {expanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
          {/* Inicio */}
          <Link href="/" onClick={() => { setExpanded(false); setActiveSubmenu(null); }}>
            <button
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 group relative ${
                location === "/"
                  ? "text-[var(--color-iamet-accent)] bg-[var(--color-iamet-accent-muted)]"
                  : "text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-text)] hover:bg-[var(--color-iamet-surface)]"
              }`}
              title={!expanded ? "Inicio" : undefined}
            >
              {location === "/" && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background: "var(--color-iamet-accent)" }}
                />
              )}
              <Home className="flex-shrink-0" style={{ width: 18, height: 18 }} />
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18 }}
                    className="text-sm font-medium whitespace-nowrap flex-1"
                  >
                    Inicio
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </Link>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const submenuOpen = activeSubmenu === item.label;

            return (
              <div key={item.label}>
                {/* Main item */}
                <button
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 group relative ${
                    active
                      ? "text-[var(--color-iamet-accent)] bg-[var(--color-iamet-accent-muted)]"
                      : "text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-text)] hover:bg-[var(--color-iamet-surface)]"
                  }`}
                  title={!expanded ? item.label : undefined}
                >
                  {/* Active indicator */}
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: "var(--color-iamet-accent)" }}
                    />
                  )}
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
                  <AnimatePresence>
                    {expanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.18 }}
                        className="text-sm font-medium whitespace-nowrap flex-1"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {expanded && item.children && (
                    <motion.div
                      animate={{ rotate: submenuOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                    </motion.div>
                  )}
                </button>

                {/* Submenu */}
                <AnimatePresence>
                  {expanded && item.children && submenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                      style={{ background: "var(--color-iamet-bg)" }}
                    >
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => { setExpanded(false); setActiveSubmenu(null); }}
                            className="flex items-center gap-2.5 px-5 py-2 text-xs text-[var(--color-iamet-text-subtle)] hover:text-[var(--color-iamet-text)] hover:bg-[var(--color-iamet-surface)] transition-colors duration-150"
                          >
                            <ChildIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                            <span className="whitespace-nowrap">{child.label}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Auth section */}
        <div className="border-t border-[var(--color-iamet-border-subtle)] py-3 flex-shrink-0">
          {user ? (
            <>
            <Link href="/admin/monitor" onClick={() => setExpanded(false)}>
              <button
                className="w-full flex items-center gap-3 px-4 py-2 text-[var(--color-iamet-text-muted)] hover:text-green-600 hover:bg-green-50 transition-all duration-150"
                title={!expanded ? "Monitor en Vivo" : undefined}
              >
                <Activity style={{ width: 18, height: 18 }} className="flex-shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      Monitor en Vivo
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </Link>
            <Link href="/admin" onClick={() => setExpanded(false)}>
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-surface)] transition-all duration-150"
                title={!expanded ? "Dashboard" : undefined}
              >
                <LayoutDashboard style={{ width: 18, height: 18 }} className="flex-shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      Dashboard
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </Link>
            </>
          ) : (
            <a href={getLoginUrl()}>
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-surface)] transition-all duration-150"
                title={!expanded ? "Iniciar Sesión" : undefined}
              >
                <LogIn style={{ width: 18, height: 18 }} className="flex-shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      Iniciar Sesión
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </a>
          )}
        </div>
      </motion.aside>

      {/* Spacer para que el contenido no quede debajo del sidebar */}
      <div className="fixed top-0 right-0 pointer-events-none" style={{ width: sidebarWidth }} />
    </>
  );
}
