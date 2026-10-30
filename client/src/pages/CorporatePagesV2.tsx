import { Link, useParams } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  brands,
  businessServices,
  companyIdentity,
} from "@/components/v2/corporateData";
import ServiceHeroV2 from "@/components/v2/ServiceHeroV2";
import ServiceConversionV2, {
  useServiceMetadata,
} from "@/components/v2/ServiceConversionV2";
import LeadForm from "@/components/LeadForm";
import { useState } from "react";

export function CorporateOverviewV2() {
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1344px]">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-400">
          Somos IAMET
        </p>
        <h2 className="mt-4 max-w-[850px] text-3xl font-bold text-white sm:text-4xl">
          Integración y servicios de soluciones en tecnología.
        </h2>
        <p className="mt-5 max-w-[800px] leading-8 text-slate-300">
          Conectamos infraestructura física, seguridad, energía, identificación
          y aplicaciones alrededor de las necesidades de su empresa.
        </p>
        <Link
          href="/nosotros"
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-300"
        >
          Conozca IAMET <ArrowRight size={16} />
        </Link>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businessServices.map(s => (
            <Link
              href={s.href}
              key={s.slug}
              className="rounded-2xl border border-blue-300/15 bg-[#10283d] p-6 transition hover:border-blue-400"
            >
              <h3 className="text-lg font-bold text-white">{s.name}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {s.summary}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm text-blue-300">
                Explorar solución <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
        <h3 className="mt-14 text-2xl font-bold text-white">
          Soluciones con marcas representativas
        </h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {brands.map(b => (
            <Link
              key={b.slug}
              href={`/marcas/${b.slug}`}
              className="rounded-xl border border-blue-300/20 p-5"
            >
              <p className="font-bold text-white">{b.name}</p>
              <p className="mt-3 text-xs leading-6 text-slate-300">
                {b.summary}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/cotizacion"
            className="rounded-full bg-blue-600 px-6 py-3 font-semibold text-white"
          >
            Solicitar cotización
          </Link>
          <Link
            href="/blog"
            className="rounded-full border border-blue-300/30 px-6 py-3 text-white"
          >
            Guías y consejos del blog
          </Link>
        </div>
      </div>
    </section>
  );
}

export function AboutV2() {
  useServiceMetadata(
    "Quiénes somos",
    "IAMET: integración y servicios tecnológicos en Tijuana, Mexicali, Tecate y Ensenada. Conozca nuestra misión, visión y valores."
  );
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] text-white">
      <section className="mx-auto max-w-[1100px] px-5 py-20">
        <p className="text-xs uppercase tracking-widest text-blue-400">
          Quiénes somos
        </p>
        <h1 className="mt-5 text-4xl font-bold sm:text-5xl">
          IAMET, integración tecnológica para su empresa.
        </h1>
        <p className="mt-8 max-w-[800px] text-lg leading-9 text-slate-300">
          Somos una empresa dedicada a la integración y los servicios de
          soluciones en tecnología. Reunimos distintas disciplinas para atender
          los proyectos de infraestructura, seguridad, energía, identificación,
          aplicaciones y continuidad operativa de nuestros clientes.
        </p>
        <section
          className="mt-12 grid gap-6 md:grid-cols-2"
          aria-label="Misión y visión de IAMET"
        >
          <article className="rounded-2xl border border-blue-300/20 bg-[#10283d] p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-400">
              Nuestro propósito
            </p>
            <h2 className="mt-4 text-2xl font-bold">Misión</h2>
            <p className="mt-5 leading-8 text-slate-300">
              {companyIdentity.mission}
            </p>
          </article>
          <article className="rounded-2xl border border-blue-300/20 bg-[#10283d] p-7 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-400">
              Hacia dónde vamos
            </p>
            <h2 className="mt-4 text-2xl font-bold">Visión</h2>
            <p className="mt-5 leading-8 text-slate-300">
              {companyIdentity.vision}
            </p>
          </article>
        </section>
        <section className="mt-12" aria-labelledby="iamet-values">
          <h2 id="iamet-values" className="text-2xl font-bold">
            Nuestros valores
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {companyIdentity.values.map((value, index) => (
              <li
                key={value}
                className="rounded-xl border border-blue-300/20 p-6"
              >
                <span aria-hidden="true" className="text-xs text-blue-400">
                  0{index + 1}
                </span>
                <p className="mt-3 text-lg font-bold">{value}</p>
              </li>
            ))}
          </ul>
        </section>
        <section
          className="mt-12 rounded-2xl border border-blue-300/20 bg-[#10283d] p-7 sm:p-8"
          aria-labelledby="iamet-coverage"
        >
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-400">
            Baja California
          </p>
          <h2 id="iamet-coverage" className="mt-4 text-2xl font-bold">
            Nuestra cobertura
          </h2>
          <p className="mt-5 leading-8 text-slate-300">
            Atendemos proyectos en{" "}
            {companyIdentity.coverage.slice(0, -1).join(", ")} y{" "}
            {companyIdentity.coverage.at(-1)}.
          </p>
          <ul className="mt-6 flex flex-wrap gap-3">
            {companyIdentity.coverage.map(city => (
              <li
                key={city}
                className="rounded-full border border-blue-400/30 px-5 py-2 text-sm text-blue-200"
              >
                {city}
              </li>
            ))}
          </ul>
        </section>
        <h2 className="mt-12 text-2xl font-bold">Nuestra forma de trabajar</h2>
        <p className="mt-5 max-w-[800px] leading-8 text-slate-300">
          Partimos de la necesidad del cliente, definimos el alcance técnico e
          integramos las soluciones. El mantenimiento y el seguimiento se
          acuerdan según las condiciones de cada proyecto o póliza.
        </p>
        <Link
          href="/cotizacion"
          className="mt-8 inline-block rounded-full bg-blue-600 px-6 py-3 font-semibold"
        >
          Cuéntenos su proyecto
        </Link>
      </section>
      <CorporateOverviewV2 />
    </div>
  );
}

export function BrandsV2() {
  useServiceMetadata(
    "Marcas",
    "Soluciones con Panduit, Genetec, Zebra, Avigilon y APC by Schneider Electric."
  );
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] px-5 py-20 text-white">
      <div className="mx-auto max-w-[1200px]">
        <h1 className="text-4xl font-bold">
          Tecnología e integración con IAMET.
        </h1>
        <p className="mt-5 max-w-[750px] leading-8 text-slate-300">
          Explore las soluciones por marca y comparta su requerimiento con
          nuestro equipo.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {brands.map(b => (
            <Link
              href={`/marcas/${b.slug}`}
              key={b.slug}
              className="rounded-2xl border border-blue-300/20 bg-[#10283d] p-8"
            >
              <h2 className="text-2xl font-bold">{b.name}</h2>
              <p className="mt-4 leading-7 text-slate-300">{b.summary}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-blue-300">
                Conocer la solución <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BrandLandingV2() {
  const { slug } = useParams();
  const brand = brands.find(b => b.slug === slug);
  useServiceMetadata(
    brand ? `${brand.name} · Integración IAMET` : "Marca no encontrada",
    brand?.summary ?? ""
  );
  if (!brand)
    return (
      <div className="p-16">
        <h1>Marca no encontrada</h1>
        <Link href="/marcas">Ver marcas</Link>
      </div>
    );
  return (
    <div className="iamet-reference-home bg-[#061524] text-white">
      <ServiceHeroV2
        eyebrow="Soluciones con IAMET"
        brandLabel={brand.name}
        title={brand.title}
        description={brand.summary}
        image={brand.image}
        contactHref="#solicitar"
        contactLabel="Solicitar una propuesta"
        portfolioHref="#alcance"
        portfolioLabel="Conocer el alcance"
        breadcrumbLabel="Ruta de navegación"
        homeLabel="Inicio"
      />
      <ServiceConversionV2
        slug={brand.service}
        name={brand.name}
        capabilities={brand.capabilities}
        context={`Marca de interés: ${brand.name}. Landing: /marcas/${brand.slug}.`}
      />
      <footer className="px-5 py-8 text-center text-sm text-slate-400">
        <p>IAMET · Integración y servicios tecnológicos</p>
        <p className="mt-3">
          <a
            href={brand.source}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Información del fabricante
          </a>{" "}
          ·{" "}
          <Link href="/marcas" className="underline">
            Otras marcas
          </Link>
        </p>
      </footer>
    </div>
  );
}

export function QuoteV2() {
  const params = new URLSearchParams(window.location.search);
  const [service, setService] = useState(params.get("solucion") ?? "");
  const [brand, setBrand] = useState(params.get("marca") ?? "");
  useServiceMetadata(
    "Cotización en línea",
    "Solicite una cotización para su proyecto de integración tecnológica con IAMET."
  );
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] px-5 py-16 text-white">
      <div className="mx-auto max-w-[1100px]">
        <p className="text-xs uppercase tracking-widest text-blue-400">
          Cotización en línea
        </p>
        <h1 className="mt-5 max-w-[800px] text-4xl font-bold">
          Solicite una propuesta para su proyecto.
        </h1>
        <p className="mt-6 max-w-[700px] leading-8 text-slate-300">
          Atendemos Tijuana, Mexicali, Tecate y Ensenada. Indique la solución,
          la marca de interés y lo que necesita resolver. Revisaremos el alcance
          para preparar la propuesta; el envío no genera un precio automático.
        </p>
        <div className="mt-10 grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="quote-service"
                className="mb-3 block font-semibold"
              >
                Solución de interés
              </label>
              <select
                id="quote-service"
                value={service}
                onChange={e => setService(e.target.value)}
                className="w-full rounded-xl border border-blue-300/30 bg-[#10283d] p-4"
              >
                <option value="">Necesito orientación</option>
                {businessServices.map(s => (
                  <option value={s.slug} key={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="quote-brand" className="mb-3 block font-semibold">
                Marca de interés
              </label>
              <select
                id="quote-brand"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="w-full rounded-xl border border-blue-300/30 bg-[#10283d] p-4"
              >
                <option value="">Por definir</option>
                {brands.map(b => (
                  <option value={b.slug} key={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm leading-7 text-slate-400">
              Si tiene planos, cantidades o un alcance técnico, menciónelos en
              su solicitud. El equipo coordinará la información necesaria para
              cotizar.
            </p>
          </div>
          <LeadForm
            submitLabel="Solicitar cotización"
            source="form"
            verticalSlug={service || undefined}
            context={`Solicitud de cotización. Solución: ${businessServices.find(s => s.slug === service)?.name ?? "Por definir"}. Marca: ${brands.find(b => b.slug === brand)?.name ?? "Por definir"}.`}
            compact
          />
        </div>
      </div>
    </div>
  );
}
