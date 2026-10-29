import {
  Bot,
  Cable,
  Fingerprint,
  RadioTower,
  ShieldCheck,
  Zap,
} from "lucide-react";

const R2 = "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev";

type Solution = {
  id: string;
  es: string;
  en: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  capabilitiesEs: string[];
  capabilitiesEn: string[];
  image: string;
  icon: typeof Cable;
};

export const solutions: Solution[] = [
  {
    id: "infraestructura",
    es: "Infraestructura",
    en: "Infrastructure",
    titleEs: "La base tecnológica de una operación preparada para crecer.",
    titleEn: "The technology foundation of an operation built to grow.",
    descEs:
      "Diseñamos e integramos infraestructura crítica de extremo a extremo, desde el punto de red hasta el Data Center.",
    descEn:
      "We design and integrate critical infrastructure end to end, from the network outlet to the Data Center.",
    capabilitiesEs: [
      "Cableado estructurado",
      "Fibra óptica",
      "MDF / IDF",
      "Redes y WiFi",
      "Data Center",
      "Certificación",
    ],
    capabilitiesEn: [
      "Structured cabling",
      "Fiber optics",
      "MDF / IDF",
      "Networks & WiFi",
      "Data Center",
      "Certification",
    ],
    image: `${R2}/services/cableado.jpg`,
    icon: Cable,
  },
  {
    id: "seguridad-cctv",
    es: "Seguridad CCTV",
    en: "CCTV Security",
    titleEs: "Visibilidad e inteligencia para proteger su operación.",
    titleEn: "Visibility and intelligence to protect your operation.",
    descEs:
      "Videoseguridad IP, administración centralizada y analítica para instalaciones empresariales e industriales.",
    descEn:
      "IP video security, centralized management and analytics for enterprise and industrial facilities.",
    capabilitiesEs: [
      "Videovigilancia IP",
      "VMS",
      "Analítica de video",
      "Monitoreo",
      "Integración",
      "Almacenamiento",
    ],
    capabilitiesEn: [
      "IP video",
      "VMS",
      "Video analytics",
      "Monitoring",
      "Integration",
      "Storage",
    ],
    image: "/images/solutions/cctv-installation-cinematic.png",
    icon: ShieldCheck,
  },
  {
    id: "control-acceso",
    es: "Control de Acceso",
    en: "Access Control",
    titleEs: "Controle quién entra, cuándo entra y a qué áreas accede.",
    titleEn: "Control who enters, when they enter and where they can go.",
    descEs:
      "Control de acceso físico integrado con identidad, visitantes y sistemas de videoseguridad.",
    descEn:
      "Physical access control integrated with identity, visitors and video security systems.",
    capabilitiesEs: [
      "Puertas",
      "Biometría",
      "Credenciales",
      "Torniquetes",
      "Visitantes",
      "Integración CCTV",
    ],
    capabilitiesEn: [
      "Doors",
      "Biometrics",
      "Credentials",
      "Turnstiles",
      "Visitors",
      "CCTV integration",
    ],
    image: "/images/solutions/access-control-cinematic.png",
    icon: Fingerprint,
  },
  {
    id: "rfid",
    es: "RFID e Identificación",
    en: "RFID & Identification",
    titleEs: "Haga visible el movimiento de activos e inventarios.",
    titleEn: "Make the movement of assets and inventory visible.",
    descEs:
      "Lectores portátiles, portales y etiquetas RFID para agilizar inventarios y seguir cada movimiento de mercancía en su almacén.",
    descEn:
      "Handheld readers, portals and RFID labels to simplify inventory counts and track every movement of goods in your warehouse.",
    capabilitiesEs: [
      "Lectores RFID",
      "Antenas y portales",
      "Etiquetas RFID",
      "Inventario y trazabilidad",
      "Impresión RFID",
      "Zebra",
    ],
    capabilitiesEn: [
      "RFID readers",
      "Antennas and portals",
      "RFID labels",
      "Inventory and traceability",
      "RFID printing",
      "Zebra",
    ],
    image: "/images/solutions/rfid-traceability-cinematic.png",
    icon: RadioTower,
  },
  {
    id: "energia",
    es: "Energía",
    en: "Power",
    titleEs: "Continuidad eléctrica para tecnología que no puede detenerse.",
    titleEn: "Power continuity for technology that cannot stop.",
    descEs:
      "Integramos soluciones de energía crítica con UPS Galaxy VXL de Schneider Electric para respaldar centros de datos y operaciones esenciales.",
    descEn:
      "We integrate critical power solutions with Schneider Electric Galaxy VXL UPS systems to support data centers and essential operations.",
    capabilitiesEs: [
      "UPS Galaxy VXL",
      "Schneider Electric",
      "Energía crítica",
      "Continuidad operativa",
      "Monitoreo",
      "Respaldo",
    ],
    capabilitiesEn: [
      "Galaxy VXL UPS",
      "Schneider Electric",
      "Critical power",
      "Business continuity",
      "Monitoring",
      "Backup power",
    ],
    image: "/images/solutions/energy-galaxy-vxl-cinematic.png",
    icon: Zap,
  },
  {
    id: "desarrollo-ia",
    es: "Desarrollo y Aplicaciones IA",
    en: "Development & AI Applications",
    titleEs: "Inteligencia aplicada a procesos reales de negocio.",
    titleEn: "Intelligence applied to real business processes.",
    descEs:
      "Desarrollamos aplicaciones, automatizaciones, integraciones y agentes inteligentes conectados con su operación.",
    descEn:
      "We build applications, automation, integrations and intelligent agents connected to your operation.",
    capabilitiesEs: [
      "Aplicaciones",
      "Integraciones",
      "Automatización",
      "Agentes IA",
      "Dashboards",
      "Datos",
    ],
    capabilitiesEn: [
      "Applications",
      "Integrations",
      "Automation",
      "AI agents",
      "Dashboards",
      "Data",
    ],
    image: `${R2}/services/software.jpg`,
    icon: Bot,
  },
];

// Public solution routes use different slugs from the marketing catalog.
export const solutionDestinations: Record<string, string> = {
  infraestructura: "/soluciones/infraestructura",
  "seguridad-cctv": "/soluciones/cctv",
  "control-acceso": "/soluciones/control-acceso",
  rfid: "/soluciones/rfid",
  energia: "/contacto",
  "desarrollo-ia": "/soluciones/software-ia",
};
