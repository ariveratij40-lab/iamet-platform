const AdminCampaignsV2 = lazy(() => import("./pages/AdminCampaignsV2"));
import VisitorAssistantV2 from "./components/v2/VisitorAssistantV2";
const Warranties = lazy(() => import("./pages/Warranties"));
const AdminWarranties = lazy(() => import("./pages/AdminWarranties"));
import {useEffect, lazy, Suspense} from "react";
import CorporateFooterV2 from "./components/v2/CorporateFooterV2";
import { AboutV2, BrandsV2, BrandLandingV2, QuoteV2 } from "./pages/CorporatePagesV2";
import { BlogIndexV2, BlogPostV2 } from "./pages/BlogV2";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
const NotFound = lazy(() => import("@/pages/NotFound"));
import { Redirect, Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import HomeV2 from "./pages/HomeV2";
const ServiceLandingV2 = lazy(() => import("./pages/ServiceLandingV2"));
const InfrastructureV2 = lazy(() => import("./pages/InfrastructureV2"));
const VerticalLanding = lazy(() => import("./pages/VerticalLanding"));
const TechAdvisor = lazy(() => import("./pages/TechAdvisor"));
const Academy = lazy(() => import("./pages/Academy"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminConsole = lazy(() => import("./pages/AdminConsole"));
const TiendaVerificar = lazy(() => import("./pages/TiendaVerificar"));
const AdminTienda = lazy(() => import("./pages/AdminTienda"));
const AdminReuiones = lazy(() => import("./pages/AdminReuiones"));
const AdminSeguimientos = lazy(() => import("./pages/AdminSeguimientos"));
const AdminCRM = lazy(() => import("./pages/AdminCRMV2"));
const AdminIntelligence = lazy(() => import("./pages/AdminIntelligence"));
const AdminAgent = lazy(() => import("./pages/AdminAgent"));
const AdminKnowledge = lazy(() => import("./pages/AdminKnowledge"));
const AdminBriefing = lazy(() => import("./pages/AdminBriefing"));
const AdminKnowledgeBatch = lazy(() => import("./pages/AdminKnowledgeBatch"));
const AdminCampaigns = lazy(() => import("./pages/AdminCampaigns"));
const AdminSimulator = lazy(() => import("./pages/AdminSimulator"));
const AdminQA = lazy(() => import("./pages/AdminQA"));
const AdminHealth = lazy(() => import("./pages/AdminHealth"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const TiendaNuevaContrasena = lazy(() => import("./pages/TiendaNuevaContrasena"));
const Contact = lazy(() => import("./pages/Contact"));
const Industrias = lazy(() => import("./pages/Industrias"));
const Soluciones = lazy(() => import("./pages/Soluciones"));
const CancelarReunion = lazy(() => import("./pages/CancelarReunion"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
import Navbar from "./components/Navbar";
import ServiceLandingHeaderV2 from "./components/v2/ServiceLandingHeaderV2";
import PublicHeaderV2 from "./components/v2/PublicHeaderV2";
import { useIsMobile } from "./hooks/useMobile";
const Login = lazy(() => import("./pages/Login"));
const AccountAccessV2 = lazy(() => import("./pages/AccountAccessV2"));
const CustomerAccessRoute = lazy(() => import("./pages/AccountAccessV2").then(m => ({default:m.CustomerAccessRoute})));
import { AdminGuard } from "./components/AdminGuard";
const Register = lazy(() => import("./pages/Register"));
const SubscriberLogin = lazy(() => import("./pages/SubscriberLogin"));
const MyAccount = lazy(() => import("./pages/MyAccount"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

// Wrapper que compensa el espacio del Navbar (sidebar en desktop, topbar en móvil)
function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  useEffect(() => { if (!window.location.hash) window.scrollTo({top: 0, behavior: "instant"}); }, [location]);
  const isServiceLanding = /^\/soluciones\/(infraestructura|edificios-inteligentes|cctv|control-acceso|rfid|energia|software-ia|polizas-servicios)$/.test(location) || /^\/marcas\/(panduit|genetec|zebra|avigilon|apc-schneider)$/.test(location);
  const isAdmin = location === "/admin" || location.startsWith("/admin/");

  if (location === "/admin/crm" || location === "/admin/garantias" || location === "/admin/campanas") return <>{children}</>;

  if (location === "/admin/login") return <><PublicHeaderV2 /><main>{children}</main></>;

  if (isAdmin) {
    return (
      <>
        <Navbar />
        <div style={isMobile ? { paddingTop: "56px" } : { paddingLeft: "56px" }}>
          {children}
        </div>
      </>
    );
  }

  return (
    <>
      {isServiceLanding ? <ServiceLandingHeaderV2 /> : <PublicHeaderV2 />}
      <main>{children}</main>
      {!isServiceLanding && <CorporateFooterV2 />}
      <VisitorAssistantV2 />
    </>
  );
}

function Router() {
  return (
    <AppShell>
      <Suspense fallback={<div role="status" className="min-h-64 bg-[#07111f] p-8 text-center text-slate-200">Cargando página…</div>}>
      <Switch>
          <Route path="/" component={HomeV2} />
          <Route path="/nosotros" component={AboutV2} />
          <Route path="/marcas" component={BrandsV2} />
          <Route path="/marcas/panduit" component={InfrastructureV2} />
          <Route path="/marcas/:slug" component={BrandLandingV2} />
          <Route path="/cotizacion" component={QuoteV2} />
          <Route path="/garantias" component={Warranties} />
          <Route path="/blog" component={BlogIndexV2} />
          <Route path="/blog/:slug" component={BlogPostV2} />
          <Route path="/soluciones/polizas-servicios" component={ServiceLandingV2} />
          {/* Soluciones — hub y verticales */}
          <Route path="/soluciones" component={Soluciones} />
          <Route path="/soluciones/infraestructura" component={InfrastructureV2} />
          <Route path="/soluciones/edificios-inteligentes" component={ServiceLandingV2} />
          <Route path="/soluciones/cctv" component={ServiceLandingV2} />
          <Route path="/soluciones/control-acceso" component={ServiceLandingV2} />
          <Route path="/soluciones/rfid" component={ServiceLandingV2} />
          <Route path="/soluciones/energia" component={ServiceLandingV2} />
          <Route path="/soluciones/software-ia" component={ServiceLandingV2} />
          <Route path="/soluciones/:slug" component={VerticalLanding} />
          {/* Industrias */}
          <Route path="/industrias" component={Industrias} />
          {/* Herramientas */}
          <Route path="/tech-advisor" component={TechAdvisor} />
          <Route path="/academy" component={Academy} />
          <Route path="/contacto" component={Contact} />
          {/* Tienda */}
          <Route path="/tienda">{() => <Redirect to="/cotizacion" />}</Route>
          <Route path="/tienda/login" component={CustomerAccessRoute} />
          <Route path="/tienda/verificar" component={TiendaVerificar} />
          <Route path="/tienda/verificar-email" component={TiendaVerificar} />
          <Route path="/tienda/nueva-contrasena" component={TiendaNuevaContrasena} />
          <Route path="/tienda/perfil">{() => <Redirect to="/garantias#portal" />}</Route>
          <Route path="/tienda/:slug">{() => <Redirect to="/cotizacion" />}</Route>
          {/* Landing Factory — 14 verticales enriquecidas */}
          <Route path="/landing/:vertical" component={LandingPage} />
          {/* Cancelar reunión — ruta pública */}
          <Route path="/cancelar-reunion" component={CancelarReunion} />
          {/* Suscriptores públicos */}
          <Route path="/registro" component={Register} />
          <Route path="/login-suscriptor" component={SubscriberLogin} />
          <Route path="/mi-cuenta" component={MyAccount} />
          <Route path="/verificar-email" component={VerifyEmail} />
          {/* Login local */}
          <Route path="/login" component={Login} />
          <Route path="/admin/login" component={AccountAccessV2} />
          <Route path="/acceso" component={AccountAccessV2} />
          {/* Admin — protegido con AdminGuard */}
          <Route path="/admin">{() => <AdminGuard><AdminDashboard /></AdminGuard>}</Route>
          <Route path="/admin/monitor">{() => <AdminGuard><AdminConsole /></AdminGuard>}</Route>
          <Route path="/admin/tienda">{() => <AdminGuard><AdminTienda /></AdminGuard>}</Route>
          <Route path="/admin/reuniones">{() => <AdminGuard><AdminReuiones /></AdminGuard>}</Route>
          <Route path="/admin/seguimientos">{() => <AdminGuard><AdminSeguimientos /></AdminGuard>}</Route>
          <Route path="/admin/garantias">{() => <AdminGuard allowedRoles={["admin"]}><AdminWarranties /></AdminGuard>}</Route>
          <Route path="/admin/campanas">{() => <AdminGuard allowedRoles={["admin"]}><AdminCampaignsV2 /></AdminGuard>}</Route>
          <Route path="/admin/crm">{() => <AdminGuard allowedRoles={["admin"]}><AdminCRM /></AdminGuard>}</Route>
          <Route path="/admin/intelligence">{() => <AdminGuard><AdminIntelligence /></AdminGuard>}</Route>
          <Route path="/admin/agent">{() => <AdminGuard><AdminAgent /></AdminGuard>}</Route>
          <Route path="/admin/knowledge">{() => <AdminGuard><AdminKnowledge /></AdminGuard>}</Route>
          <Route path="/admin/briefing">{() => <AdminGuard><AdminBriefing /></AdminGuard>}</Route>
          <Route path="/admin/knowledge/batch">{() => <AdminGuard><AdminKnowledgeBatch /></AdminGuard>}</Route>
          <Route path="/admin/campaigns">{() => <AdminGuard><AdminCampaigns /></AdminGuard>}</Route>
          <Route path="/admin/simulator">{() => <AdminGuard><AdminSimulator /></AdminGuard>}</Route>
          <Route path="/admin/qa">{() => <AdminGuard><AdminQA /></AdminGuard>}</Route>
          <Route path="/admin/health">{() => <AdminGuard allowedRoles={["admin"]}><AdminHealth /></AdminGuard>}</Route>
          <Route path="/admin/users">{() => <AdminGuard allowedRoles={["admin"]}><AdminUsers /></AdminGuard>}</Route>
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
      </Switch>
      </Suspense>
    </AppShell>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
