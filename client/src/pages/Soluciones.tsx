import { Link } from "wouter";
import { businessServices } from "@/components/v2/corporateData";
import { useServiceMetadata } from "@/components/v2/ServiceConversionV2";
export default function Soluciones() {
  useServiceMetadata(
    "Servicios y soluciones",
    "IAMET integra infraestructura física, CCTV, control de acceso, energía, RFID, aplicaciones y servicios administrados."
  );
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] px-5 py-20 text-white">
      <div className="mx-auto max-w-[1250px]">
        <p className="text-xs uppercase tracking-widest text-blue-400">
          Qué hacemos
        </p>
        <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
          Servicios y soluciones de tecnología.
        </h1>
        <p className="mt-6 max-w-[800px] leading-8 text-slate-300">
          Integramos las disciplinas que necesita su empresa, desde la
          infraestructura física hasta las aplicaciones y el soporte.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {businessServices.map(s => (
            <article
              key={s.slug}
              className="flex flex-col rounded-2xl border border-blue-300/20 bg-[#10283d] p-7"
            >
              <h2 className="text-xl font-bold">{s.name}</h2>
              <p className="mb-6 mt-4 text-sm leading-7 text-slate-300">
                {s.summary}
              </p>
              <Link
                href={s.href}
                className="mt-auto text-sm font-semibold text-blue-300"
              >
                Conocer la solución →
              </Link>
            </article>
          ))}
        </div>
        <Link
          href="/cotizacion"
          className="mt-10 inline-block rounded-full bg-blue-600 px-6 py-3 font-semibold"
        >
          Cotizar un proyecto
        </Link>
      </div>
    </div>
  );
}
