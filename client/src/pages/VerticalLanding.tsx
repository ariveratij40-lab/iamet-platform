import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  Server, Shield, Cpu, Brain, Headphones, GraduationCap, FileCheck,
  ArrowRight, CheckCircle2, ChevronRight, Phone, Mail, Calendar,
  KeyRound, Camera, Volume2, Monitor, Laptop, ClipboardList, Database, Factory, Network, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import LeadForm from "@/components/LeadForm";

const VERTICAL_ICONS: Record<string, React.ElementType> = {
  Server, Shield, Cpu, Brain, Headphones, GraduationCap, FileCheck,
  KeyRound, Camera, Volume2, Monitor, Laptop, ClipboardList, Database, Factory, Network, Zap,
};

const VERTICAL_COLORS: Record<string, string> = {
  infraestructura: "oklch(0.65 0.20 240)",
  seguridad: "oklch(0.62 0.22 25)",
  "control-acceso": "oklch(0.72 0.18 75)",
  cctv: "oklch(0.62 0.22 290)",
  "audio-voceo": "oklch(0.65 0.22 330)",
  "salas-juntas": "oklch(0.68 0.18 185)",
  rfid: "oklch(0.68 0.18 160)",
  "software-ia": "oklch(0.70 0.22 280)",
  "computo-licenciamiento": "oklch(0.68 0.20 265)",
  "polizas-servicios": "oklch(0.68 0.18 40)",
  "servicios-administrados": "oklch(0.68 0.18 160)",
  educacion: "oklch(0.75 0.18 75)",
  compliance: "oklch(0.62 0.22 25)",
};

