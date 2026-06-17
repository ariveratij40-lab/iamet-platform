import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import VerticalLanding from "./pages/VerticalLanding";
import TechAdvisor from "./pages/TechAdvisor";
import Academy from "./pages/Academy";
import AdminDashboard from "./pages/AdminDashboard";
import AdminConsole from "./pages/AdminConsole";
import Tienda from "./pages/Tienda";
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
        {/* Admin */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/monitor" component={AdminConsole} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
