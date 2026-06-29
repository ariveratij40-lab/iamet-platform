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
          {/* Admin */}
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/monitor" component={AdminConsole} />
          <Route path="/admin/tienda" component={AdminTienda} />
          <Route path="/admin/reuniones" component={AdminReuiones} />
          <Route path="/admin/seguimientos" component={AdminSeguimientos} />
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
