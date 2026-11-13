import ComputingHeroV2 from "@/components/v2/ComputingHeroV2";
import { useCallback, useState } from "react";
import { CorporateOverviewV2 } from "./CorporatePagesV2";
import BrandIntroV2 from "@/components/v2/BrandIntroV2";
import TechnologyBackgroundV2 from "@/components/v2/TechnologyBackgroundV2";
import { useLanguage } from "@/contexts/LanguageContext";
import InfrastructureMasterBannerV2 from "@/components/v2/InfrastructureMasterBannerV2";
import CorporateServicesHeroV2 from "@/components/v2/CorporateServicesHeroV2";
import HowWeWorkV2 from "@/components/v2/HowWeWorkV2";
import WhyIAMETV2 from "@/components/v2/WhyIAMETV2";
import CorporateClosingV2 from "@/components/v2/CorporateClosingV2";

export default function HomeV2() {
  const { language } = useLanguage();

  const [introComplete, setIntroComplete] = useState(() => {
    try {
      return Boolean(
        sessionStorage.getItem("iamet-brand-intro-devops-v1")
      );
    } catch {
      return false;
    }
  });

  const [heroComplete, setHeroComplete] = useState(false);
  const [heroReplayKey, setHeroReplayKey] = useState(0);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  const handleHeroComplete = useCallback(() => {
    setHeroComplete(true);
  }, []);

  const handleIntroStart = useCallback(() => {
    setIntroComplete(false);
    setHeroComplete(false);
    setHeroReplayKey(current => current + 1);
  }, []);

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
          <CorporateServicesHeroV2
            key={heroReplayKey}
            active={introComplete}
            onComplete={handleHeroComplete}
          />
          <InfrastructureMasterBannerV2
            externalPaused={!introComplete || !heroComplete}
          />
        </div>
      </section>
      <ComputingHeroV2 />
      <CorporateOverviewV2 />
      <HowWeWorkV2 />
      <WhyIAMETV2 />
      <CorporateClosingV2 />
      <BrandIntroV2
        onComplete={handleIntroComplete}
        onStart={handleIntroStart}
      />
    </div>
  );
}
