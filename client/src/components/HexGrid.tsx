import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, FolderKanban, Zap, Code2,
  Monitor, ShieldCheck, Tv2, Network, ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ServiceNode {
  label: string;
  Icon: LucideIcon;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  description: string;
  query: string;
}

// ─── Datos de servicios ───────────────────────────────────────────────────────
const SERVICES: ServiceNode[] = [
  {
    label: "Pólizas de Mantenimiento",
    Icon: Wrench,
    color: "#7C3AED",
    gradientFrom: "#7C3AED",
    gradientTo: "#5B21B6",
    description: "Contratos preventivos y correctivos para toda tu infraestructura tecnológica con SLA definidos y soporte 24/7.",
    query: "Quiero información sobre pólizas de mantenimiento para mi infraestructura tecnológica",
  },
  {
    label: "Proyectos Ejecutivos",
    Icon: FolderKanban,
    color: "#0EA5E9",
    gradientFrom: "#0EA5E9",
    gradientTo: "#0284C7",
    description: "Diseño, gestión e implementación de proyectos tecnológicos llave en mano con documentación técnica completa.",
    query: "Necesito asesoría para un proyecto ejecutivo de tecnología en mi empresa",
  },
  {
    label: "Soluciones de Energía",
    Icon: Zap,
    color: "#F59E0B",
    gradientFrom: "#F59E0B",
    gradientTo: "#D97706",
    description: "UPS, plantas de emergencia, PDUs inteligentes y sistemas de energía ininterrumpida para equipos críticos.",
    query: "¿Qué soluciones de energía y UPS ofrecen para proteger equipos críticos?",
  },
  {
    label: "Desarrollo de Software",
    Icon: Code2,
    color: "#EF4444",
    gradientFrom: "#EF4444",
    gradientTo: "#DC2626",
    description: "Aplicaciones web, móviles y sistemas a medida con IA, automatización de procesos y APIs.",
    query: "Me interesa desarrollar software a medida o una aplicación para mi empresa",
  },
  {
    label: "Computadoras y Tecnología",
    Icon: Monitor,
    color: "#3B82F6",
    gradientFrom: "#3B82F6",
    gradientTo: "#2563EB",
    description: "Suministro, configuración y soporte de equipos de cómputo, servidores, periféricos y licencias.",
    query: "Necesito equipos de cómputo, servidores o tecnología para mi empresa",
  },
  {
    label: "Seguridad",
    Icon: ShieldCheck,
    color: "#10B981",
    gradientFrom: "#10B981",
    gradientTo: "#059669",
    description: "Sistemas de CCTV, control de acceso, voceo y detección de intrusos con tecnología IP de última generación.",
    query: "¿Cómo puedo mejorar la seguridad electrónica de mis instalaciones con CCTV y control de acceso?",
  },
  {
    label: "Audio y Video",
    Icon: Tv2,
    color: "#06B6D4",
    gradientFrom: "#06B6D4",
    gradientTo: "#0891B2",
    description: "Salas de videoconferencia, señalización digital y sistemas de sonido profesional.",
    query: "Quiero implementar soluciones de audio y video profesional o una sala de videoconferencia",
  },
  {
    label: "Cableado y Data Center",
    Icon: Network,
    color: "#22C55E",
    gradientFrom: "#22C55E",
    gradientTo: "#16A34A",
    description: "Infraestructura de red certificada Cat6A/Fibra Óptica con garantía Panduit de hasta 25 años.",
    query: "Necesito cableado estructurado certificado Cat6A o diseño de Data Center con estándares TIA-942",
  },
];

// ─── Geometría hexagonal ──────────────────────────────────────────────────────
// Hexágono flat-top: vértices a 0°, 60°, 120°, 180°, 240°, 300°
function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i); // flat-top
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(" ");
}

// ─── Layout: panal de abeja (honeycomb) ───────────────────────────────────────
// Fila 0: 3 hexágonos  (índices 0,1,2)
// Fila 1: 2 hexágonos  (índices 3,4)  — con offset horizontal
// Fila 2: 3 hexágonos  (índices 5,6,7)
// Centro: badge "NUESTROS SERVICIOS" + nodo Tienda

const HEX_R = 58;          // radio del hexágono
const HEX_GAP = 6;         // espacio entre hexágonos
const HW = HEX_R * 2;      // ancho total del hexágono (flat-top)
const HH = HEX_R * Math.sqrt(3); // alto del hexágono (flat-top)
const COL_STEP = HW + HEX_GAP;   // paso horizontal entre centros
const ROW_STEP = (HH + HEX_GAP) * 0.87; // paso vertical (ajustado para encaje)

