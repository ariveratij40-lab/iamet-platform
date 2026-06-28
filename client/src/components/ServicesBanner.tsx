import { useLocation } from "wouter";
import { motion } from "framer-motion";

interface Service {
  id: string;
  label: string;
  description: string;
  image: string;
  color: string;
  accent: string;
  query: string;
}

const SERVICES: Service[] = [
  {
    id: "mantenimiento",
    label: "Mantenimiento TI",
    description: "Soporte preventivo y correctivo de infraestructura tecnológica",
    image: "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/services/mantenimiento.jpg",
    color: "from-blue-900/80 to-blue-700/60",
    accent: "#3b82f6",
    query: "mantenimiento de infraestructura tecnológica",
  },
  {
    id: "proyectos",
    label: "Proyectos Ejecutivos",
    description: "Gestión integral de proyectos tecnológicos de gran escala",
    image: "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/services/proyectos.jpg",
    color: "from-indigo-900/80 to-indigo-700/60",
    accent: "#6366f1",
    query: "gestión de proyectos tecnológicos",
  },
  {
    id: "software",
    label: "Desarrollo de Software",
    description: "Soluciones a medida para automatizar y digitalizar tu empresa",
    image: "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/services/software.jpg",
    color: "from-violet-900/80 to-violet-700/60",
    accent: "#8b5cf6",
    query: "desarrollo de software a medida",
  },
  {
    id: "cctv",
    label: "CCTV & Seguridad",
    description: "Sistemas de videovigilancia IP y analítica de video inteligente",
    image: "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/services/cctv.jpg",
    color: "from-red-900/80 to-red-700/60",
    accent: "#ef4444",
    query: "sistemas de videovigilancia CCTV",
  },
  {
    id: "audiovisual",
    label: "Audio & Video",
    description: "Salas de conferencia, voceo y sistemas de presentación profesional",
    image: "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/services/audiovisual.jpg",
    color: "from-amber-900/80 to-amber-700/60",
    accent: "#f59e0b",
    query: "sistemas de audio y video profesional",
  },
  {
    id: "cableado",
    label: "Cableado Estructurado",
    description: "Infraestructura de red Cat6A, fibra óptica y certificación de canales",
    image: "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/services/cableado.jpg",
    color: "from-teal-900/80 to-teal-700/60",
    accent: "#14b8a6",
    query: "cableado estructurado Cat6 fibra óptica",
  },
  {
    id: "computo",
    label: "Equipos de Cómputo",
    description: "Venta, configuración y soporte de laptops, desktops y servidores",
    image: "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/services/computo.jpg",
    color: "from-cyan-900/80 to-cyan-700/60",
    accent: "#06b6d4",
    query: "equipos de cómputo y servidores",
  },
  {
    id: "energia",
    label: "Energía & UPS",
    description: "Respaldo de energía, reguladores y protección de equipos críticos",
    image: "https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/services/energia.jpg",
    color: "from-green-900/80 to-green-700/60",
    accent: "#22c55e",
    query: "sistemas UPS y respaldo de energía",
  },
];

interface ServicesBannerProps {
  onServiceClick?: (query: string) => void;
}

export default function ServicesBanner({ onServiceClick }: ServicesBannerProps) {
  const [, navigate] = useLocation();

  const handleClick = (service: Service) => {
    if (onServiceClick) {
      onServiceClick(service.query);
    } else {
      navigate("/");
    }
  };

  return (
    <section className="w-full py-16 bg-gray-950 overflow-hidden">
      {/* Header */}
      <div className="text-center mb-12 px-4">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-cyan-400 text-sm font-semibold tracking-[0.2em] uppercase mb-3"
        >
          Lo que hacemos
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-white text-4xl md:text-5xl font-bold"
        >
          Nuestros Servicios
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-4 h-1 w-24 rounded-full"
          style={{ background: "linear-gradient(90deg, #06b6d4, #3b82f6)" }}
        />
      </div>

      {/* Diagonal Cards Strip */}
      <div className="relative flex overflow-x-auto gap-0 pb-4 px-0 scrollbar-none" style={{ scrollbarWidth: "none" }}>
        {SERVICES.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.07 }}
            className="relative flex-shrink-0 cursor-pointer group"
            style={{
              width: "220px",
              height: "380px",
              marginLeft: index === 0 ? "0" : "-28px",
              clipPath: index === 0
                ? "polygon(0 0, 100% 0, calc(100% - 28px) 100%, 0 100%)"
                : index === SERVICES.length - 1
                ? "polygon(28px 0, 100% 0, 100% 100%, 0 100%)"
                : "polygon(28px 0, 100% 0, calc(100% - 28px) 100%, 0 100%)",
              zIndex: index,
            }}
            onClick={() => handleClick(service)}
            whileHover={{ scale: 1.04, zIndex: 20 }}
          >
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${service.image})` }}
            />

            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t ${service.color} transition-opacity duration-300 group-hover:opacity-90`} />

            {/* Bottom-to-top dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Accent line at top */}
            <div
              className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
              style={{ background: service.accent }}
            />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
              {/* Number */}
              <span
                className="block text-xs font-bold tracking-widest mb-2 opacity-60"
                style={{ color: service.accent }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Title */}
              <h3 className="text-white font-bold text-base leading-tight mb-2">
                {service.label}
              </h3>

              {/* Description — visible on hover */}
              <p className="text-white/70 text-xs leading-relaxed max-h-0 overflow-hidden group-hover:max-h-20 transition-all duration-300 ease-out">
                {service.description}
              </p>

              {/* CTA */}
              <div
                className="mt-3 flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ color: service.accent }}
              >
                <span>Consultar</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mobile: horizontal scroll hint */}
      <p className="text-center text-white/30 text-xs mt-4 md:hidden">
        ← Desliza para ver todos los servicios →
      </p>
    </section>
  );
}
