import { useLocation } from "wouter";
import { solutions, solutionDestinations } from "@/components/v2/solutionsData";
import { useLanguage } from "@/contexts/LanguageContext";
import ServiceHeroV2 from "@/components/v2/ServiceHeroV2";
import ServiceConversionV2, {
  useServiceMetadata,
} from "@/components/v2/ServiceConversionV2";

export default function ServiceLandingV2() {
  const [path] = useLocation();
  const { language } = useLanguage();
  const es = language === "es";
  const service = solutions.find(
    item => solutionDestinations[item.id] === path
  )!;
  const name = es ? service.es : service.en;
  const description = es ? service.descEs : service.descEn;
  useServiceMetadata(name, description);
  return (
    <div className="iamet-reference-home bg-[#051321] text-white">
      <ServiceHeroV2
        eyebrow={name}
        title={es ? service.titleEs : service.titleEn}
        description={description}
        image={service.image}
        contactHref="#solicitar"
        contactLabel={es ? "Solicitar una propuesta" : "Request a proposal"}
        portfolioHref="#alcance"
        portfolioLabel={es ? "Conocer la solución" : "Explore the solution"}
        breadcrumbLabel={es ? "Ruta de navegación" : "Breadcrumb"}
        homeLabel={es ? "Inicio" : "Home"}
      />
      <ServiceConversionV2
        slug={path.split("/").pop()!}
        name={name}
        capabilities={es ? service.capabilitiesEs : service.capabilitiesEn}
      />
      <footer className="px-5 py-8 text-center text-xs text-slate-400">
        IAMET · {es ? "Integración tecnológica" : "Technology integration"} ·
        contacto@iamet.mx
      </footer>
    </div>
  );
}
