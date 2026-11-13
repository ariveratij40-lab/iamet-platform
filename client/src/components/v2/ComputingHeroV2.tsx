import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, Monitor, Pause, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const offerings = [
  { brand: "Dell", es: "Potencia para cada puesto de trabajo", en: "Performance for every workspace", detailEs: "Laptops · Escritorio · Workstations", detailEn: "Laptops · Desktops · Workstations" },
  { brand: "Autodesk", es: "Herramientas para diseñar y construir", en: "Tools to design and build", detailEs: "AutoCAD · Revit", detailEn: "AutoCAD · Revit" },
  { brand: "Microsoft", es: "Productividad para todo su equipo", en: "Productivity for your whole team", detailEs: "Microsoft 365 · Windows", detailEn: "Microsoft 365 · Windows" },
];

export default function ComputingHeroV2({ landing = false }: { landing?: boolean }) {
  const { language } = useLanguage();
  const es = language === "es";
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const offering = offerings[selected];
  const Heading = landing ? "h1" : "h2";
  const contact = landing ? "#solicitar" : "/soluciones/computo-licenciamiento#solicitar";
  return (
    <section className="computing-hero relative isolate overflow-hidden border-y border-cyan-300/15 bg-[#041323] text-white" data-paused={paused} aria-label={es ? "Cómputo y Licenciamiento" : "Computing and Licensing"}>
      <div aria-hidden="true" className="computing-orb pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
      <div className="relative mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
        <div className="mb-10 flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.22em] text-cyan-300 sm:text-xs"><Monitor size={16} aria-hidden="true" /> IAMET · {es ? "Cómputo y Licenciamiento" : "Computing & Licensing"}</p>
          <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={es ? (paused ? "Reanudar efectos" : "Pausar efectos") : (paused ? "Resume effects" : "Pause effects")} className="rounded-full border border-white/20 p-3 text-white/80 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-300 motion-reduce:hidden">{paused ? <Play size={16} /> : <Pause size={16} />}</button>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-12">
          <div className="computing-enter relative z-10">
            <Heading className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl xl:text-6xl">{es ? "Impulse su empresa con " : "Power your business with "}<span className="bg-gradient-to-r from-cyan-200 via-blue-400 to-cyan-200 bg-clip-text text-transparent">{es ? "el equipo correcto." : "the right technology."}</span></Heading>
            <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">{es ? "Equipos Dell y licencias Autodesk y Microsoft. Integramos hardware y software de acuerdo con su operación, sus usuarios y su presupuesto." : "Dell hardware and Autodesk and Microsoft licenses. We match hardware and software to your operation, users and budget."}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href={contact} className="group inline-flex items-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-1 hover:bg-blue-500 hover:shadow-blue-500/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 motion-reduce:transform-none">{es ? "Cotizar equipos y licencias" : "Request hardware & licenses"}<ArrowRight size={18} className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none" /></a>
              {landing ? <a href="#alcance" className="rounded-xl border border-white/20 px-6 py-4 text-sm transition hover:bg-white/10">{es ? "Ver soluciones" : "Explore solutions"}</a> : <Link href="/soluciones/computo-licenciamiento" className="rounded-xl border border-white/20 px-6 py-4 text-sm transition hover:bg-white/10">{es ? "Conocer el servicio" : "Explore the service"}</Link>}
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-slate-400"><Check size={15} className="text-cyan-400" />{es ? "Selección · Configuración · Renovación" : "Selection · Configuration · Renewal"}</p>
          </div>
          <div className="computing-enter min-w-0 [animation-delay:120ms]">
            <div className="group relative overflow-hidden rounded-2xl border border-white/15 bg-[#10283d] shadow-2xl shadow-black/40">
              <img src="/images/solutions/computo-licenciamiento.png" alt={es ? "Equipos Dell con aplicaciones Microsoft y Autodesk en un entorno de oficina" : "Dell computers with Microsoft and Autodesk applications in an office"} width={1672} height={941} loading={landing ? "eager" : "lazy"} decoding="async" className="computing-photo aspect-video w-full object-cover" />
              <div aria-hidden="true" className="computing-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label={es ? "Explorar por marca" : "Explore brands"}>
              {offerings.map((item, index) => <button key={item.brand} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`rounded-xl border px-3 py-4 text-left transition duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 motion-reduce:transform-none ${selected === index ? "border-cyan-300/70 bg-cyan-300/10 shadow-lg shadow-cyan-500/10" : "border-white/10 bg-white/5 hover:border-white/30"}`}><span className="block text-sm font-bold sm:text-lg">{item.brand}</span><span className="mt-1 block text-[10px] leading-5 text-slate-300 sm:text-xs">{es ? item.detailEs : item.detailEn}</span></button>)}
            </div>
            <div className="mt-4 min-h-14 border-l-2 border-cyan-400 pl-4" aria-live="polite" aria-atomic="true"><p className="text-xs font-semibold text-cyan-300">{offering.brand}</p><p className="mt-1 text-sm text-slate-200">{es ? offering.es : offering.en}</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
