import { CorporateOverviewV2 } from "./CorporatePagesV2";
import BrandIntroV2 from "@/components/v2/BrandIntroV2";
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
          <h1 className="sr-only">
            {language === "es"
              ? "IAMET — Integración tecnológica"
              : "IAMET — Technology integration"}
          </h1>
          <InfrastructureMasterBannerV2 />
        </div>
      </section>
      <CorporateOverviewV2 />
      <HowWeWorkV2 />
      <WhyIAMETV2 />
      <CorporateClosingV2 />
      <BrandIntroV2 />
    </div>
  );
}
