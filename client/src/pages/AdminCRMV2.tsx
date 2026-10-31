import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminWorkspaceV2 from "@/components/v2/AdminWorkspaceV2";
import AssistantCRM from "@/components/AssistantCRM";
import { leadStages, type LeadStage } from "@shared/crm";
import { LayoutDashboard, Users, MessagesSquare } from "lucide-react";
const label = (status: string) =>
  leadStages.find(s => s.value === status)?.label ?? status;
const sourceLabel = (source: string) =>
  ({
    agent: "Asistente",
    form: "Formulario",
    advisor: "Asesor",
    direct: "Directo",
  })[source] ?? source;
const control =
  "rounded-xl border border-slate-700 bg-[#101f32] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
function LeadDetail({ id, close }: { id: number; close: () => void }) {
  const detail = trpc.crmV2.detail.useQuery({ id });
  const [status, setStatus] = useState<LeadStage>("new");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const utils = trpc.useUtils();
  const update = trpc.crmV2.update.useMutation({
    onSuccess: async () => {
      setSaved(true);
      await Promise.all([
        utils.crmV2.list.invalidate(),
        utils.crmV2.overview.invalidate(),
        utils.crmV2.detail.invalidate({ id }),
      ]);
    },
  });
  useEffect(() => {
    if (detail.data) {
      setStatus(detail.data.status);
      setNotes(detail.data.notes ?? "");
    }
  }, [detail.data]);
  const lead = detail.data;
  return (
    <section
      aria-label="Ficha del prospecto"
      className="rounded-2xl border border-blue-400/30 bg-[#0c1a2b] p-5"
    >
      <div className="flex justify-between gap-3">
        <h2 className="text-xl font-semibold">Ficha del prospecto</h2>
        <button onClick={close} className="text-sm text-blue-300 underline">
          Cerrar ficha
        </button>
      </div>
      {detail.isLoading && <p role="status">Cargando…</p>}
      {detail.error && <p role="alert">No se pudo abrir el prospecto.</p>}
      {lead && (
        <>
          <div className="my-5 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-semibold">{lead.company}</h3>
              <p>{lead.contactName}</p>
              <p className="break-all text-blue-200">{lead.email}</p>
              <p>{lead.phone || "Sin teléfono"}</p>
              <p className="mt-2 text-sm text-slate-400">
                {lead.industry || "Industria no indicada"} ·{" "}
                {sourceLabel(lead.source)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Necesidad del cliente</p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">
                {lead.problemDescription || "Sin descripción"}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Campaña: {lead.utmCampaign || "Sin campaña registrada"} · Medio:{" "}
                {lead.utmMedium || "Sin medio registrado"}
              </p>
            </div>
          </div>
          <form
            onSubmit={e => {
              e.preventDefault();
              update.mutate({ id, status, notes });
            }}
            className="space-y-4"
          >
            <label className="block text-sm">
              Etapa del embudo
              <select
                value={status}
                onChange={e => {
                  setStatus(e.target.value as LeadStage);
                  setSaved(false);
                }}
                className={`${control} mt-2 block w-full md:w-64`}
              >
                {leadStages.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Notas de seguimiento
              <textarea
                maxLength={5000}
                value={notes}
                onChange={e => {
                  setNotes(e.target.value);
                  setSaved(false);
                }}
                rows={4}
                className={`${control} mt-2 block w-full`}
              />
            </label>
            <button
              disabled={update.isPending || detail.isFetching}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {update.isPending ? "Guardando…" : "Guardar seguimiento"}
            </button>
            {saved && (
              <p role="status" className="text-sm text-emerald-300">
                Seguimiento guardado.
              </p>
            )}
            {update.error && (
              <p role="alert" className="text-sm text-red-300">
                No se pudo guardar: {update.error.message}
              </p>
            )}
          </form>
        </>
      )}
    </section>
  );
}
export default function AdminCRMV2() {
  const [tab, setTab] = useState<"overview" | "leads" | "assistant">(
    "overview"
  );
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<LeadStage | "">("");
  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const overview = trpc.crmV2.overview.useQuery({ days });
  const prospects = trpc.crmV2.list.useQuery(
    { days, page, status: status || undefined, search },
    { enabled: tab === "leads" }
  );
  const stages = overview.data?.stages ?? [];
  const count = (status: string) =>
    stages.find((s: any) => s.status === status)?.count ?? 0;
  const total = stages.reduce((sum: number, s: any) => sum + s.count, 0);
  const navigation = [
    { id: "overview", label: "Resumen", Icon: LayoutDashboard },
    { id: "leads", label: "Prospectos", Icon: Users },
    { id: "assistant", label: "Asistente virtual", Icon: MessagesSquare },
  ] as const;
  return (
    <AdminWorkspaceV2>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.24em] text-blue-400">
            IAMET · Gestión comercial
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            CRM de IAMET
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Prospectos, seguimiento y conversaciones en un solo lugar.
          </p>
        </div>
      </div>
      <nav
        aria-label="Secciones del CRM"
        className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-4"
      >
        {navigation.map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${tab === id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      {tab !== "assistant" && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm text-slate-300">
            Registros creados en los últimos{" "}
            <select
              className={`${control} ml-2`}
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
            className="text-sm text-blue-300 underline"
            onClick={() => {
              overview.refetch();
              if (tab === "leads") prospects.refetch();
            }}
          >
            Actualizar
          </button>
        </div>
      )}
      {tab === "overview" && (
        <div className="space-y-6">
          {overview.isLoading && <p role="status">Cargando resumen…</p>}
          {overview.error && (
            <p role="alert" className="text-red-300">
              No se pudo cargar el resumen. Verifique la conexión del servidor.
            </p>
          )}
          {overview.data && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  ["Prospectos recibidos", total],
                  [
                    "En seguimiento",
                    count("contacted") + count("qualified") + count("proposal"),
                  ],
                  ["Ganados", count("closed_won")],
                  ["Por atender", count("new")],
                ].map(([label, value]) => (
                  <article
                    key={label}
                    className="rounded-2xl border border-white/10 bg-[#0c1a2b] p-5"
                  >
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="mt-3 text-4xl font-semibold">{value}</p>
                  </article>
                ))}
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border border-white/10 bg-[#0c1a2b] p-5">
                  <h2 className="mb-5 text-lg font-semibold">
                    Etapas del embudo
                  </h2>
                  <div className="space-y-4">
                    {leadStages.map(s => (
                      <div key={s.value}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{s.label}</span>
                          <span>{count(s.value)}</span>
                        </div>
                        <meter
                          aria-label={s.label}
                          min={0}
                          max={Math.max(total, 1)}
                          value={count(s.value)}
                          className="h-2 w-full"
                        />
                      </div>
                    ))}
                  </div>
                </section>
                <section className="rounded-2xl border border-white/10 bg-[#0c1a2b] p-5">
                  <h2 className="mb-5 text-lg font-semibold">
                    Origen de los prospectos
                  </h2>
                  {overview.data.sources.length ? (
                    overview.data.sources.map((s: any) => (
                      <div
                        key={s.source}
                        className="flex justify-between border-b border-white/10 py-3 text-sm"
                      >
                        <span>{sourceLabel(s.source)}</span>
                        <strong>{s.count}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-slate-400">
                      Aún no hay prospectos. Las solicitudes de cotización del
                      sitio aparecerán aquí cuando se reciban.
                    </p>
                  )}
                  <p className="mt-5 text-xs leading-5 text-slate-500">
                    Las conversaciones anónimas se consultan en Asistente
                    virtual. Un chat no se cuenta automáticamente como
                    prospecto.
                  </p>
                </section>
              </div>
              <section className="rounded-2xl border border-white/10 bg-[#0c1a2b] p-5">
                <h2 className="mb-4 text-lg font-semibold">
                  Últimos prospectos
                </h2>
                {overview.data.latest.length ? (
                  overview.data.latest.map((l: any) => (
                    <button
                      key={l.id}
                      onClick={() => {
                        setSelected(l.id);
                        setTab("leads");
                      }}
                      className="flex w-full items-center justify-between gap-4 border-t border-white/10 py-4 text-left"
                    >
                      <span>
                        <strong className="block text-sm">{l.company}</strong>
                        <span className="text-xs text-slate-400">
                          {l.contactName}
                        </span>
                      </span>
                      <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                        {label(l.status)}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    El nuevo CRM está listo para recibir sus primeros
                    prospectos.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      )}
      {tab === "leads" && (
        <div className="space-y-5">
          <form
            onSubmit={e => {
              e.preventDefault();
              setSearch(draftSearch.trim());
              setPage(0);
            }}
            className="flex flex-wrap gap-3"
          >
            <input
              aria-label="Buscar prospectos"
              value={draftSearch}
              onChange={e => setDraftSearch(e.target.value)}
              maxLength={150}
              placeholder="Empresa, contacto o correo"
              className={`${control} min-w-0 flex-1`}
            />
            <select
              aria-label="Filtrar etapa"
              value={status}
              onChange={e => {
                setStatus(e.target.value as LeadStage | "");
                setPage(0);
              }}
              className={control}
            >
              <option value="">Todas las etapas</option>
              {leadStages.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold">
              Buscar
            </button>
          </form>
          {prospects.isLoading && <p role="status">Cargando prospectos…</p>}
          {prospects.error && (
            <p role="alert" className="text-red-300">
              No se pudieron cargar los prospectos.
            </p>
          )}
          {prospects.data && (
            <>
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#102039]">
                    <tr>
                      {[
                        "Empresa / contacto",
                        "Origen",
                        "Etapa",
                        "Fecha",
                        "Ficha",
                      ].map(h => (
                        <th key={h} className="p-4 font-medium text-slate-300">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prospects.data.items.map((l: any) => (
                      <tr key={l.id} className="border-t border-white/10">
                        <td className="p-4">
                          <strong>{l.company}</strong>
                          <p className="mt-1 text-xs text-slate-400">
                            {l.contactName}
                          </p>
                        </td>
                        <td className="p-4">{sourceLabel(l.source)}</td>
                        <td className="p-4">{label(l.status)}</td>
                        <td className="whitespace-nowrap p-4 text-slate-400">
                          {new Date(l.createdAt).toLocaleDateString("es-MX")}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setSelected(l.id)}
                            className="text-blue-300 underline"
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!prospects.data.items.length && (
                  <p className="p-6 text-sm text-slate-400">
                    No hay prospectos que coincidan con estos filtros.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
                <span>
                  {prospects.data.total} prospectos · Página {page + 1}
                </span>
                <div className="flex gap-4">
                  <button
                    disabled={!page}
                    onClick={() => setPage(p => p - 1)}
                    className="disabled:opacity-30"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={(page + 1) * 20 >= prospects.data.total}
                    onClick={() => setPage(p => p + 1)}
                    className="disabled:opacity-30"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          )}
          {selected && (
            <LeadDetail
              key={selected}
              id={selected}
              close={() => setSelected(null)}
            />
          )}
        </div>
      )}
      {tab === "assistant" && <AssistantCRM />}
    </AdminWorkspaceV2>
  );
}
