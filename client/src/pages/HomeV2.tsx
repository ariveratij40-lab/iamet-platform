import TechnologyBackgroundV2 from "@/components/v2/TechnologyBackgroundV2";
import { useLanguage } from "@/contexts/LanguageContext";
import InfrastructureMasterBannerV2 from "@/components/v2/InfrastructureMasterBannerV2";
import HowWeWorkV2 from "@/components/v2/HowWeWorkV2";
import WhyIAMETV2 from "@/components/v2/WhyIAMETV2";
import CorporateClosingV2 from "@/components/v2/CorporateClosingV2";

export default function HomeV2() {
  const { language } = useLanguage();
  return (
    <div className="iamet-reference-home relative isolate">
      <TechnologyBackgroundV2 />
      <section id="soluciones-iamet" className="relative">
        <div>
          <div className="pointer-events-none absolute inset-x-0 top-5 z-20 mx-auto flex max-w-[1600px] items-center gap-3 px-5 sm:top-6 sm:px-8 lg:px-12">
            <h1 className="text-xs font-bold uppercase leading-6 tracking-[0.18em] text-blue-600">
              {language === "es"
                ? "EMPRESA INTEGRADORA DE SOLUCIONES Y SERVICIOS TECNOLÓGICOS"
                : "TECHNOLOGY SOLUTIONS AND SERVICES INTEGRATOR"}
            </h1>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <InfrastructureMasterBannerV2 />
        </div>
      </section>
      <HowWeWorkV2 />
      <WhyIAMETV2 />
      <CorporateClosingV2 />
    </div>
  );
}