// Posiciones de los 8 servicios en el panal
// Usamos un layout 3-2-3 con offset de media celda en filas impares
const POSITIONS: [number, number][] = [
  // Fila 0 (y=0): 3 nodos
  [-COL_STEP, 0],
  [0, 0],
  [COL_STEP, 0],
  // Fila 1 (y=ROW_STEP): 2 nodos con offset +0.5
  [-COL_STEP * 0.5, ROW_STEP],
  [COL_STEP * 0.5, ROW_STEP],
  // Fila 2 (y=ROW_STEP*2): 3 nodos
  [-COL_STEP, ROW_STEP * 2],
  [0, ROW_STEP * 2],
  [COL_STEP, ROW_STEP * 2],
];

// Centro del badge: entre fila 1 y fila 2
const BADGE_CX = 0;
const BADGE_CY = ROW_STEP * 1.0;

// ViewBox dimensions
const PADDING = 80;
const VB_X_MIN = -COL_STEP - HEX_R - PADDING;
const VB_Y_MIN = -HEX_R - PADDING;
const VB_W = (COL_STEP * 2 + HEX_R * 2) + PADDING * 2;
const VB_H = ROW_STEP * 2 + HEX_R * 2 + PADDING * 2;

// ─── Componente principal ─────────────────────────────────────────────────────
interface HexGridProps {
  onServiceClick: (query: string) => void;
}

