import { useState } from "react";
import {
  Cable,
  Fingerprint,
  RadioTower,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

type FabricNode = {
  id: string;
  label: string;
  title: string;
  detail: string;
  icon: typeof Cable;
  x: string;
  y: string;
};

const nodes: FabricNode[] = [
  {
    id: "infra",
    label: "INFRA",
    title: "¿Está construyendo o modernizando?",
    detail: "Podemos orientarle en infraestructura, conectividad y preparación tecnológica.",
    icon: Cable,
    x: "4%",
    y: "30%",
  },
  {
    id: "cctv",
    label: "CCTV",
    title: "¿Necesita saber qué ocurre en sus instalaciones?",
    detail: "Podemos orientarle en videoseguridad, analítica y monitoreo.",
    icon: ShieldCheck,
    x: "69%",
    y: "5%",
  },
  {
    id: "access",
    label: "ACCESO",
    title: "¿Necesita controlar quién entra?",
    detail: "Podemos orientarle en accesos, credenciales, biometría y visitantes.",
    icon: Fingerprint,
    x: "73%",
    y: "57%",
  },
  {
    id: "rfid",
    label: "RFID",
    title: "¿Necesita localizar activos o inventarios?",
    detail: "Podemos orientarle en identificación, RFID y trazabilidad.",
    icon: RadioTower,
    x: "8%",
    y: "70%",
  },
];

export default function TechnologyFabricV2() {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeNode =
    nodes.find(node => node.id === activeId) ?? null;

  return (
    <div className="relative min-h-[470px] w-full sm:min-h-[520px] lg:min-h-[650px]">
      {/* Ambient field */}
      <div
        className="pointer-events-none absolute inset-[-12%]"
        style={{
          background:
            "radial-gradient(circle at 52% 48%, rgba(37,99,235,.16), rgba(59,130,246,.06) 28%, transparent 58%)",
        }}
      />

      <div className="iamet-v2-grid pointer-events-none absolute inset-[3%] rounded-[44px] opacity-55 [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)]" />

      {/* Section identity */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15 }}
        className="absolute left-[4%] top-[1%] z-30 sm:left-[8%] sm:top-[3%]"
      >
        <p className="iamet-v2-electric text-[11px] font-bold uppercase tracking-[0.2em]">
          Ecosistema tecnológico IAMET
        </p>
        <p className="mt-1.5 max-w-[250px] text-xs leading-5 text-slate-500 sm:mt-2 sm:max-w-[290px] sm:text-sm sm:leading-6">
          Soluciones conectadas para una operación inteligente
        </p>
      </motion.div>

      {/* Connections */}
      <svg
        className="pointer-events-none absolute inset-[4%] h-[92%] w-[92%]"
        viewBox="0 0 620 520"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fabricConnection" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(18,100,216,.08)" />
            <stop offset="48%" stopColor="rgba(18,100,216,.44)" />
            <stop offset="100%" stopColor="rgba(18,100,216,.08)" />
          </linearGradient>

          <filter id="fabricGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          fill="none"
          stroke="url(#fabricConnection)"
          strokeWidth="1.5"
          strokeDasharray="6 8"
        >
          <motion.path
            d="M105 210 C205 205 250 240 310 260"
            animate={{
              opacity:
                activeId === null || activeId === "infra"
                  ? 1
                  : 0.22,
            }}
          />
          <motion.path
            d="M505 115 C430 135 370 205 325 255"
            animate={{
              opacity:
                activeId === null || activeId === "cctv"
                  ? 1
                  : 0.22,
            }}
          />
          <motion.path
            d="M520 355 C430 345 370 300 325 270"
            animate={{
              opacity:
                activeId === null || activeId === "access"
                  ? 1
                  : 0.22,
            }}
          />
          <motion.path
            d="M125 405 C215 365 260 310 310 270"
            animate={{
              opacity:
                activeId === null || activeId === "rfid"
                  ? 1
                  : 0.22,
            }}
          />
        </g>

        {!reduceMotion && (
          <g fill="#1264d8" filter="url(#fabricGlow)">
            <motion.circle
              r="3.5"
              animate={{
                cx: [105, 205, 310],
                cy: [210, 215, 260],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3.4,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.circle
              r="3.5"
              animate={{
                cx: [505, 430, 325],
                cy: [115, 150, 255],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3.8,
                repeat: Infinity,
                delay: 0.7,
                ease: "linear",
              }}
            />
            <motion.circle
              r="3.5"
              animate={{
                cx: [520, 430, 325],
                cy: [355, 340, 270],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                delay: 1.35,
                ease: "linear",
              }}
            />
            <motion.circle
              r="3.5"
              animate={{
                cx: [125, 215, 310],
                cy: [405, 365, 270],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: 2,
                ease: "linear",
              }}
            />
          </g>
        )}
      </svg>

      {/* ARIA ambient rings */}
      <motion.div
        className="pointer-events-none absolute left-[51%] top-[51%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 sm:h-44 sm:w-44 lg:h-48 lg:w-48 sm:h-56 sm:w-56 lg:h-64 lg:w-64 rounded-full border border-blue-200/40"
        animate={
          reduceMotion
            ? undefined
            : { scale: [0.94, 1.06, 0.94], opacity: [0.35, 0.7, 0.35] }
        }
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute left-[51%] top-[51%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/40"
        animate={
          reduceMotion
            ? undefined
            : { scale: [1.05, 0.96, 1.05], opacity: [0.55, 0.25, 0.55] }
        }
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* ARIA core */}
      <motion.div
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -4, 0], scale: activeId ? 1.035 : 1 }
        }
        transition={{
          y: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 0.22 },
        }}
        className="iamet-v2-glass absolute left-[51%] top-[51%] z-30 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col sm:h-32 sm:w-32 lg:h-40 lg:w-40 items-center justify-center rounded-full"
      >
        <div className="iamet-v2-electric-glow flex h-11 w-11 items-center justify-center rounded-xl sm:h-12 sm:w-12 lg:h-16 lg:w-16 lg:rounded-2xl bg-blue-600 text-white">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
        </div>

        <span className="mt-3 text-xs font-bold tracking-[0.14em] text-slate-900">
          SU OPERACIÓN
        </span>

        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Tecnología integrada
        </span>
      </motion.div>

      {/* Main nodes */}
      {nodes.map((node, index) => {
        const Icon = node.icon;
        const active = activeId === node.id;

        return (
          <motion.button
            key={node.id}
            type="button"
            aria-label={`${node.title}: ${node.detail}`}
            onMouseEnter={() => setActiveId(node.id)}
            onMouseLeave={() => setActiveId(null)}
            onFocus={() => setActiveId(node.id)}
            onBlur={() => setActiveId(null)}
            className="iamet-v2-node absolute z-40 flex h-[72px] w-[72px] flex-col items-center justify-center rounded-xl sm:h-20 sm:w-20 lg:h-24 lg:w-24 lg:rounded-2xl outline-none"
            style={{
              left: node.x,
              top: node.y,
            }}
            animate={
              reduceMotion
                ? { scale: active ? 1.06 : 1 }
                : {
                    y: active ? -10 : [0, -5 - index, 0],
                    scale: active ? 1.07 : 1,
                  }
            }
            transition={
              active
                ? { duration: 0.22 }
                : {
                    duration: 4 + index * 0.45,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            <Icon className="iamet-v2-electric h-5 w-5 lg:h-6 lg:w-6" />
            <span className="mt-1.5 text-[9px] font-bold lg:mt-2 lg:text-[10px] tracking-[0.14em] text-slate-500">
              {node.label}
            </span>
          </motion.button>
        );
      })}

      {/* Ambient data points */}
      {[18, 31, 64, 82].map((left, index) => (
        <motion.span
          key={left}
          className="absolute z-10 h-1.5 w-1.5 rounded-full bg-blue-400/40"
          style={{
            left: `${left}%`,
            top: `${22 + index * 14}%`,
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.2, 0.75, 0.2],
                  scale: [0.8, 1.4, 0.8],
                }
          }
          transition={{
            duration: 3 + index * 0.55,
            repeat: Infinity,
            delay: index * 0.4,
          }}
        />
      ))}
    </div>
  );
}
