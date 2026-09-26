import { whyItems } from "./whyData";

export default function WhyIAMETV2() {
  return (
    <section className="bg-white px-5 py-14 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-9 sm:gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div className="max-w-[560px]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Por qué IAMET
            </p>

            <h2 className="mt-3 text-[2.15rem] font-bold leading-[1.03] tracking-[-0.04em] text-slate-950 sm:mt-4 sm:text-4xl md:text-5xl">
              Una visión completa del proyecto tecnológico.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500 sm:mt-6 sm:text-lg sm:leading-8">
              Un proyecto tecnológico no termina al seleccionar equipos.
              Requiere ingeniería, integración, ejecución y continuidad
              para convertirse en una solución que funcione en la operación.
            </p>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:mt-9 sm:p-6">
              <p className="text-sm font-bold text-blue-700">
                IAMET como integrador
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Coordinamos las distintas disciplinas tecnológicas alrededor
                de una misma necesidad operativa y una arquitectura común.
              </p>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-0 md:grid-cols-2 md:gap-y-2">
            {whyItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group border-b border-slate-200 py-5 sm:py-6 md:py-7"
                >
                  <div className="flex gap-3.5 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-blue-600 transition-colors group-hover:bg-blue-50 sm:h-11 sm:w-11">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold tracking-[0.16em] text-slate-300">
                          0{index + 1}
                        </span>

                        <h3 className="text-base font-bold tracking-[-0.02em] text-slate-900 sm:text-lg">
                          {item.title}
                        </h3>
                      </div>

                      <p className="mt-1.5 text-sm leading-6 text-slate-500 sm:mt-2">
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
