import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Cpu, Zap, BookOpen, Phone, LogIn,
  LayoutDashboard, ChevronRight, ChevronLeft, Home,
  Server, Brain, FileCheck, Globe, ShoppingCart,
  Sun, Moon, Languages, Activity,
  KeyRound, Camera, Volume2, Monitor, Laptop, ClipboardList, Network,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Navbar() {
  const [expanded, setExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  // Nav items usando traducciones
  const navItems = [
    {
      label: t.nav.solutions,
      icon: LayoutGrid,
      href: "/soluciones",
      children: [
        { label: t.solutions.infra, href: "/soluciones/infraestructura", icon: Server },
        { label: t.solutions.controlAcceso, href: "/soluciones/control-acceso", icon: KeyRound },
        { label: t.solutions.cctv, href: "/soluciones/cctv", icon: Camera },
        { label: t.solutions.audioVoceo, href: "/soluciones/audio-voceo", icon: Volume2 },
        { label: t.solutions.salasJuntas, href: "/soluciones/salas-juntas", icon: Monitor },
        { label: t.solutions.rfid, href: "/soluciones/rfid", icon: Cpu },
        { label: t.solutions.software, href: "/soluciones/software-ia", icon: Brain },
        { label: t.solutions.computo, href: "/soluciones/computo-licenciamiento", icon: Laptop },
        { label: t.solutions.polizas, href: "/soluciones/polizas-servicios", icon: ClipboardList },
        { label: t.solutions.compliance, href: "/soluciones/compliance", icon: FileCheck },
      ],
    },
    { label: t.nav.industries, icon: Globe, href: "/industrias" },
    { label: t.nav.techAdvisor, icon: Zap, href: "/tech-advisor" },
    { label: t.nav.academy, icon: BookOpen, href: "/academy" },
    { label: t.nav.store, icon: ShoppingCart, href: "/tienda" },
    { label: t.nav.contact, icon: Phone, href: "/contacto" },
  ];

  const handleItemClick = useCallback((item: typeof navItems[0]) => {
    if (item.children) {
      setActiveSubmenu(prev => prev === item.label ? null : item.label);
    } else {
      setExpanded(false);
      setActiveSubmenu(null);
      if (item.href) navigate(item.href);
    }
  }, [navigate, navItems]);

  const sidebarWidth = expanded ? 260 : 56;

  return (
    <>
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
            style={{ background: "oklch(0 0 0 / 0.50)", backdropFilter: "blur(2px)" }}
            onClick={() => { setExpanded(false); setActiveSubmenu(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar IZQUIERDO ─────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-0 left-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          background: "var(--color-iamet-sidebar-bg, var(--color-iamet-bg-secondary))",
          borderRight: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))",
          boxShadow: expanded
            ? "4px 0 32px oklch(0 0 0 / 0.35)"
            : "2px 0 12px oklch(0 0 0 / 0.15)",
        }}
      >
        {/* Logo + Toggle button */}
        <div
          className="flex items-center h-[64px] flex-shrink-0 overflow-hidden"
          style={{ borderBottom: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))" }}
        >
          {/* Logo — visible solo cuando expandido */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="flex-1 pl-3 overflow-hidden"
              >
                <Link href="/" onClick={() => { setExpanded(false); setActiveSubmenu(null); }}>
                  <img
                    src="/manus-storage/logo-iamet-v2-final_a0aa3f89.png"
                    alt="IAMET"
                    className="h-9 w-auto object-contain hover:opacity-90 transition-opacity duration-200"
                  />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle button */}
          <button
            onClick={() => { setExpanded(!expanded); if (expanded) setActiveSubmenu(null); }}
            className="w-14 h-full flex items-center justify-center flex-shrink-0 transition-all duration-150 btn-press"
            style={{ color: "var(--color-iamet-text-subtle)" }}
            aria-label={expanded ? t.nav.collapseMenu : t.nav.expandMenu}
          >
            <motion.div
              animate={{ rotate: expanded ? 0 : 180 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
          {/* Inicio */}
          <Link href="/" onClick={() => { setExpanded(false); setActiveSubmenu(null); }}>
            <button
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 group relative"
              style={{
                color: location === "/"
                  ? "var(--color-iamet-accent)"
                  : "var(--color-iamet-text-muted)",
                background: location === "/"
                  ? "var(--color-iamet-accent-muted)"
                  : "transparent",
              }}
              onMouseEnter={e => {
                if (location !== "/") {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-bg-tertiary)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text)";
                }
              }}
              onMouseLeave={e => {
                if (location !== "/") {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-muted)";
                }
              }}
              title={!expanded ? t.nav.home : undefined}
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
                    {t.nav.home}
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
              <div key={item.href}>
                <button
                  onClick={() => handleItemClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150 group relative"
                  style={{
                    color: active ? "var(--color-iamet-accent)" : "var(--color-iamet-text-muted)",
                    background: active ? "var(--color-iamet-accent-muted)" : "transparent",
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-bg-tertiary)";
                      (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-muted)";
                    }
                  }}
                  title={!expanded ? item.label : undefined}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                      style={{ background: "var(--color-iamet-accent)" }}
                    />
                  )}
                  <Icon className="flex-shrink-0" style={{ width: 18, height: 18 }} />
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
                            className="flex items-center gap-2.5 px-5 py-2 text-xs transition-colors duration-150"
                            style={{ color: "var(--color-iamet-text-subtle)" }}
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

        {/* ── Controles inferiores: Idioma, Tema, Auth ──────────────────────── */}
        <div
          className="flex-shrink-0 py-2"
          style={{ borderTop: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))" }}
        >
          {/* Toggle de idioma ES / EN */}
          <button
            onClick={() => setLanguage(language === "es" ? "en" : "es")}
            className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 btn-press"
            style={{ color: "var(--color-iamet-text-muted)" }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-bg-tertiary)";
              (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-muted)";
            }}
            title={!expanded ? t.nav.language : undefined}
          >
            <Languages className="flex-shrink-0" style={{ width: 18, height: 18 }} />
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2 flex-1"
                >
                  <span className="text-sm font-medium whitespace-nowrap">{t.nav.language}</span>
                  <span
                    className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: "var(--color-iamet-accent-muted)",
                      color: "var(--color-iamet-accent)",
                    }}
                  >
                    {language.toUpperCase()}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Indicador compacto cuando colapsado */}
            {!expanded && (
              <span
                className="absolute left-8 top-1/2 -translate-y-1/2 text-[9px] font-bold"
                style={{ color: "var(--color-iamet-accent)" }}
              >
                {language.toUpperCase()}
              </span>
            )}
          </button>

          {/* Toggle de tema oscuro/claro */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 btn-press"
              style={{ color: "var(--color-iamet-text-muted)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-bg-tertiary)";
                (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-muted)";
              }}
              title={!expanded ? (theme === "dark" ? t.nav.lightMode : t.nav.darkMode) : undefined}
            >
              <motion.div
                key={theme}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="flex-shrink-0"
              >
                {theme === "dark" ? (
                  <Sun style={{ width: 18, height: 18, color: "var(--color-iamet-yellow, #eab308)" }} />
                ) : (
                  <Moon style={{ width: 18, height: 18 }} />
                )}
              </motion.div>
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18 }}
                    className="text-sm font-medium whitespace-nowrap flex-1"
                  >
                    {theme === "dark" ? t.nav.lightMode : t.nav.darkMode}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}

          {/* Auth */}
          {user ? (
            <>
              <Link href="/admin/monitor" onClick={() => setExpanded(false)}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150"
                  style={{ color: "var(--color-iamet-text-muted)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "oklch(0.68 0.18 160 / 0.12)";
                    (e.currentTarget as HTMLElement).style.color = "oklch(0.68 0.18 160)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-muted)";
                  }}
                  title={!expanded ? t.nav.liveMonitor : undefined}
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
                        {t.nav.liveMonitor}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </Link>
              <Link href="/admin" onClick={() => setExpanded(false)}>
                <button
                  className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150"
                  style={{ color: "var(--color-iamet-text-muted)" }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-bg-tertiary)";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-accent)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-muted)";
                  }}
                  title={!expanded ? t.nav.dashboard : undefined}
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
                        {t.nav.dashboard}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </Link>
            </>
          ) : (
            <a href={getLoginUrl()}>
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150"
                style={{ color: "var(--color-iamet-text-muted)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-bg-tertiary)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-accent)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-muted)";
                }}
                title={!expanded ? t.nav.login : undefined}
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
                      {t.nav.login}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </a>
          )}
        </div>
      </motion.aside>
    </>
  );
}
