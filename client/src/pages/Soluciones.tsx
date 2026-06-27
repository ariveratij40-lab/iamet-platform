import { motion } from "framer-motion";
import {
  Server, KeyRound, Camera, Volume2, Monitor, Cpu, Brain,
  Laptop, ClipboardList, ArrowRight, ChevronRight,
} from "lucide-react";
import { Link } from "wouter";

const SOLUTIONS = [
  {
    slug: "infraestructura",
    name: "Infraestructura Tecnológica",
    icon: Server,
    color: "#0EA5E9",
    desc: "Cableado estructurado certificado, Data Centers, fibra óptica y redes LAN/WAN empresariales.",
    tags: ["Panduit", "TIA-568", "TIA-942", "Cat6A", "Fibra óptica"],
  },
  {
    slug: "control-acceso",
    name: "Control de Acceso",
    icon: KeyRound,
    color: "#F59E0B",
    desc: "Lectores biométricos, torniquetes, credenciales móviles HID y gestión de identidades.",
    tags: ["HID Global", "Biométrico", "OSDP", "Credencial móvil"],
  },
  {
    slug: "cctv",
    name: "CCTV y Videovigilancia",
    icon: Camera,
    color: "#8B5CF6",
    desc: "Cámaras IP, analítica de video inteligente, NVR/DVR y videovigilancia perimetral.",
    tags: ["Hikvision", "Dahua", "Axis", "Analítica IA", "LPR"],
  },
  {
    slug: "audio-voceo",
    name: "Audio y Voceo",
    icon: Volume2,
    color: "#EC4899",
    desc: "Sistemas de voceo IP, intercomunicación, audio distribuido y evacuación de emergencia.",
    tags: ["NFPA 72", "IP Audio", "Bosch", "Honeywell"],
  },
  {
    slug: "salas-juntas",
    name: "Salas de Juntas",
    icon: Monitor,
    color: "#14B8A6",
    desc: "Videoconferencia, colaboración híbrida, pantallas interactivas y control AV centralizado.",
    tags: ["Cisco Webex", "Teams Rooms", "Zoom Rooms", "AV Pro"],
  },
  {
    slug: "rfid",
    name: "RFID y Automatización",
    icon: Cpu,
    color: "#10B981",
    desc: "Trazabilidad de activos, control de inventarios, IoT industrial e integración con ERP.",
    tags: ["Zebra", "UHF/HF", "SAP", "Oracle", "IoT"],
  },
  {
    slug: "software-ia",
    name: "Desarrollo de Software e IA",
    icon: Brain,
    color: "#A855F7",
    desc: "Aplicaciones empresariales a medida, agentes IA, RPA y automatización inteligente.",
    tags: ["Agentes IA", "RPA", "SaaS", "Machine Learning"],
  },
  {
    slug: "computo-licenciamiento",
    name: "Cómputo y Licenciamiento",
    icon: Laptop,
    color: "#6366F1",
    desc: "Equipos empresariales, servidores, almacenamiento y licenciamiento Microsoft 365.",
    tags: ["Dell", "HP", "Lenovo", "Microsoft 365", "Azure"],
  },
  {
    slug: "polizas-servicios",
    name: "Pólizas y Servicios Administrados",
    icon: ClipboardList,
    color: "#F97316",
    desc: "NOC 24/7, mantenimiento preventivo y correctivo con SLA garantizado por contrato.",
    tags: ["NOC 24/7", "SLA", "Preventivo", "Correctivo"],
  },
];

export default function Soluciones() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-iamet-bg)" }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="pt-24 pb-16 px-4 relative overflow-hidden"
        style={{  }}
      >
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div style={{ maxWidth: "1100px", margin: "0 auto" }} className="relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-8" style={{ color: "var(--color-iamet-text-subtle)" }}>
            <Link href="/" className="hover:text-[var(--color-iamet-text-muted)] transition-colors">Inicio</Link>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: "var(--color-iamet-accent)" }}>Soluciones</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
                style={{ color: "var(--color-iamet-accent)", background: "var(--color-iamet-accent-muted)" }}
              >
                Portafolio
              </span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold mb-4" style={{ color: "var(--color-iamet-text)" }}>
              9 Verticales de Especialización
            </h1>
            <p className="text-lg" style={{ color: "var(--color-iamet-text-muted)" }}>
              Soluciones tecnológicas integrales diseñadas para empresas que exigen excelencia. Cada vertical cuenta con especialistas certificados y metodología probada.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <section
        className="py-8 pb-20 px-4"
        style={{  }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SOLUTIONS.map(({ slug, name, icon: Icon, color, desc, tags }, i) => (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link href={`/soluciones/${slug}`}>
                  <div
                    className="group flex flex-col gap-4 p-6 rounded-2xl cursor-pointer h-full transition-all duration-200"
                    style={{
                      background: "var(--color-iamet-surface)",
                      border: "1px solid var(--color-iamet-border-subtle)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = color + "55";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}18`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-border-subtle)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: color + "20" }}
                      >
                        <Icon className="w-6 h-6" style={{ color }} />
                      </div>
                      <ArrowRight
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                        style={{ color }}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-base font-semibold mb-2" style={{ color: "var(--color-iamet-text)" }}>
                        {name}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-iamet-text-subtle)" }}>
                        {desc}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2.5 py-1 rounded-full"
                          style={{
                            background: color + "12",
                            color,
                            border: `1px solid ${color}30`,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
