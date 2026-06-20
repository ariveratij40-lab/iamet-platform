import React, { createContext, useContext, useState } from "react";

export type Language = "es" | "en";

// ─── Traducciones ─────────────────────────────────────────────────────────────
export const translations = {
  es: {
    // Navbar / Sidebar
    nav: {
      home: "Inicio",
      solutions: "Soluciones",
      industries: "Industrias",
      techAdvisor: "Tech Advisor",
      academy: "Academy",
      store: "Tienda",
      contact: "Contacto",
      dashboard: "Dashboard",
      liveMonitor: "Monitor en Vivo",
      login: "Iniciar Sesión",
      darkMode: "Modo Oscuro",
      lightMode: "Modo Claro",
      language: "Idioma",
      collapseMenu: "Colapsar menú",
      expandMenu: "Expandir menú",
    },
    // Solutions submenu
    solutions: {
      infra: "Infraestructura Tecnológica",
      security: "Seguridad Electrónica",
      rfid: "RFID y Automatización",
      software: "Software e IA",
      managed: "Servicios Administrados",
      compliance: "Compliance y Auditoría",
    },
    // Home page
    home: {
      greeting: "Hola, somos IAMET",
      subtitle: "Integrador de Soluciones Tecnológicas",
      question: "¿Cómo podemos ayudarte hoy?",
      placeholder: "Pregúntale al Agente Virtual IAMET...",
      placeholderInfra: "Pregunta sobre cableado, Panduit, certificación TIA...",
      iametAI: "IAMET AI",
      panduitCertified: "Panduit Certified",
      servicesTitle: "Nuestros Servicios",
      servicesSubtitle: "Soluciones tecnológicas integrales para tu empresa",
      askAbout: "Consultar",
      swipeHint: "← Desliza para ver todos →",
      suggestions: [
        "¿Cómo mejorar la seguridad de mi empresa?",
        "Necesito cableado estructurado Cat6A",
        "¿Qué soluciones de RFID existen?",
        "Quiero automatizar procesos con IA",
        "Necesito equipos de cómputo",
        "Soluciones de energía y UPS",
      ],
    },
    // Services
    services: {
      maintenance: {
        label: "Pólizas de Mantenimiento",
        description: "Contratos preventivos y correctivos para toda tu infraestructura tecnológica con SLA definidos.",
        query: "Quiero información sobre pólizas de mantenimiento para mi infraestructura tecnológica",
      },
      projects: {
        label: "Proyectos Ejecutivos",
        description: "Diseño, gestión e implementación de proyectos tecnológicos llave en mano con documentación completa.",
        query: "Necesito asesoría para un proyecto ejecutivo de tecnología en mi empresa",
      },
      energy: {
        label: "Soluciones de Energía",
        description: "UPS, plantas de emergencia, PDUs inteligentes y sistemas de energía ininterrumpida.",
        query: "¿Qué soluciones de energía y UPS ofrecen para proteger equipos críticos?",
      },
      software: {
        label: "Desarrollo de Software",
        description: "Aplicaciones web, móviles y sistemas a medida con IA y automatización de procesos.",
        query: "Me interesa desarrollar software a medida o una aplicación para mi empresa",
      },
      computing: {
        label: "Cómputo y Tecnología",
        description: "Suministro, configuración y soporte de equipos de cómputo, servidores y periféricos.",
        query: "Necesito equipos de cómputo, servidores o tecnología para mi empresa",
      },
      security: {
        label: "Seguridad Electrónica",
        description: "CCTV, control de acceso, voceo y detección de intrusos con tecnología IP de última generación.",
        query: "¿Cómo puedo mejorar la seguridad electrónica de mis instalaciones con CCTV y control de acceso?",
      },
      av: {
        label: "Audio y Video",
        description: "Salas de videoconferencia, señalización digital y sistemas de sonido profesional.",
        query: "Quiero implementar soluciones de audio y video profesional o una sala de videoconferencia",
      },
      cabling: {
        label: "Cableado Estructurado",
        description: "Infraestructura de red certificada Cat6A/Fibra Óptica con garantía Panduit de hasta 25 años.",
        query: "Necesito cableado estructurado certificado Cat6A o diseño de Data Center con estándares TIA-942",
      },
    },
  },
  en: {
    // Navbar / Sidebar
    nav: {
      home: "Home",
      solutions: "Solutions",
      industries: "Industries",
      techAdvisor: "Tech Advisor",
      academy: "Academy",
      store: "Store",
      contact: "Contact",
      dashboard: "Dashboard",
      liveMonitor: "Live Monitor",
      login: "Sign In",
      darkMode: "Dark Mode",
      lightMode: "Light Mode",
      language: "Language",
      collapseMenu: "Collapse menu",
      expandMenu: "Expand menu",
    },
    // Solutions submenu
    solutions: {
      infra: "IT Infrastructure",
      security: "Electronic Security",
      rfid: "RFID & Automation",
      software: "Software & AI",
      managed: "Managed Services",
      compliance: "Compliance & Audit",
    },
    // Home page
    home: {
      greeting: "Hello, we are IAMET",
      subtitle: "Technology Solutions Integrator",
      question: "How can we help you today?",
      placeholder: "Ask the IAMET Virtual Agent...",
      placeholderInfra: "Ask about cabling, Panduit, TIA certification...",
      iametAI: "IAMET AI",
      panduitCertified: "Panduit Certified",
      servicesTitle: "Our Services",
      servicesSubtitle: "Comprehensive technology solutions for your business",
      askAbout: "Inquire",
      swipeHint: "← Swipe to see all →",
      suggestions: [
        "How to improve my company's security?",
        "I need Cat6A structured cabling",
        "What RFID solutions are available?",
        "I want to automate processes with AI",
        "I need computing equipment",
        "Energy and UPS solutions",
      ],
    },
    // Services
    services: {
      maintenance: {
        label: "Maintenance Policies",
        description: "Preventive and corrective contracts for your entire technology infrastructure with defined SLAs.",
        query: "I want information about maintenance policies for my technology infrastructure",
      },
      projects: {
        label: "Executive Projects",
        description: "Design, management and turnkey implementation of technology projects with full documentation.",
        query: "I need consulting for an executive technology project at my company",
      },
      energy: {
        label: "Energy Solutions",
        description: "UPS, emergency generators, smart PDUs and uninterruptible power systems.",
        query: "What energy and UPS solutions do you offer to protect critical equipment?",
      },
      software: {
        label: "Software Development",
        description: "Custom web, mobile and enterprise applications with AI and process automation.",
        query: "I'm interested in custom software development or an application for my company",
      },
      computing: {
        label: "Computing & Technology",
        description: "Supply, configuration and support of computers, servers and peripherals.",
        query: "I need computers, servers or technology for my company",
      },
      security: {
        label: "Electronic Security",
        description: "CCTV, access control, PA systems and intrusion detection with latest IP technology.",
        query: "How can I improve the electronic security of my facilities with CCTV and access control?",
      },
      av: {
        label: "Audio & Video",
        description: "Video conferencing rooms, digital signage and professional sound systems.",
        query: "I want to implement professional audio and video solutions or a video conferencing room",
      },
      cabling: {
        label: "Structured Cabling",
        description: "Certified Cat6A/Fiber Optic network infrastructure with up to 25-year Panduit warranty.",
        query: "I need certified Cat6A structured cabling or Data Center design with TIA-942 standards",
      },
    },
  },
} as const;

export type Translations = typeof translations.es;

// ─── Context ──────────────────────────────────────────────────────────────────
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("iamet_language");
    return (stored as Language) || "es";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("iamet_language", lang);
  };

  const t = translations[language] as Translations;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
