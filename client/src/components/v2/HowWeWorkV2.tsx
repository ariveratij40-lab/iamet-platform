import { processSteps } from "./processData";

export default function HowWeWorkV2() {
  return (
    <section className="bg-[#f7faff] px-5 py-14 sm:py-16 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-8">
          <div className="max-w-[520px]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              De la necesidad a la operación
            </p>

            <h2 className="mt-3 text-[2.15rem] font-bold leading-[1.03] tracking-[-0.04em] text-slate-950 sm:mt-4 sm:text-4xl md:text-5xl">
              ¿Cómo trabajamos?
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500 sm:mt-5 sm:text-lg sm:leading-8">
              IAMET acompaña el proyecto desde la definición de la necesidad
              hasta la puesta en marcha, mantenimiento y soporte.
            </p>

            <p className="mt-6 hidden text-base leading-7 text-slate-600 sm:block">
              Aplicamos un proceso estructurado para llevar cada proyecto
              desde la necesidad inicial hasta su operación y soporte.
            </p>
          </div>

          <div className="relative grid gap-0 before:absolute before:bottom-8 before:left-[21px] before:top-8 before:w-px before:bg-blue-200 md:gap-4 md:before:hidden md:grid-cols-2">
            {processSteps.map(step => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="relative ml-0 overflow-visible border-0 bg-transparent py-4 pl-16 pr-0 md:overflow-hidden md:rounded-2xl md:border md:border-slate-200 md:bg-white md:p-6"
                >
                  <span className="absolute left-0 top-[26px] z-20 flex h-[43px] w-[43px] items-center justify-center rounded-full border border-blue-200 bg-white text-[11px] font-bold text-blue-600 shadow-sm md:left-auto md:right-5 md:top-4 md:block md:h-auto md:w-auto md:rounded-none md:border-0 md:bg-transparent md:text-4xl md:text-slate-100 md:shadow-none">
                    {step.number}
                  </span>

                  <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 md:flex">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-900 md:mt-5">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 md:mt-3">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