export default function HexGrid({ onServiceClick }: HexGridProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const hoveredService = hovered !== null ? SERVICES[hovered] : null;

  return (
    <div className="w-full select-none relative" style={{ maxWidth: 680 }}>
      <svg
        viewBox={`${VB_X_MIN} ${VB_Y_MIN} ${VB_W} ${VB_H}`}
        width="100%"
        style={{ overflow: "visible", display: "block" }}
        aria-label="Nuestros servicios"
      >
        <defs>
          {/* Gradientes por servicio */}
          {SERVICES.map((svc, i) => (
            <linearGradient key={i} id={`hex-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={svc.gradientFrom} stopOpacity="0.95" />
              <stop offset="100%" stopColor={svc.gradientTo} stopOpacity="0.85" />
            </linearGradient>
          ))}
          {/* Gradiente para el nodo Tienda */}
          <linearGradient id="hex-grad-store" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0891B2" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0E7490" stopOpacity="0.8" />
          </linearGradient>
          {/* Sombra suave */}
          <filter id="hex-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.25)" />
          </filter>
          <filter id="hex-shadow-hover" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="rgba(0,0,0,0.4)" />
          </filter>
          {/* Brillo superior (highlight isométrico) */}
          <linearGradient id="hex-highlight" x1="0%" y1="0%" x2="0%" y2="60%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* ── Badge central "NUESTROS SERVICIOS" ── */}
        <motion.g
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: `${BADGE_CX}px ${BADGE_CY}px` }}
        >
          {/* Fondo del ribbon */}
          <rect
            x={BADGE_CX - 100} y={BADGE_CY - 20}
            width={200} height={40}
            rx={20}
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth={1.5}
          />
          {/* Sombra del ribbon */}
          <rect
            x={BADGE_CX - 96} y={BADGE_CY + 18}
            width={192} height={6}
            rx={3}
            fill="rgba(0,0,0,0.18)"
          />
          {/* Texto */}
          <text
            x={BADGE_CX} y={BADGE_CY + 5}
            textAnchor="middle"
            fontSize={10}
            fontWeight={400}
            letterSpacing={2.8}
            fill="rgba(255,255,255,0.85)"
            style={{ fontFamily: "inherit", textTransform: "uppercase" }}
          >
            NUESTROS SERVICIOS
          </text>
        </motion.g>

        {/* ── Nodo central Tienda ── */}
        <motion.g
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: `${BADGE_CX}px ${BADGE_CY + 58}px`, cursor: "pointer" }}
          onClick={() => navigate("/tienda")}
          onMouseEnter={() => setHovered(-1)}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Hexágono pequeño para Tienda */}
          <polygon
            points={hexPoints(BADGE_CX, BADGE_CY + 58, 28)}
            fill="url(#hex-grad-store)"
            filter={hovered === -1 ? "url(#hex-shadow-hover)" : "url(#hex-shadow)"}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1.2}
          />
          {/* Highlight isométrico */}
          <polygon
            points={hexPoints(BADGE_CX, BADGE_CY + 58, 28)}
            fill="url(#hex-highlight)"
            style={{ pointerEvents: "none" }}
          />
          {/* Ícono carrito */}
          <g transform={`translate(${BADGE_CX - 9}, ${BADGE_CY + 58 - 9})`}>
            <path d="M1 1h2.5l1.5 7h7.5l1.5-5H4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="7" cy="15.5" r="1" fill="white" />
            <circle cx="13" cy="15.5" r="1" fill="white" />
          </g>
          {/* Etiqueta */}
          <text
            x={BADGE_CX} y={BADGE_CY + 58 + 40}
            textAnchor="middle"
            fontSize={9}
            fontWeight={500}
            fill="rgba(255,255,255,0.7)"
            style={{ fontFamily: "inherit" }}
          >
            Tienda
          </text>
        </motion.g>

        {/* ── Hexágonos de servicios ── */}
        {SERVICES.map((svc, i) => {
          const [px, py] = POSITIONS[i];
          const isHov = hovered === i;
          const SvcIcon = svc.Icon;
          const delay = 0.08 + i * 0.06;

          return (
            <motion.g
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: `${px}px ${py}px`, cursor: "pointer" }}
              onClick={() => onServiceClick(svc.query)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Sombra exterior (pseudo-3D) */}
              <polygon
                points={hexPoints(px + 3, py + 5, HEX_R - 2)}
                fill="rgba(0,0,0,0.28)"
                style={{ pointerEvents: "none" }}
              />
              {/* Cara lateral izquierda (efecto isométrico) */}
              <polygon
                points={hexPoints(px, py, HEX_R)}
                fill={svc.gradientTo}
                opacity={0.45}
                transform={`translate(3, 5)`}
                style={{ pointerEvents: "none" }}
              />
              {/* Hexágono principal */}
              <motion.polygon
                points={hexPoints(px, py, HEX_R)}
                fill={`url(#hex-grad-${i})`}
                filter={isHov ? "url(#hex-shadow-hover)" : "url(#hex-shadow)"}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1.5}
                animate={{ scale: isHov ? 1.07 : 1 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformOrigin: `${px}px ${py}px` }}
              />
              {/* Highlight isométrico (brillo superior) */}
              <polygon
                points={hexPoints(px, py, HEX_R)}
                fill="url(#hex-highlight)"
                style={{ pointerEvents: "none" }}
              />
              {/* Borde de brillo superior */}
              <polygon
                points={hexPoints(px, py, HEX_R)}
                fill="none"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth={1}
                strokeDasharray="4 3"
                opacity={isHov ? 0.8 : 0.3}
                style={{ pointerEvents: "none" }}
              />
              {/* Ícono centrado */}
              <foreignObject
                x={px - 18}
                y={py - 22}
                width={36}
                height={36}
                style={{ pointerEvents: "none", overflow: "visible" }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <SvcIcon size={22} color="white" strokeWidth={1.8} />
                </div>
              </foreignObject>
              {/* Etiqueta debajo del hexágono */}
              <text
                x={px}
                y={py + HEX_R + 18}
                textAnchor="middle"
                fontSize={isHov ? 9.5 : 9}
                fontWeight={isHov ? 600 : 500}
                fill={isHov ? "white" : "rgba(255,255,255,0.72)"}
                style={{ fontFamily: "inherit", transition: "all 0.18s" }}
              >
                {svc.label.length > 18 ? svc.label.slice(0, 17) + "…" : svc.label}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* ── Tooltip flotante ── */}
      <AnimatePresence>
        {hoveredService && hovered !== -1 && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-1/2 -translate-x-1/2 bottom-0 mb-2 z-20 pointer-events-none"
            style={{ maxWidth: 280 }}
          >
            <div
              className="rounded-2xl px-4 py-3 text-center shadow-2xl"
              style={{
                background: "rgba(15,22,35,0.92)",
                border: `1px solid ${hoveredService.color}55`,
                backdropFilter: "blur(12px)",
              }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: hoveredService.color }}>
                {hoveredService.label}
              </p>
              <p className="text-xs text-white/70 leading-relaxed">
                {hoveredService.description}
              </p>
              <p className="text-xs mt-2 font-medium" style={{ color: hoveredService.color }}>
                Haz clic para consultar →
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
