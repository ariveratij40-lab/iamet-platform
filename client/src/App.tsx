import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import VerticalLanding from "./pages/VerticalLanding";
import TechAdvisor from "./pages/TechAdvisor";
import Academy from "./pages/Academy";
import AdminDashboard from "./pages/AdminDashboard";
import AdminConsole from "./pages/AdminConsole";
import Tienda from "./pages/Tienda";
import ProductoDetalle from "./pages/ProductoDetalle";
import TiendaVerificar from "./pages/TiendaVerificar";
import AdminTienda from "./pages/AdminTienda";
import AdminReuiones from "./pages/AdminReuiones";
import AdminSeguimientos from "./pages/AdminSeguimientos";
import AdminCRM from "./pages/AdminCRM";
import AdminIntelligence from "./pages/AdminIntelligence";
import AdminAgent from "./pages/AdminAgent";
import AdminKnowledge from "./pages/AdminKnowledge";
import AdminBriefing from "./pages/AdminBriefing";
import AdminKnowledgeBatch from "./pages/AdminKnowledgeBatch";
import AdminCampaigns from "./pages/AdminCampaigns";
import AdminSimulator from "./pages/AdminSimulator";
import AdminQA from "./pages/AdminQA";
import AdminHealth from "./pages/AdminHealth";
import AdminUsers from "./pages/AdminUsers";
import TiendaPerfil from "./pages/TiendaPerfil";
import TiendaLogin from "./pages/TiendaLogin";
import TiendaNuevaContrasena from "./pages/TiendaNuevaContrasena";
import Contact from "./pages/Contact";
import Industrias from "./pages/Industrias";
import Soluciones from "./pages/Soluciones";
import CancelarReunion from "./pages/CancelarReunion";
import LandingPage from "./pages/LandingPage";
import Navbar from "./components/Navbar";
import { useIsMobile } from "./hooks/useMobile";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import { AdminGuard } from "./components/AdminGuard";
import Register from "./pages/Register";
import SubscriberLogin from "./pages/SubscriberLogin";
import MyAccount from "./pages/MyAccount";
import VerifyEmail from "./pages/VerifyEmail";

// Wrapper que compensa el espacio del Navbar (sidebar en desktop, topbar en móvil)
function PageWrapper({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <div style={isMobile ? { paddingTop: "56px" } : { paddingLeft: "56px" }}>
      {children}
    </div>
  );
}

function Router() {
  return (
    <>
      <Navbar />
      <PageWrapper>
        <Switch>
          <Route path="/" component={Home} />
          {/* Soluciones — hub y verticales */}
          <Route path="/soluciones" component={Soluciones} />
          <Route path="/soluciones/:slug" component={VerticalLanding} />
          {/* Industrias */}
          <Route path="/industrias" component={Industrias} />
          {/* Herramientas */}
          <Route path="/tech-advisor" component={TechAdvisor} />
          <Route path="/academy" component={Academy} />
          <Route path="/contacto" component={Contact} />
          {/* Tienda */}
          <Route path="/tienda" component={Tienda} />
          <Route path="/tienda/login" component={TiendaLogin} />
          <Route path="/tienda/verificar" component={TiendaVerificar} />
          <Route path="/tienda/verificar-email" component={TiendaVerificar} />
          <Route path="/tienda/nueva-contrasena" component={TiendaNuevaContrasena} />
          <Route path="/tienda/perfil" component={TiendaPerfil} />
          <Route path="/tienda/:slug" component={ProductoDetalle} />
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
          <Route path="/admin/login" component={AdminLogin} />
          {/* Admin — protegido con AdminGuard */}
          <Route path="/admin">{() => <AdminGuard><AdminDashboard /></AdminGuard>}</Route>
          <Route path="/admin/monitor">{() => <AdminGuard><AdminConsole /></AdminGuard>}</Route>
          <Route path="/admin/tienda">{() => <AdminGuard><AdminTienda /></AdminGuard>}</Route>
          <Route path="/admin/reuniones">{() => <AdminGuard><AdminReuiones /></AdminGuard>}</Route>
          <Route path="/admin/seguimientos">{() => <AdminGuard><AdminSeguimientos /></AdminGuard>}</Route>
          <Route path="/admin/crm">{() => <AdminGuard><AdminCRM /></AdminGuard>}</Route>
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
      </PageWrapper>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
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
