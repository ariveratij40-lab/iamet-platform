import HeroV2 from "@/components/v2/HeroV2";
import NeedsCarouselV2 from "@/components/v2/NeedsCarouselV2";
import InfrastructureMasterBannerV2 from "@/components/v2/InfrastructureMasterBannerV2";
import HowWeWorkV2 from "@/components/v2/HowWeWorkV2";
import WhyIAMETV2 from "@/components/v2/WhyIAMETV2";
import CorporateClosingV2 from "@/components/v2/CorporateClosingV2";

export default function HomeV2() {
  return (
    <>
      <HeroV2 />
      <NeedsCarouselV2 />
      <section
        id="soluciones-iamet"
        className="bg-white px-5 py-12 sm:py-16 lg:px-8 lg:py-20"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Soluciones IAMET
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <InfrastructureMasterBannerV2 />
        </div>
      </section>
      <HowWeWorkV2 />
      <WhyIAMETV2 />
      <CorporateClosingV2 />
    </>
  );
}