// Extended content per vertical
const VERTICAL_CONTENT: Record<string, {
  tagline: string;
  benefits: string[];
  useCases: { title: string; desc: string }[];
  cta: string;
}> = {
  infraestructura: {
    tagline: "La base sólida que tu empresa necesita para crecer sin límites.",
    benefits: [
      "Diseño e implementación de redes LAN/WAN empresariales",
      "Cableado estructurado certificado Cat6A y fibra óptica",
      "Centros de datos y salas de servidores",
      "Migración a nube híbrida y privada",
      "Gestión de activos tecnológicos con SKIA DCIM",
      "Monitoreo proactivo 24/7 con alertas inteligentes",
    ],
    useCases: [
      { title: "Manufactura", desc: "Redes industriales OT/IT convergentes para planta de producción." },
      { title: "Corporativo", desc: "Infraestructura multi-sede con SD-WAN y failover automático." },
      { title: "Data Center", desc: "Diseño y construcción de salas de servidores Tier II/III." },
    ],
    cta: "Solicitar Auditoría de Infraestructura",
  },
  seguridad: {
    tagline: "Protege lo que más importa con tecnología de vigilancia de última generación.",
    benefits: [
      "Sistemas CCTV IP con analítica de video inteligente",
      "Control de acceso biométrico y por tarjeta",
      "Alarmas de intrusión y detección de perímetro",
      "Monitoreo remoto 24/7 desde NOC dedicado",
      "Integración con plataformas VMS líderes (Genetec, Milestone)",
      "Pólizas de mantenimiento preventivo y correctivo",
    ],
    useCases: [
      { title: "Retail", desc: "CCTV con analítica de comportamiento y conteo de personas." },
      { title: "Industria", desc: "Control de acceso por zonas con registro de bitácora." },
      { title: "Residencial", desc: "Sistemas de alarma integrados con monitoreo central." },
    ],
    cta: "Solicitar Diagnóstico de Seguridad",
  },
  rfid: {
    tagline: "Automatiza el control de inventarios y activos con precisión milimétrica.",
    benefits: [
      "Implementación de sistemas RFID UHF y HF",
      "Rastreo de activos en tiempo real",
      "Control de inventario automatizado",
      "Integración con ERP (SAP, Oracle, Microsoft)",
      "Lectores fijos y portátiles industriales",
      "IoT y sensores para monitoreo de condiciones",
    ],
    useCases: [
      { title: "Logística", desc: "Rastreo de pallets y contenedores en tiempo real." },
      { title: "Salud", desc: "Control de equipos médicos y medicamentos críticos." },
      { title: "Manufactura", desc: "WIP tracking y control de línea de producción." },
    ],
    cta: "Solicitar Demo de RFID",
  },
  "software-ia": {
    tagline: "Transforma tus procesos con software inteligente desarrollado a tu medida.",
    benefits: [
      "Desarrollo de software empresarial a medida",
      "Agentes de Inteligencia Artificial para automatización",
      "RPA (Automatización de Procesos Robóticos)",
      "Integración de sistemas y APIs empresariales",
      "Plataformas SaaS y aplicaciones móviles",
      "Machine Learning y analítica predictiva",
    ],
    useCases: [
      { title: "Operaciones", desc: "Agente IA para gestión de tickets y escalamiento automático." },
      { title: "Finanzas", desc: "RPA para conciliación bancaria y reportes automáticos." },
      { title: "Ventas", desc: "CRM personalizado con predicción de cierre de oportunidades." },
    ],
    cta: "Solicitar Consultoría de IA",
  },
  "servicios-administrados": {
    tagline: "Delega la operación de tu TI y enfócate en tu negocio principal.",
    benefits: [
      "NOC 24/7 con monitoreo proactivo",
      "Mesa de ayuda técnica multinivel",
      "Gestión de parches y actualizaciones",
      "Respaldo y recuperación ante desastres",
      "Pólizas de SLA con tiempos de respuesta garantizados",
      "Reportes ejecutivos mensuales de desempeño",
    ],
    useCases: [
      { title: "PyME", desc: "TI administrada completa sin necesidad de equipo interno." },
      { title: "Corporativo", desc: "Co-managed IT con extensión del equipo existente." },
      { title: "Gobierno", desc: "Operación de infraestructura crítica con SLA exigente." },
    ],
    cta: "Solicitar Propuesta de Servicios",
  },
  educacion: {
    tagline: "Capacita a tu equipo con los mejores expertos en tecnología.",
    benefits: [
      "Cursos especializados en infraestructura y seguridad",
      "Preparación para certificaciones internacionales",
      "Talleres prácticos con equipos reales",
      "Modalidades presencial, virtual y blended",
      "Programas corporativos personalizados",
      "Instructores certificados por fabricantes líderes",
    ],
    useCases: [
      { title: "TI Corporativo", desc: "Programa de actualización técnica para equipos de TI." },
      { title: "Operaciones", desc: "Capacitación en uso de sistemas de seguridad instalados." },
      { title: "Directivos", desc: "Seminarios de ciberseguridad y gestión de riesgos tecnológicos." },
    ],
    cta: "Ver Catálogo de Cursos",
  },
  compliance: {
    tagline: "Cumple con los estándares internacionales y protege tu empresa de riesgos.",
    benefits: [
      "Auditorías de seguridad informática",
      "Implementación de ISO 27001",
      "Evaluación de riesgos bajo marco NIST",
      "Cumplimiento de LFPDPPP y regulaciones sectoriales",
      "Planes de continuidad de negocio (BCP/DRP)",
      "Gestión de vulnerabilidades y pruebas de penetración",
    ],
    useCases: [
      { title: "Financiero", desc: "Cumplimiento regulatorio CNBV y auditorías de seguridad." },
      { title: "Salud", desc: "Protección de datos de pacientes bajo normativa NOM." },
      { title: "Gobierno", desc: "Implementación de controles de seguridad para datos públicos." },
    ],
    cta: "Solicitar Auditoría de Compliance",
  },
  "control-acceso": {
    tagline: "Controla quién entra, cuándo y dónde con tecnología biométrica de última generación.",
    benefits: [
      "Lectores biométricos de huella, facial e iris",
      "Tarjetas inteligentes y credenciales móviles HID",
      "Torniquetes y barreras vehiculares",
      "Software de gestión y reportes de acceso",
      "Integración con CCTV, nómina y ERP",
      "Certificación OSDP para comunicaciones seguras",
    ],
    useCases: [
      { title: "Corporativo", desc: "Control de acceso por zonas con credencial móvil y registro de bitacóra." },
      { title: "Industrial", desc: "Acceso a áreas restringidas con biometría y registro de tiempo." },
      { title: "Gobierno", desc: "Gestión de identidades y acceso a instalaciones críticas." },
    ],
    cta: "Solicitar Diagnóstico de Control de Acceso",
  },
  cctv: {
    tagline: "Vigila cada ángulo de tus instalaciones con inteligencia artificial integrada.",
    benefits: [
      "Cámaras IP 2MP a 8MP, PTZ y fisheye",
      "Analítica de video: detección de intrusos, conteo de personas, LPR",
      "Videovigilancia perimetral con radar y térmica",
      "NVR y servidor de grabación con retención configurable",
      "Integración con control de acceso y alarmas",
      "Monitoreo remoto desde NOC 24/7",
    ],
    useCases: [
      { title: "Retail", desc: "CCTV con analítica de comportamiento y conteo de personas en tienda." },
      { title: "Manufactura", desc: "Videovigilancia de líneas de producción y áreas restringidas." },
      { title: "Corporativo", desc: "Sistema centralizado de videovigilancia multi-sede." },
    ],
    cta: "Solicitar Diseño de Sistema CCTV",
  },
  "audio-voceo": {
    tagline: "Comunica con claridad en cualquier entorno con sistemas de audio profesional.",
    benefits: [
      "Sistemas de voceo IP y analógico para interiores y exteriores",
      "Intercomunicación de video y audio",
      "Audio distribuido para zonas múltiples",
      "Sistemas de evacuación y emergencia (NFPA 72)",
      "Integración con sistemas de alarma y control de acceso",
      "Amplificadores, bocinas y controladores de zona",
    ],
    useCases: [
      { title: "Hospitales", desc: "Voceo de emergencia y comunicación entre áreas clínicas." },
      { title: "Manufactura", desc: "Comunicación en planta con zonas de ruido elevado." },
      { title: "Centros Comerciales", desc: "Audio ambiental y voceo de emergencia en áreas públicas." },
    ],
    cta: "Solicitar Diseño de Sistema de Audio",
  },
  "salas-juntas": {
    tagline: "Transforma tus reuniones en experiencias de colaboración de clase mundial.",
    benefits: [
      "Videoconferencia: Cisco Webex, Microsoft Teams, Zoom Rooms",
      "Pantallas interactivas y proyectores 4K",
      "Micrófonos de arreglo y sistemas de audio profesional",
      "Control centralizado con paneles táctiles",
      "Colaboración híbrida: presencial + remoto sin fricción",
      "Señalización digital y sistemas de reserva de salas",
    ],
    useCases: [
      { title: "Corporativo", desc: "Salas de juntas ejecutivas con videoconferencia y control AV integrado." },
      { title: "Educación", desc: "Aulas híbridas con captura de video y colaboración en tiempo real." },
      { title: "Gobierno", desc: "Salas de situación con múltiples fuentes de video y audio." },
    ],
    cta: "Solicitar Diseño de Sala de Juntas",
  },
  "computo-licenciamiento": {
    tagline: "Equipa a tu empresa con la tecnología correcta al mejor costo total de propiedad.",
    benefits: [
      "Equipos de cómputo empresarial: laptops, desktops, workstations",
      "Servidores y almacenamiento: Dell, HP, Lenovo, IBM",
      "Licenciamiento Microsoft 365, Windows, Office",
      "Licenciamiento Adobe, Autodesk y software especializado",
      "Configuración, imagen y despliegue masivo",
      "Soporte y garantía extendida",
    ],
    useCases: [
      { title: "PyME", desc: "Renovación de parque de cómputo con financiamiento y soporte." },
      { title: "Corporativo", desc: "Despliegue masivo de equipos con imagen estandarizada." },
      { title: "Gobierno", desc: "Licenciamiento por volumen y gestión de activos de software." },
    ],
    cta: "Solicitar Cotización de Equipo",
  },
  "polizas-servicios": {
    tagline: "Garantiza la continuidad operativa de tu infraestructura con SLA definidos.",
    benefits: [
      "Pólizas de mantenimiento preventivo y correctivo",
      "NOC 24/7 con monitoreo proactivo de infraestructura",
      "Mesa de ayuda técnica multinivel (N1, N2, N3)",
      "Tiempos de respuesta garantizados por contrato",
      "Gestión de parches, actualizaciones y vulnerabilidades",
      "Reportes ejecutivos mensuales de desempeño",
    ],
    useCases: [
      { title: "Manufactura", desc: "Póliza integral para infraestructura de planta con SLA 4 horas." },
      { title: "Salud", desc: "Soporte 24/7 para sistemas críticos hospitalarios." },
      { title: "Gobierno", desc: "Operación administrada de infraestructura con reportes de cumplimiento." },
    ],
    cta: "Solicitar Propuesta de Póliza",
  },
};

