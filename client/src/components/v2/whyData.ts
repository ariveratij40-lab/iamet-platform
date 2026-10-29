import {
  DraftingCompass,
  Workflow,
  HardHat,
  Headphones,
  Cpu,
  TrendingUp,
} from "lucide-react";

export const whyItems = [
  {
    title: "Ingeniería",
    description:
      "Diseñamos la solución antes de instalarla, considerando operación, integración, crecimiento y mantenimiento.",
    icon: DraftingCompass,
  },
  {
    title: "Integración",
    description:
      "Conectamos distintas disciplinas tecnológicas para que trabajen como parte de una misma solución.",
    icon: Workflow,
  },
  {
    title: "Ejecución",
    description:
      "Llevamos el proyecto desde el diseño y suministro hasta la instalación, configuración y puesta en marcha.",
    icon: HardHat,
  },
  {
    title: "Soporte",
    description:
      "Acompañamos la operación después de la instalación mediante mantenimiento, atención y evolución tecnológica.",
    icon: Headphones,
  },
  {
    title: "Tecnología",
    description:
      "Integramos tecnologías especializadas de acuerdo con los requerimientos técnicos y operativos de cada proyecto.",
    icon: Cpu,
  },
  {
    title: "Evolución",
    description:
      "Diseñamos pensando en crecimiento, nuevas necesidades y la capacidad de adaptar la solución con el tiempo.",
    icon: TrendingUp,
  },
];

const englishContent = [
  {
    title: "Engineering",
    description:
      "We design the solution before installation, considering operation, integration, growth and maintenance.",
  },
  {
    title: "Integration",
    description:
      "We connect different technology disciplines so they work as part of one solution.",
  },
  {
    title: "Execution",
    description:
      "We deliver the project from design and supply through installation, configuration and commissioning.",
  },
  {
    title: "Support",
    description:
      "We support your operation after installation through maintenance, assistance and technology improvements.",
  },
  {
    title: "Technology",
    description:
      "We integrate specialized technologies according to each project’s technical and operational requirements.",
  },
  {
    title: "Evolution",
    description:
      "We design for growth, new needs and the ability to adapt the solution over time.",
  },
] satisfies Array<Pick<(typeof whyItems)[number], "title" | "description">>;

export const whyItemsByLanguage = {
  es: whyItems,
  en: whyItems.map((item, index) => ({ ...item, ...englishContent[index] })),
};
