import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import IametTechLogoV2 from "./IametTechLogoV2";

export default function ServiceLandingHeaderV2() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1725] text-white">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label={es ? "IAMET · Inicio" : "IAMET · Home"}
          className="w-[150px] shrink-0 sm:w-[190px]"
        >
          <IametTechLogoV2 />
        </Link>
        <a
          href="#solicitar"
          className="rounded-full bg-blue-600 px-5 py-3 text-xs font-semibold transition hover:bg-blue-500 sm:px-7 sm:text-sm"
        >
          {es ? "Hablar con un especialista" : "Talk to a specialist"}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </a>
      </div>
    </header>
  );
}
