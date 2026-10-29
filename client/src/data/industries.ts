import {
  Factory,
  Stethoscope,
  GraduationCap,
  Landmark,
  ShoppingBag,
  Hotel,
  Building2,
  Globe,
} from "lucide-react";

export const INDUSTRIES = [
  {
    id: "manufactura",
    name: "Manufactura",
    icon: Factory,
    color: "#0EA5E9",
    tagline: "Infraestructura robusta para entornos industriales exigentes.",
    solutions: [
      "Redes OT/IT convergentes",
      "RFID en línea de producción",
      "CCTV de planta",
      "Control de acceso por zonas",
      "Voceo de emergencia",
    ],
    cases: [
      {
        title: "Planta automotriz",
        desc: "Red industrial con segmentación OT/IT y monitoreo de activos RFID en tiempo real.",
      },
      {
        title: "Manufactura de alimentos",
        desc: "CCTV con analítica de calidad y control de acceso a áreas de producción.",
      },
    ],
  },
  {
    id: "salud",
    name: "Salud",
    icon: Stethoscope,
    color: "#10B981",
    tagline:
      "Tecnología confiable para entornos donde la continuidad es crítica.",
    solutions: [
      "Control de acceso a áreas clínicas",
      "RFID para equipos médicos",
      "Voceo hospitalario",
      "Redes de alta disponibilidad",
      "Pólizas 24/7",
    ],
    cases: [
      {
        title: "Hospital regional",
        desc: "Sistema de voceo de emergencia integrado con alarmas y control de acceso por credencial.",
      },
      {
        title: "Clínica privada",
        desc: "RFID para trazabilidad de equipos médicos y medicamentos críticos.",
      },
    ],
  },
  {
    id: "educacion",
    name: "Educación",
    icon: GraduationCap,
    color: "#F59E0B",
    tagline: "Entornos de aprendizaje conectados y seguros.",
    solutions: [
      "Redes WiFi de alta densidad",
      "CCTV en campus",
      "Salas de juntas AV",
      "Control de acceso estudiantil",
      "Señalización digital",
    ],
    cases: [
      {
        title: "Universidad pública",
        desc: "Red WiFi 6 para 10,000 usuarios simultáneos con segmentación por rol.",
      },
      {
        title: "Colegio privado",
        desc: "CCTV con analítica de presencia y control de acceso con credencial estudiantil.",
      },
    ],
  },
  {
    id: "gobierno",
    name: "Gobierno",
    icon: Landmark,
    color: "#8B5CF6",
    tagline:
      "Infraestructura tecnológica para instituciones que no pueden fallar.",
    solutions: [
      "Redes de misión crítica",
      "Videovigilancia urbana",
      "Control de acceso biométrico",
      "Centros de datos gubernamentales",
      "Compliance y auditoría",
    ],
    cases: [
      {
        title: "Palacio municipal",
        desc: "Sistema de videovigilancia perimetral con analítica y monitoreo desde C4.",
      },
      {
        title: "Dependencia federal",
        desc: "Infraestructura de red con alta disponibilidad y cumplimiento ISO 27001.",
      },
    ],
  },
  {
    id: "retail",
    name: "Retail",
    icon: ShoppingBag,
    color: "#EF4444",
    tagline: "Tecnología que protege y optimiza cada punto de venta.",
    solutions: [
      "CCTV con conteo de personas",
      "RFID para inventario",
      "Redes para POS",
      "Control de acceso a bodegas",
      "Señalización digital",
    ],
    cases: [
      {
        title: "Cadena de tiendas",
        desc: "CCTV con analítica de comportamiento y conteo de personas en 50 sucursales.",
      },
      {
        title: "Centro comercial",
        desc: "RFID para inventario en tiempo real con integración a ERP.",
      },
    ],
  },
  {
    id: "hoteleria",
    name: "Hotelería",
    icon: Hotel,
    color: "#F97316",
    tagline:
      "Experiencias de huésped superiores respaldadas por tecnología invisible.",
    solutions: [
      "WiFi de alta densidad para huéspedes",
      "Control de acceso con llave digital",
      "CCTV de instalaciones",
      "Audio ambiental",
      "Salas de eventos AV",
    ],
    cases: [
      {
        title: "Hotel boutique",
        desc: "Sistema de control de acceso con app móvil y llave digital para huéspedes.",
      },
      {
        title: "Resort",
        desc: "Infraestructura WiFi para 2,000 dispositivos simultáneos en múltiples edificios.",
      },
    ],
  },
  {
    id: "corporativo",
    name: "Corporativo",
    icon: Building2,
    color: "#06B6D4",
    tagline:
      "Oficinas inteligentes que potencian la productividad de tu equipo.",
    solutions: [
      "Salas de juntas colaborativas",
      "Redes SD-WAN multi-sede",
      "Control de acceso corporativo",
      "CCTV de instalaciones",
      "Servicios administrados",
    ],
    cases: [
      {
        title: "Torre corporativa",
        desc: "Salas de juntas con Cisco Webex y control AV centralizado en 20 pisos.",
      },
      {
        title: "Empresa multi-sede",
        desc: "SD-WAN con failover automático y monitoreo centralizado desde NOC.",
      },
    ],
  },
  {
    id: "educacion-superior",
    name: "Educación Superior",
    icon: Globe,
    color: "#22C55E",
    tagline: "Campus universitarios conectados para la educación del futuro.",
    solutions: [
      "Redes de investigación de alta velocidad",
      "Data Centers universitarios",
      "Salas de cómputo",
      "Videoconferencia",
      "RFID para biblioteca",
    ],
    cases: [
      {
        title: "Universidad tecnológica",
        desc: "Data Center Tier II con red de 40Gbps para investigación y servicios académicos.",
      },
      {
        title: "Campus virtual",
        desc: "Infraestructura de videoconferencia para educación híbrida en 15 sedes.",
      },
    ],
  },
];
