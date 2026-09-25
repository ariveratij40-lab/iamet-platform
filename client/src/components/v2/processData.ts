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