export default function VerticalLanding() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { data: verticals = [] } = trpc.verticals.list.useQuery();

  const vertical = verticals.find((v) => v.slug === slug);
  const content = VERTICAL_CONTENT[slug];
  const Icon = VERTICAL_ICONS[vertical?.icon ?? "Server"] ?? Server;
  const color = VERTICAL_COLORS[slug] ?? "oklch(0.65 0.20 240)";
  const solutions = Array.isArray(vertical?.solutions) ? vertical.solutions as string[] : [];

  if (!content && verticals.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl font-700 text-[var(--color-iamet-text)]">Vertical no encontrada</h1>
          <Link href="/"><Button>Volver al inicio</Button></Link>
        </div>
      </div>
    );
  }

  const displayContent = content ?? {
    tagline: vertical?.description ?? "",
    benefits: solutions,
    useCases: [],
    cta: "Solicitar Información",
  };

  return (
    <div className="min-h-screen bg-[var(--color-iamet-bg)]">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div
          className="absolute top-0 left-0 w-full h-1"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-5"
          style={{ backgroundColor: color }}
        />
        <div className="container relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-iamet-text-subtle)] mb-8">
            <Link href="/" className="hover:text-[var(--color-iamet-text-muted)] transition-colors">Inicio</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Soluciones</span>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color }}>{vertical?.name ?? slug}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-6"
            >
              {/* Icon + badge */}
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <Icon className="w-7 h-7" style={{ color }} />
                </div>
                <span
                  className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border"
                  style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
                >
                  {vertical?.name ?? slug}
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl lg:text-5xl font-800 text-[var(--color-iamet-text)] leading-tight">
                {displayContent.tagline}
              </h1>

              {/* Solutions tags */}
              {solutions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {solutions.map((sol) => (
                    <span
                      key={sol}
                      className="text-xs px-3 py-1 rounded-full"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {sol}
                    </span>
                  ))}
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link href="/tech-advisor">
                  <Button
                    size="lg"
                    className="text-white font-semibold btn-press"
                    style={{ backgroundColor: color }}
                  >
                    {displayContent.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <a href="tel:+525500000000">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] hover:text-[var(--color-iamet-text)] bg-transparent btn-press"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Llamar ahora
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Lead Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
            >
              <LeadForm verticalSlug={slug} source="form" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--color-iamet-bg-secondary)]">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 space-y-3"
          >
            <h2 className="font-display text-3xl font-800 text-[var(--color-iamet-text)]">
              ¿Qué incluye este servicio?
            </h2>
            <p className="text-[var(--color-iamet-text-muted)] max-w-lg mx-auto">
              Soluciones completas respaldadas por expertos certificados y SLA garantizado.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayContent.benefits.map((benefit, i) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="neumorphic rounded-xl p-4 flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color }} />
                <span className="text-sm text-[var(--color-iamet-text-muted)]">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use Cases ─────────────────────────────────────────────────────── */}
      {displayContent.useCases.length > 0 && (
        <section className="py-20">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12 space-y-3"
            >
              <h2 className="font-display text-3xl font-800 text-[var(--color-iamet-text)]">
                Casos de uso por industria
              </h2>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-6">
              {displayContent.useCases.map(({ title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="neumorphic rounded-2xl p-6 space-y-3"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-800"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {i + 1}
                  </div>
                  <h3 className="font-display font-700 text-[var(--color-iamet-text)]">{title}</h3>
                  <p className="text-sm text-[var(--color-iamet-text-muted)] leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA Bottom ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--color-iamet-bg-secondary)]">
        <div className="container">
          <div className="neumorphic rounded-3xl p-10 text-center space-y-6 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5 blur-3xl"
              style={{ background: `radial-gradient(circle at 50% 50%, ${color}, transparent 70%)` }}
            />
            <div className="relative z-10 space-y-4">
              <h2 className="font-display text-3xl font-800 text-[var(--color-iamet-text)]">
                ¿Listo para transformar tu empresa?
              </h2>
              <p className="text-[var(--color-iamet-text-muted)] max-w-md mx-auto">
                Agenda una consultoría gratuita con nuestros especialistas y recibe un diagnóstico personalizado.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/tech-advisor">
                  <Button size="lg" className="text-white font-semibold btn-press" style={{ backgroundColor: color }}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Agendar Consultoría
                  </Button>
                </Link>
                <a href="mailto:contacto@iamet.mx">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] bg-transparent btn-press"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Other Verticals ───────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container">
          <h3 className="font-display text-xl font-700 text-[var(--color-iamet-text)] mb-6 text-center">
            Otras soluciones IAMET
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {verticals.filter((v) => v.slug !== slug).map((v) => {
              const VIcon = VERTICAL_ICONS[v.icon ?? "Server"] ?? Server;
              const vColor = VERTICAL_COLORS[v.slug] ?? "var(--color-iamet-accent)";
              return (
                <Link key={v.slug} href={`/soluciones/${v.slug}`}>
                  <div className="neumorphic neumorphic-hover rounded-xl px-4 py-2.5 flex items-center gap-2 cursor-pointer">
                    <VIcon className="w-4 h-4" style={{ color: vColor }} />
                    <span className="text-sm text-[var(--color-iamet-text-muted)]">{v.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
