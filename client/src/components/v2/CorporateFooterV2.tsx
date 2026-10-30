import { Link } from "wouter";
export default function CorporateFooterV2() {
  return (
    <footer className="border-t border-white/10 bg-[#06111e] px-5 py-10 text-white">
      <div className="mx-auto flex max-w-[1344px] flex-col justify-between gap-6 md:flex-row">
        <div>
          <p className="font-bold">IAMET</p>
          <p className="mt-2 text-sm text-slate-400">
            Integración y servicios de soluciones en tecnología.
          </p>
          <a
            className="mt-3 inline-block text-sm text-blue-300"
            href="mailto:contacto@iamet.mx"
          >
            contacto@iamet.mx
          </a>
        </div>
        <nav
          aria-label="Información de IAMET"
          className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-slate-300"
        >
          {[
            ["/nosotros", "Quiénes somos"],
            ["/soluciones", "Soluciones"],
            ["/marcas", "Marcas"],
            ["/blog", "Blog"],
            ["/cotizacion", "Cotización"],
            ["/contacto", "Contacto"],
            ["/industrias", "Industrias"],
            ["/tienda", "Tienda"],
            ["/academy", "Academy"],
            ["/tech-advisor", "Asesor virtual"],
          ].map(([href, label]) => (
            <Link href={href} key={href} className="hover:text-white">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
