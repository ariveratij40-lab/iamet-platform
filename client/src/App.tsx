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
import TiendaPerfil from "./pages/TiendaPerfil";
import Contact from "./pages/Contact";
import Navbar from "./components/Navbar";

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        {/* Verticales — ruta dinámica */}
        <Route path="/soluciones/:slug" component={VerticalLanding} />
        {/* Herramientas */}
        <Route path="/tech-advisor" component={TechAdvisor} />
        <Route path="/academy" component={Academy} />
        <Route path="/contacto" component={Contact} />
        {/* Tienda */}
        <Route path="/tienda" component={Tienda} />
        <Route path="/tienda/verificar" component={TiendaVerificar} />
        <Route path="/tienda/perfil" component={TiendaPerfil} />
        <Route path="/tienda/:slug" component={ProductoDetalle} />
        {/* Admin */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/monitor" component={AdminConsole} />
        <Route path="/admin/tienda" component={AdminTienda} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
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
