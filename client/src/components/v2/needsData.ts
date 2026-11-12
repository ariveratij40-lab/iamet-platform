import {
  Boxes,
  Building2,
  Code2,
  DoorOpen,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const needs = [
  {
    id: "nueva-instalacion",
    label: "Nueva instalación",
    question: "¿Está construyendo, ampliando o modernizando sus instalaciones?",
    answer:
      "Diseñamos e integramos la infraestructura tecnológica necesaria para poner su operación en marcha y prepararla para crecer.",
    services: [
      "Cableado y fibra",
      "Redes y WiFi",
      "Data Center",
      "CCTV",
      "Acceso",
      "Energía",
    ],
    icon: Building2,
  },
  {
    id: "seguridad-cctv",
    label: "Proteger instalaciones",
    question: "¿Necesita saber qué ocurre en sus instalaciones?",
    answer:
      "Integramos videovigilancia para supervisar operaciones, investigar incidentes y proteger personas, activos e instalaciones.",
    services: ["Cámaras IP", "VMS", "Analítica", "Monitoreo", "Almacenamiento"],
    icon: ShieldCheck,
  },
  {
    id: "control-acceso",
    label: "Controlar accesos",
    question: "¿Necesita controlar quién entra y a qué áreas puede acceder?",
    answer:
      "Integramos puertas, credenciales, biometría, visitantes y torniquetes para administrar el acceso de forma centralizada.",
    services: [
      "Puertas",
      "Biometría",
      "Credenciales",
      "Visitantes",
      "Torniquetes",
    ],
    icon: DoorOpen,
  },
  {
    id: "rfid",
    label: "Localizar activos",
    question: "¿Necesita controlar inventarios, herramientas o activos?",
    answer:
      "Implementamos identificación y trazabilidad para conocer qué tiene, dónde está y cómo se mueve dentro de su operación.",
    services: ["RFID", "Zebra", "Inventarios", "Trazabilidad", "Impresión"],
    icon: Boxes,
  },
  {
    id: "energia",
    label: "Evitar interrupciones",
    question: "¿Sus sistemas deben continuar operando cuando falla la energía?",
    answer:
      "Protegemos equipos y sistemas críticos mediante respaldo, distribución y monitoreo de energía.",
    services: ["UPS", "APC", "PDU", "Respaldo", "Monitoreo"],
    icon: Zap,
  },
  {
    id: "desarrollo-ia",
    label: "Automatizar procesos",
    question:
      "¿Tiene un proceso que podría automatizarse o convertirse en una aplicación?",
    answer:
      "Desarrollamos aplicaciones, integraciones, automatizaciones y agentes de IA adaptados a procesos reales de negocio.",
    services: [
      "Aplicaciones",
      "Integraciones",
      "Automatización",
      "Agentes IA",
      "Dashboards",
    ],
    icon: Code2,
  },
];

const englishContent = [
  {
    label: "New facilities",
    question: "Are you building, expanding or modernizing your facilities?",
    answer:
      "We design and integrate the technology infrastructure your operation needs to get started and prepare for growth.",
    services: [
      "Cabling and fiber",
      "Networks and WiFi",
      "Data Center",
      "CCTV",
      "Access",
      "Power",
    ],
  },
  {
    label: "Protect facilities",
    question: "Do you need to know what is happening at your facilities?",
    answer:
      "We integrate video surveillance to oversee operations, investigate incidents and protect people, assets and facilities.",
    services: ["IP cameras", "VMS", "Analytics", "Monitoring", "Storage"],
  },
  {
    label: "Control access",
    question:
      "Do you need to control who enters and which areas they can access?",
    answer:
      "We integrate doors, credentials, biometrics, visitors and turnstiles to manage access centrally.",
    services: ["Doors", "Biometrics", "Credentials", "Visitors", "Turnstiles"],
  },
  {
    label: "Locate assets",
    question: "Do you need to track inventory, tools or assets?",
    answer:
      "We implement identification and traceability so you know what you have, where it is and how it moves through your operation.",
    services: ["RFID", "Zebra", "Inventory", "Traceability", "Printing"],
  },
  {
    label: "Prevent downtime",
    question: "Do your systems need to keep running when the power fails?",
    answer:
      "We protect critical equipment and systems with backup power, distribution and power monitoring.",
    services: ["UPS", "APC", "PDU", "Backup power", "Monitoring"],
  },
  {
    label: "Automate processes",
    question:
      "Do you have a process that could be automated or turned into an application?",
    answer:
      "We develop applications, integrations, automation and AI agents tailored to real business processes.",
    services: [
      "Applications",
      "Integrations",
      "Automation",
      "AI agents",
      "Dashboards",
    ],
  },
] satisfies Array<
  Pick<(typeof needs)[number], "label" | "question" | "answer" | "services">
>;

export const needsByLanguage = {
  es: needs,
  en: needs.map((item, index) => ({ ...item, ...englishContent[index] })),
};
