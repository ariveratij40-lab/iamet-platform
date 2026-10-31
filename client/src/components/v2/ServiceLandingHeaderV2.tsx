import { UserRound } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import IametTechLogoV2 from "./IametTechLogoV2";

export default function ServiceLandingHeaderV2() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1725] text-white">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-2 px-3 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label={es ? "IAMET · Inicio" : "IAMET · Home"}
          className="w-[105px] shrink-0 sm:w-[190px]"
        >
          <IametTechLogoV2 className="!text-white" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/acceso"
            aria-label={es ? "Mi cuenta" : "My account"}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-white/20 px-3 text-sm"
          >
            <UserRound size={18} />
            <span className="hidden lg:inline">
              {es ? "Mi cuenta" : "My account"}
            </span>
          </Link>
          <a
            href="#solicitar"
            className="rounded-full bg-blue-600 px-5 py-3 text-xs font-semibold transition hover:bg-blue-500 sm:px-7 sm:text-sm"
          >
            <span className="hidden sm:inline">
              {es ? "Hablar con un especialista" : "Talk to a specialist"}
            </span>
            <span className="sm:hidden">{es ? "Asesoría" : "Contact"}</span>
            <span aria-hidden="true" className="ml-2">
              →
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
