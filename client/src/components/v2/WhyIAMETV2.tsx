import { whyItems } from "./whyData";

export default function WhyIAMETV2() {
  return (
    <section className="bg-white px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div className="max-w-[560px]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Por qué IAMET
            </p>

            <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] text-slate-950 md:text-5xl">
              Una visión completa del proyecto tecnológico.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-500">
              Un proyecto tecnológico no termina al seleccionar equipos.
              Requiere ingeniería, integración, ejecución y continuidad
              para convertirse en una solución que funcione en la operación.
            </p>

            <div className="mt-9 rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
              <p className="text-sm font-bold text-blue-700">
                IAMET como integrador
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Coordinamos las distintas disciplinas tecnológicas alrededor
                de una misma necesidad operativa y una arquitectura común.
              </p>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
            {whyItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group border-b border-slate-200 py-7"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-600 transition-colors group-hover:bg-blue-50">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold tracking-[0.16em] text-slate-300">
                          0{index + 1}
                        </span>

                        <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-900">
                          {item.title}
                        </h3>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
