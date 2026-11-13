import ComputingHeroV2 from "@/components/v2/ComputingHeroV2";
import { Link } from "wouter";
import { solutions, solutionDestinations } from "@/components/v2/solutionsData";
import { useLanguage } from "@/contexts/LanguageContext";
import ServiceHeroV2 from "@/components/v2/ServiceHeroV2";
import ServiceConversionV2, {
  useServiceMetadata,
} from "@/components/v2/ServiceConversionV2";

export default function ServiceLandingV2({ serviceId }: { serviceId: string }) {
  const { language } = useLanguage();
  const es = language === "es";
  // The matched Route supplies a stable ID. During history navigation, the
  // global location can update before this outgoing page has unmounted.
  const service = solutions.find(item => item.id === serviceId);
  const name = service ? (es ? service.es : service.en) : (es ? "Solución no encontrada" : "Solution not found");
  const description = service ? (es ? service.descEs : service.descEn) : "";
  useServiceMetadata(name, description);
  if (!service) {
    return <section className="min-h-64 bg-[#051321] px-6 py-16 text-white">
      <h1 className="text-3xl font-bold">{name}</h1>
      <Link href="/soluciones" className="mt-6 inline-block text-blue-300 underline">
        {es ? "Ver todas las soluciones" : "View all solutions"}
      </Link>
    </section>;
  }
  const path = solutionDestinations[service.id];
  return (
    <div className="iamet-reference-home bg-[#051321] text-white">
      {service.id === "computo-licenciamiento" ? <ComputingHeroV2 landing /> : <ServiceHeroV2
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
      />}
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
