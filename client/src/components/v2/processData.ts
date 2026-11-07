import {
  ClipboardList,
  DraftingCompass,
  PackageCheck,
  HardHat,
  CircleCheckBig,
  Headphones,
} from "lucide-react";

export const processSteps = [
  {
    number: "01",
    title: "Entendemos su necesidad",
    description:
      "Conocemos el proyecto, la operación actual, los objetivos y las restricciones antes de proponer tecnología.",
    icon: ClipboardList,
  },
  {
    number: "02",
    title: "Diseñamos la solución",
    description:
      "Definimos arquitectura, alcance, equipos, integración y criterios técnicos de la solución.",
    icon: DraftingCompass,
  },
  {
    number: "03",
    title: "Suministramos la tecnología",
    description:
      "Integramos los equipos, materiales, licencias y componentes necesarios para ejecutar el proyecto.",
    icon: PackageCheck,
  },
  {
    number: "04",
    title: "Instalamos e integramos",
    description:
      "Ejecutamos la instalación y conectamos los distintos sistemas para que funcionen como una solución integral.",
    icon: HardHat,
  },
  {
    number: "05",
    title: "Ponemos en marcha",
    description:
      "Configuramos, verificamos y entregamos la solución preparada para entrar en operación.",
    icon: CircleCheckBig,
  },
  {
    number: "06",
    title: "Mantenemos y soportamos",
    description:
      "Acompañamos la operación con mantenimiento, soporte y evolución de la solución conforme cambian sus necesidades.",
    icon: Headphones,
  },
];

const englishContent = [
  {
    title: "We understand your needs",
    description:
      "We learn about your project, current operation, goals and constraints before proposing technology.",
  },
  {
    title: "We design the solution",
    description:
      "We define the architecture, scope, equipment, integration and technical criteria for the solution.",
  },
  {
    title: "We supply the technology",
    description:
      "We bring together the equipment, materials, licenses and components needed to deliver the project.",
  },
  {
    title: "We install and integrate",
    description:
      "We install and connect the different systems so they work as one integrated solution.",
  },
  {
    title: "We commission the solution",
    description:
      "We configure, verify and deliver the solution ready for operation.",
  },
  {
    title: "We maintain and support",
    description:
      "We support your operation with maintenance, assistance and improvements as your needs change.",
  },
] satisfies Array<Pick<(typeof processSteps)[number], "title" | "description">>;

export const processStepsByLanguage = {
  es: processSteps,
  en: processSteps.map((item, index) => ({
    ...item,
    ...englishContent[index],
  })),
};
