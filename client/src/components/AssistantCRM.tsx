import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { businessServices } from "@shared/iamet-profile";
const topicLabel = (topic: string) =>
  businessServices.find(s => s.slug === topic)?.name ?? "Consulta general";
export default function AssistantCRM() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const dashboard = trpc.visitorAssistant.dashboard.useQuery({ days, page });
  const detail = trpc.visitorAssistant.transcript.useQuery(
    { id: selected! },
    { enabled: !!selected }
  );
  const data = dashboard.data;
  return (
    <section className="space-y-4 rounded-xl border border-slate-700 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            Asistente virtual · estadísticas y conversaciones
          </h2>
          <p className="text-sm text-muted-foreground">
            Conversaciones registradas, sin identificar visitantes como clientes
            o leads.
          </p>
        </div>
        <div className="flex gap-3">
          <label>
            Periodo{" "}
            <select
              className="rounded border bg-background p-2"
              value={days}
              onChange={e => {
                setDays(Number(e.target.value) as 7 | 30 | 90);
                setPage(0);
              }}
            >
              <option value={7}>7 días</option>
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
            </select>
          </label>
          <button
            onClick={() => dashboard.refetch()}
            className="rounded border px-3"
          >
            Actualizar
          </button>
        </div>
      </div>
      {dashboard.isLoading && <p role="status">Cargando estadísticas…</p>}
      {dashboard.error && (
        <p role="alert" className="text-red-400">
          No se pudo cargar el tablero: {dashboard.error.message}
        </p>
      )}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Conversaciones", data.totals.conversations],
              ["Intercambios", data.totals.exchanges],
              ["Respuestas con IA", data.totals.ai],
              ["Respuestas en modo guía", data.totals.guide],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-500/10 p-4">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          {data.totals.conversations === 0 ? (
            <p>
              Aún no hay conversaciones en este periodo. El historial comienza
              al activar el registro en el servidor.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Consultas por solución</h3>
                {data.topics.map((t: any) => (
                  <div key={t.topic} className="mb-2">
                    <div className="flex justify-between gap-3 text-sm">
                      <span>{topicLabel(t.topic)}</span>
                      <span>{t.count}</span>
                    </div>
                    <meter
                      className="w-full"
                      min={0}
                      max={data.totals.exchanges || 1}
                      value={t.count}
                      aria-label={topicLabel(t.topic)}
                    />
                  </div>
                ))}
              </div>
              <div>
                <h3 className="mb-2 font-semibold">
                  Actividad diaria · intercambios (UTC)
                </h3>
                <div className="max-h-52 overflow-auto">
                  {data.daily.map((d: any) => (
                    <div
                      key={d.day}
                      className="flex justify-between border-b py-1 text-sm"
                    >
                      <span>{d.day}</span>
                      <span>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <h3 className="font-semibold">Historial de conversaciones</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="p-2">Última actividad</th>
                  <th className="p-2">Página de inicio</th>
                  <th className="p-2">Intercambios en periodo</th>
                  <th className="p-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item: any) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">
                      {new Date(item.updatedAt).toLocaleString("es-MX")}
                    </td>
                    <td className="p-2 break-all">{item.page}</td>
                    <td className="p-2">{item.exchanges}</td>
                    <td className="p-2">
                      <button
                        onClick={() => setSelected(item.id)}
                        className="text-blue-400 underline"
                      >
                        Ver conversación
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-4">
            <button
              disabled={!page}
              onClick={() => setPage(p => p - 1)}
              className="disabled:opacity-40"
            >
              Anterior
            </button>
            <span>Página {page + 1}</span>
            <button
              disabled={(page + 1) * 20 >= data.totals.conversations}
              onClick={() => setPage(p => p + 1)}
              className="disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
      {selected && (
        <section
          aria-label="Detalle de conversación"
          className="rounded-lg border p-4"
        >
          <div className="flex justify-between">
            <h3 className="font-semibold">Conversación</h3>
            <button onClick={() => setSelected(null)} className="underline">
              Cerrar detalle
            </button>
          </div>
          {detail.isLoading && <p>Cargando conversación…</p>}
          {detail.error && (
            <p role="alert">No se pudo cargar la conversación.</p>
          )}
          {detail.data && (
            <>
              <p className="my-3 text-sm text-muted-foreground">
                Inicio: {detail.data.conversation.page}
              </p>
              <div className="max-h-[500px] space-y-3 overflow-auto">
                {detail.data.messages.map((m: any) => (
                  <div key={m.id} className="space-y-2 border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString("es-MX")} ·{" "}
                      {m.mode === "ai" ? "IA" : "Modo guía"}
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      <strong>Visitante: </strong>
                      {m.question}
                    </p>
                    <p className="whitespace-pre-wrap break-words">
                      <strong>IAMET: </strong>
                      {m.answer}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </section>
  );
}
