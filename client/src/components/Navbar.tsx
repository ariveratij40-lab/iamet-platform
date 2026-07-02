import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Cpu, Zap, BookOpen, Phone,
  LayoutDashboard, ChevronRight, ChevronLeft, Home,
  Server, Brain, FileCheck, Globe, ShoppingCart,
  Sun, Moon, Languages, Activity, Menu, X,
  KeyRound, Camera, Volume2, Monitor, Laptop, ClipboardList, Network,
  BarChart3, Bot, Database, Newspaper,
  Package, Target, FlaskConical, TestTube2, HeartPulse, Users,
  CalendarDays, Mail, TrendingUp, LogIn, ChevronDown,
  Shield,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/useMobile";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type NavChild = { label: string; href: string; icon: React.ElementType };
type NavItem  = { label: string; icon: React.ElementType; href: string; children?: NavChild[] };

// ── Grupos admin ──────────────────────────────────────────────────────────────
const ADMIN_GROUPS = [
  {
    label: "Operación",
    items: [
      { href: "/admin",            icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/monitor",    icon: Activity,        label: "Monitor Live" },
      { href: "/admin/reuniones",  icon: CalendarDays,    label: "Reuniones" },
      { href: "/admin/seguimientos",icon: Mail,           label: "Seguimientos" },
      { href: "/admin/crm",        icon: TrendingUp,      label: "CRM" },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { href: "/admin/intelligence",    icon: BarChart3,    label: "Inteligencia" },
      { href: "/admin/agent",           icon: Bot,          label: "Agente SDR" },
      { href: "/admin/briefing",        icon: Newspaper,    label: "Briefing IA" },
    ],
  },
  {
    label: "Conocimiento",
    items: [
      { href: "/admin/knowledge",       icon: Database,     label: "Base RAG" },
      { href: "/admin/knowledge/batch", icon: Package,      label: "Carga Masiva" },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { href: "/admin/campaigns",  icon: Target,       label: "Campañas UTM" },
      { href: "/admin/simulator",  icon: FlaskConical, label: "Simulador" },
      { href: "/admin/qa",         icon: TestTube2,    label: "QA Agente" },
      { href: "/admin/health",     icon: HeartPulse,   label: "Salud Sistema" },
      { href: "/admin/users",      icon: Users,        label: "Usuarios" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const SIDEBAR_WIDTH_EXPANDED  = 264;
const SIDEBAR_WIDTH_COLLAPSED = 56;

function NavButton({
  icon: Icon,
  label,
  active,
  expanded,
  onClick,
  href,
  indent = false,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  expanded: boolean;
  onClick?: () => void;
  href?: string;
  indent?: boolean;
}) {
  const inner = (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-lg transition-all duration-150 btn-press relative group"
      style={{
        padding: indent ? "8px 10px 8px 14px" : "10px 10px",
        color: active ? "var(--color-iamet-accent)" : "var(--color-iamet-text-muted)",
        background: active ? "var(--color-iamet-accent-muted)" : "transparent",
        fontSize: indent ? "0.8rem" : "0.875rem",
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
      title={!expanded ? label : undefined}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
          style={{ background: "var(--color-iamet-accent)" }}
        />
      )}
      <Icon
        className="flex-shrink-0"
        style={{ width: indent ? 15 : 18, height: indent ? 15 : 18, opacity: indent ? 0.75 : 1 }}
      />
      <AnimatePresence>
        {expanded && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.15 }}
            className="font-medium whitespace-nowrap flex-1 text-left"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

// ── Componente de grupo admin colapsable ──────────────────────────────────────
function AdminGroup({
  group,
  location,
  expanded,
  navigate,
}: {
  group: typeof ADMIN_GROUPS[0];
  location: string;
  expanded: boolean;
  navigate: (href: string) => void;
}) {
  const hasActive = group.items.some(i => location === i.href || location.startsWith(i.href + "/"));
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="mb-1">
      {/* Cabecera del grupo */}
      <AnimatePresence>
        {expanded && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors duration-150"
            style={{ color: "var(--color-iamet-text-subtle)", fontSize: "0.7rem", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-muted)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-subtle)"; }}
          >
            <span>{group.label}</span>
            <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="w-3 h-3" />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Ítems del grupo */}
      <AnimatePresence initial={false}>
        {(!expanded || open) && (
          <motion.div
            initial={expanded ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {group.items.map(item => {
              const active = location === item.href || location.startsWith(item.href + "/");
              return (
                <NavButton
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={active}
                  expanded={expanded}
                  href={item.href}
                  onClick={() => navigate(item.href)}
                  indent={expanded}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Navbar() {
  const [expanded, setExpanded] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isMobile = useIsMobile();

  const isActive = (href: string) => location === href || location.startsWith(href + "/");

  const navItems: NavItem[] = [
    {
      label: t.nav.solutions,
      icon: LayoutGrid,
      href: "/soluciones",
      children: [
        { label: t.solutions.infra,          href: "/soluciones/infraestructura",         icon: Server },
        { label: t.solutions.controlAcceso,  href: "/soluciones/control-acceso",          icon: KeyRound },
        { label: t.solutions.cctv,           href: "/soluciones/cctv",                    icon: Camera },
        { label: t.solutions.audioVoceo,     href: "/soluciones/audio-voceo",             icon: Volume2 },
        { label: t.solutions.salasJuntas,    href: "/soluciones/salas-juntas",            icon: Monitor },
        { label: t.solutions.rfid,           href: "/soluciones/rfid",                    icon: Cpu },
        { label: t.solutions.software,       href: "/soluciones/software-ia",             icon: Brain },
        { label: t.solutions.computo,        href: "/soluciones/computo-licenciamiento",  icon: Laptop },
        { label: t.solutions.polizas,        href: "/soluciones/polizas-servicios",       icon: ClipboardList },
        { label: t.solutions.compliance,     href: "/soluciones/compliance",              icon: FileCheck },
      ],
    },
    { label: t.nav.industries,  icon: Globe,        href: "/industrias" },
    { label: t.nav.techAdvisor, icon: Zap,          href: "/tech-advisor" },
    { label: t.nav.academy,     icon: BookOpen,     href: "/academy" },
    { label: t.nav.store,       icon: ShoppingCart, href: "/tienda" },
    { label: t.nav.contact,     icon: Phone,        href: "/contacto" },
  ];

  const handleItemClick = useCallback((item: NavItem) => {
    if (item.children) {
      setActiveSubmenu(prev => prev === item.label ? null : item.label);
    } else {
      setExpanded(false);
      setActiveSubmenu(null);
      setMobileOpen(false);
      if (item.href) navigate(item.href);
    }
  }, [navigate]);

  const closeMobile = () => { setMobileOpen(false); setActiveSubmenu(null); };
  const sidebarWidth = expanded ? SIDEBAR_WIDTH_EXPANDED : SIDEBAR_WIDTH_COLLAPSED;

  // ── MOBILE ──────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Top bar */}
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
          style={{
            background: "var(--color-iamet-sidebar-bg, var(--color-iamet-bg-secondary))",
            borderBottom: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))",
            boxShadow: "0 2px 12px oklch(0 0 0 / 0.15)",
          }}
        >
          <Link href="/" onClick={closeMobile}>
            <img
              src="https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/logos/logo-iamet-v2-final.png"
              alt="IAMET"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg transition-colors duration-150"
            style={{ color: "var(--color-iamet-text-muted)" }}
            aria-label="Menú"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              style={{ background: "oklch(0 0 0 / 0.55)", backdropFilter: "blur(2px)" }}
              onClick={closeMobile}
            />
          )}
        </AnimatePresence>

        {/* Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              key="mobile-drawer"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              className="fixed top-0 left-0 h-full z-50 flex flex-col overflow-y-auto"
              style={{
                width: 288,
                background: "var(--color-iamet-sidebar-bg, var(--color-iamet-bg-secondary))",
                borderRight: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))",
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 h-14 flex-shrink-0"
                style={{ borderBottom: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))" }}
              >
                <Link href="/" onClick={closeMobile}>
                  <img
                    src="https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/logos/logo-iamet-v2-final.png"
                    alt="IAMET"
                    className="h-8 w-auto object-contain"
                  />
                </Link>
                <button onClick={closeMobile} style={{ color: "var(--color-iamet-text-muted)" }}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav público */}
              <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
                <Link href="/" onClick={closeMobile}>
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: location === "/" ? "var(--color-iamet-accent)" : "var(--color-iamet-text-muted)", background: location === "/" ? "var(--color-iamet-accent-muted)" : "transparent" }}
                  >
                    <Home className="w-5 h-5 flex-shrink-0" />
                    <span>{t.nav.home}</span>
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{ color: active ? "var(--color-iamet-accent)" : "var(--color-iamet-text-muted)", background: active ? "var(--color-iamet-accent-muted)" : "transparent" }}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.children && (
                          <motion.div animate={{ rotate: submenuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronRight className="w-4 h-4 opacity-40" />
                          </motion.div>
                        )}
                      </button>
                      <AnimatePresence>
                        {item.children && submenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pl-4"
                          >
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              return (
                                <Link key={child.href} href={child.href} onClick={closeMobile}>
                                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors" style={{ color: "var(--color-iamet-text-subtle)" }}>
                                    <ChildIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                                    <span>{child.label}</span>
                                  </div>
                                </Link>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* Módulos admin (si autenticado) */}
                {user && (
                  <>
                    <div
                      className="mx-1 my-3"
                      style={{ height: 1, background: "var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))" }}
                    />
                    <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-iamet-text-subtle)" }}>
                      Administración
                    </p>
                    {ADMIN_GROUPS.map(group => (
                      <div key={group.label} className="mb-2">
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-iamet-text-subtle)", opacity: 0.6 }}>
                          {group.label}
                        </p>
                        {group.items.map(item => {
                          const Icon = item.icon;
                          const active = location === item.href || location.startsWith(item.href + "/");
                          return (
                            <Link key={item.href} href={item.href} onClick={closeMobile}>
                              <button
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                                style={{ color: active ? "var(--color-iamet-accent)" : "var(--color-iamet-text-muted)", background: active ? "var(--color-iamet-accent-muted)" : "transparent" }}
                              >
                                <Icon className="w-4 h-4 flex-shrink-0" />
                                <span>{item.label}</span>
                              </button>
                            </Link>
                          );
                        })}
                      </div>
                    ))}
                  </>
                )}
              </nav>

              {/* Footer: controles + login */}
              <div
                className="flex-shrink-0 px-3 py-3 space-y-1"
                style={{ borderTop: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))" }}
              >
                <button
                  onClick={() => setLanguage(language === "es" ? "en" : "es")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                  style={{ color: "var(--color-iamet-text-muted)" }}
                >
                  <Languages className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 font-medium">{t.nav.language}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--color-iamet-accent-muted)", color: "var(--color-iamet-accent)" }}>
                    {language.toUpperCase()}
                  </span>
                </button>
                {toggleTheme && (
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
                    style={{ color: "var(--color-iamet-text-muted)" }}
                  >
                    {theme === "dark"
                      ? <Sun className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-iamet-yellow, #eab308)" }} />
                      : <Moon className="w-5 h-5 flex-shrink-0" />}
                    <span className="font-medium">{theme === "dark" ? t.nav.lightMode : t.nav.darkMode}</span>
                  </button>
                )}

                {/* Botón login / info usuario */}
                {!user ? (
                  <Link href="/admin/login" onClick={closeMobile}>
                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm mt-2 transition-all duration-200"
                      style={{
                        background: "var(--color-iamet-accent)",
                        color: "#fff",
                        boxShadow: "0 4px 16px var(--color-iamet-accent-muted)",
                      }}
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Iniciar sesión</span>
                    </button>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mt-1" style={{ background: "var(--color-iamet-bg-tertiary)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--color-iamet-accent)", color: "#fff" }}>
                      {(user as any).name?.charAt(0).toUpperCase() ?? "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "var(--color-iamet-text)" }}>{(user as any).name}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--color-iamet-text-subtle)" }}>{(user as any).email}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────────────────────
  return (
    <>
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: "oklch(0 0 0 / 0.50)", backdropFilter: "blur(2px)" }}
            onClick={() => { setExpanded(false); setActiveSubmenu(null); }}
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-0 left-0 h-full z-50 flex flex-col overflow-hidden"
        style={{
          background: "var(--color-iamet-sidebar-bg, var(--color-iamet-bg-secondary))",
          borderRight: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))",
          boxShadow: expanded ? "4px 0 32px oklch(0 0 0 / 0.35)" : "2px 0 12px oklch(0 0 0 / 0.15)",
        }}
      >
        {/* Logo + Toggle */}
        <div
          className="flex items-center h-[60px] flex-shrink-0 overflow-hidden"
          style={{ borderBottom: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))" }}
        >
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="flex-1 pl-4 overflow-hidden"
              >
                <Link href="/" onClick={() => { setExpanded(false); setActiveSubmenu(null); }}>
                  <img
                    src="https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/logos/logo-iamet-v2-final.png"
                    alt="IAMET"
                    className="h-8 w-auto object-contain hover:opacity-90 transition-opacity"
                  />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => { setExpanded(!expanded); if (expanded) setActiveSubmenu(null); }}
            className="w-14 h-full flex items-center justify-center flex-shrink-0 transition-all duration-150 btn-press"
            style={{ color: "var(--color-iamet-text-subtle)" }}
            aria-label={expanded ? t.nav.collapseMenu : t.nav.expandMenu}
          >
            <motion.div animate={{ rotate: expanded ? 0 : 180 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
              <ChevronLeft className="w-4 h-4" />
            </motion.div>
          </button>
        </div>

        {/* ── Contenido scrollable ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">

          {/* Nav público */}
          <nav className="py-3 px-2 space-y-0.5">
            {/* Home */}
            <NavButton
              icon={Home}
              label={t.nav.home}
              active={location === "/"}
              expanded={expanded}
              href="/"
              onClick={() => { setExpanded(false); setActiveSubmenu(null); }}
            />

            {/* Items con submenú */}
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const submenuOpen = activeSubmenu === item.label;

              return (
                <div key={item.href}>
                  <button
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 rounded-lg transition-all duration-150 btn-press relative"
                    style={{
                      padding: "10px 10px",
                      color: active ? "var(--color-iamet-accent)" : "var(--color-iamet-text-muted)",
                      background: active ? "var(--color-iamet-accent-muted)" : "transparent",
                      fontSize: "0.875rem",
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
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: "var(--color-iamet-accent)" }} />
                    )}
                    <Icon className="flex-shrink-0" style={{ width: 18, height: 18 }} />
                    <AnimatePresence>
                      {expanded && (
                        <motion.span
                          initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                          transition={{ duration: 0.15 }}
                          className="font-medium whitespace-nowrap flex-1 text-left"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {expanded && item.children && (
                      <motion.div animate={{ rotate: submenuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
                      </motion.div>
                    )}
                  </button>

                  {/* Submenú */}
                  <AnimatePresence>
                    {item.children && submenuOpen && expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden pl-3"
                        style={{ background: "var(--color-iamet-bg)" }}
                      >
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          return (
                            <Link key={child.href} href={child.href} onClick={() => { setExpanded(false); setActiveSubmenu(null); }}>
                              <div
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                                style={{ color: "var(--color-iamet-text-subtle)" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text)"; (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-bg-tertiary)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-subtle)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                              >
                                <ChildIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                                <span>{child.label}</span>
                              </div>
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

          {/* Separador + módulos admin (solo si autenticado) */}
          {user && (
            <>
              <div
                className="mx-3 my-1"
                style={{ height: 1, background: "var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))" }}
              />
              <div className="px-2 py-2 space-y-0">
                {ADMIN_GROUPS.map(group => (
                  <AdminGroup
                    key={group.label}
                    group={group}
                    location={location}
                    expanded={expanded}
                    navigate={(href) => { navigate(href); setExpanded(false); }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Footer fijo ── */}
        <div
          className="flex-shrink-0 px-2 py-3 space-y-1"
          style={{ borderTop: "1px solid var(--color-iamet-sidebar-border, var(--color-iamet-border-subtle))" }}
        >
          {/* Idioma */}
          <button
            onClick={() => setLanguage(language === "es" ? "en" : "es")}
            className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-all duration-150 btn-press"
            style={{ color: "var(--color-iamet-text-muted)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-bg-tertiary)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            title={!expanded ? t.nav.language : undefined}
          >
            <div className="relative flex-shrink-0">
              <Languages style={{ width: 18, height: 18 }} />
              {!expanded && (
                <span className="absolute -top-1 -right-1 text-[8px] font-bold" style={{ color: "var(--color-iamet-accent)" }}>
                  {language.toUpperCase()}
                </span>
              )}
            </div>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between flex-1"
                >
                  <span className="text-sm font-medium whitespace-nowrap">{t.nav.language}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--color-iamet-accent-muted)", color: "var(--color-iamet-accent)" }}>
                    {language.toUpperCase()}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Tema */}
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-all duration-150 btn-press"
              style={{ color: "var(--color-iamet-text-muted)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-bg-tertiary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              title={!expanded ? (theme === "dark" ? t.nav.lightMode : t.nav.darkMode) : undefined}
            >
              <motion.div key={theme} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }} className="flex-shrink-0">
                {theme === "dark"
                  ? <Sun style={{ width: 18, height: 18, color: "var(--color-iamet-yellow, #eab308)" }} />
                  : <Moon style={{ width: 18, height: 18 }} />}
              </motion.div>
              <AnimatePresence>
                {expanded && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {theme === "dark" ? t.nav.lightMode : t.nav.darkMode}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )}

          {/* Botón login prominente (no autenticado) */}
          {!user ? (
            <Link href="/admin/login">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center gap-3 rounded-xl transition-all duration-200 overflow-hidden"
                style={{
                  padding: expanded ? "11px 14px" : "11px 0",
                  justifyContent: expanded ? "flex-start" : "center",
                  background: "var(--color-iamet-accent)",
                  color: "#fff",
                  boxShadow: "0 4px 16px oklch(0.45 0.22 250 / 0.35)",
                  marginTop: "4px",
                }}
                title={!expanded ? t.nav.login : undefined}
              >
                <LogIn style={{ width: 18, height: 18, flexShrink: 0 }} />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-semibold whitespace-nowrap"
                    >
                      Iniciar sesión
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </Link>
          ) : (
            /* Avatar del usuario autenticado */
            <div
              className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 mt-1"
              style={{ background: "var(--color-iamet-bg-tertiary)" }}
              title={!expanded ? ((user as any).name ?? "Admin") : undefined}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: "var(--color-iamet-accent)", color: "#fff" }}
              >
                {(user as any).name?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-xs font-semibold truncate" style={{ color: "var(--color-iamet-text)" }}>{(user as any).name}</p>
                    <p className="text-[10px] truncate" style={{ color: "var(--color-iamet-text-subtle)" }}>{(user as any).email}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}
