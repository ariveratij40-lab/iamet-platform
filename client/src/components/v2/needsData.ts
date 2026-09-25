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
    services: [
      "Cámaras IP",
      "VMS",
      "Analítica",
      "Monitoreo",
      "Almacenamiento",
    ],
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
    services: [
      "RFID",
      "Zebra",
      "Inventarios",
      "Trazabilidad",
      "Impresión",
    ],
    icon: Boxes,
  },
  {
    id: "energia",
    label: "Evitar interrupciones",
    question: "¿Sus sistemas deben continuar operando cuando falla la energía?",
    answer:
      "Protegemos equipos y sistemas críticos mediante respaldo, distribución y monitoreo de energía.",
    services: [
      "UPS",
      "APC",
      "PDU",
      "Respaldo",
      "Monitoreo",
    ],
    icon: Zap,
  },
  {
    id: "desarrollo-ia",
    label: "Automatizar procesos",
    question: "¿Tiene un proceso que podría automatizarse o convertirse en una aplicación?",
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
