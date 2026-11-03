import { useLanguage } from "@/contexts/LanguageContext";

type IametOfficialLogoV2Props = {
  className?: string;
  showTagline?: boolean;
  taglineClassName?: string;
};

export default function IametOfficialLogoV2({
  className = "",
  showTagline = true,
  taglineClassName = "",
}: IametOfficialLogoV2Props) {
  const { language } = useLanguage();
  const es = language === "es";

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <img
        src="/brand/iamet-oscuro-sin-lema.svg"
        alt="IAMET"
        className="block h-auto w-full object-contain"
      />
      {showTagline && (
        <span
          className={`-mt-[9px] block text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[#DCE8FF] ${taglineClassName}`}
        >
          {es ? "Integración tecnológica" : "Technology integration"}
        </span>
      )}
    </span>
  );
}
