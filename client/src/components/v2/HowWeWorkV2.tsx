import { processSteps } from "./processData";

export default function HowWeWorkV2() {
  return (
    <section className="bg-[#f7faff] px-5 py-20 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <div className="max-w-[520px]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              De la necesidad a la operación
            </p>

            <h2 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.04em] text-slate-950 md:text-5xl">
              ¿Cómo trabajamos?
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-500">
              IAMET acompaña el proyecto desde la definición de la necesidad
              hasta la puesta en marcha, mantenimiento y soporte.
            </p>

            <p className="mt-6 text-base leading-7 text-slate-600">
              Aplicamos un proceso estructurado para llevar cada proyecto
              desde la necesidad inicial hasta su operación y soporte.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {processSteps.map(step => {
              const Icon = step.icon;

              return (
                <article
                  key={step.number}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <span className="absolute right-5 top-4 text-4xl font-bold text-slate-100">
                    {step.number}
                  </span>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold tracking-[-0.02em] text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
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
