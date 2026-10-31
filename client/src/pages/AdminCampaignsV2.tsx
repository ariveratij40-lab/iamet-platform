import { useState } from "react";
import { trpc } from "@/lib/trpc";
import AdminWorkspaceV2 from "@/components/v2/AdminWorkspaceV2";
import { BarChart3, RefreshCw } from "lucide-react";
const control =
  "rounded-xl border border-slate-700 bg-[#101f32] px-4 py-2 text-sm text-white disabled:opacity-50";
export default function AdminCampaignsV2() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const status = trpc.googleAds.status.useQuery(undefined, { retry: false });
  const report = trpc.googleAds.report.useQuery(
    { days },
    {
      enabled: Boolean(status.data?.connected),
      retry: false,
      staleTime: 300000,
      refetchOnWindowFocus: false,
    }
  );
  const connect = trpc.googleAds.connect.useMutation({
    onSuccess: ({ url }) => {
      window.location.assign(url);
    },
  });
  const disconnect = trpc.googleAds.disconnect.useMutation({
    onSuccess: async () => {
      setConfirmDisconnect(false);
      await status.refetch();
    },
  });
  const data = report.data;
  const totals = data?.campaigns.reduce(
    (sum, c) => ({
      impressions: sum.impressions + c.impressions,
      clicks: sum.clicks + c.clicks,
      cost: sum.cost + c.cost,
      conversions: sum.conversions + c.conversions,
    }),
    { impressions: 0, clicks: 0, cost: 0, conversions: 0 }
  );
  const money = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: data?.currency || "MXN",
    }).format(value);
  const num = (value: number) =>
    new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value);
  const error =
    status.error || connect.error || disconnect.error || report.error;
  const result = new URLSearchParams(window.location.search).get("conexion");
  return (
    <AdminWorkspaceV2>
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-blue-300">Marketing · Google Ads</p>
          <h1 className="flex items-center gap-3 text-3xl font-semibold">
            <BarChart3 /> Campañas
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Consulte el rendimiento de sus anuncios y las páginas que reciben
            visitas.
          </p>
        </div>
        {status.data?.configured && (
          <button
            className={control}
            disabled={connect.isPending}
            onClick={() => connect.mutate()}
          >
            {connect.isPending
              ? "Abriendo Google…"
              : status.data.connected
                ? "Volver a autorizar"
                : "Conectar Google Ads"}
          </button>
        )}
      </div>
      {result === "error" && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-amber-600/40 bg-amber-500/10 p-4 text-amber-200"
        >
          No se pudo completar la conexión. Compruebe el usuario de prueba, el
          permiso de Google Ads y el acceso a la cuenta. Puede volver a
          autorizar.
        </p>
      )}
      {result === "correcta" && status.data?.connected && (
        <p role="status" className="mb-5 text-emerald-300">
          Cuenta conectada correctamente.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200"
        >
          {error.message}
        </p>
      )}
      {status.isLoading && <p role="status">Consultando conexión…</p>}
      {status.data && !status.data.connected && (
        <section className="rounded-2xl border border-white/10 bg-[#0c1a2b] p-7">
          <h2 className="text-xl font-semibold">
            {status.data.configured
              ? "Conecte su cuenta para ver las estadísticas"
              : "Configuración pendiente en el VPS"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            {status.data.configured
              ? `Autorice en Google la cuenta que tiene acceso al cliente ${status.data.customer}. Los datos aparecerán después de completar la conexión.`
              : "El administrador debe instalar las credenciales de Google Ads en el servidor. Aquí no se solicitan contraseñas ni claves secretas."}
          </p>
          <p className="mt-4 text-sm text-slate-400">
            Esta sección consulta informes. No cambia anuncios, presupuestos ni
            el estado de las campañas.
          </p>
        </section>
      )}
      {status.data?.connected && (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-300">
              Período{" "}
              <select
                aria-label="Período de campañas"
                value={days}
                onChange={e => setDays(Number(e.target.value) as 7 | 30 | 90)}
                className={`${control} ml-2`}
              >
                <option value={7}>Últimos 7 días</option>
                <option value={30}>Últimos 30 días</option>
                <option value={90}>Últimos 90 días</option>
              </select>
            </label>
            <button
              className={`${control} inline-flex items-center gap-2`}
              disabled={report.isFetching}
              onClick={() => report.refetch()}
            >
              <RefreshCw size={15} />{" "}
              {report.isFetching ? "Consultando…" : "Consultar de nuevo"}
            </button>
          </div>
          <p className="mb-5 text-xs leading-5 text-slate-400">
            Los informes se reutilizan durante 5 minutos para cuidar la cuota de
            Google. Los datos recientes y las conversiones pueden tener retraso.
          </p>
          {report.isLoading && (
            <p role="status">Obteniendo estadísticas de Google Ads…</p>
          )}
          {data && totals && (
            <>
              <p className="mb-5 text-sm text-slate-400">
                Cuenta {data.customer} · {data.start} al {data.end} ·{" "}
                {data.zone} · Moneda {data.currency}
                <br />
                Última consulta:{" "}
                {new Date(data.fetchedAt).toLocaleString("es-MX")}
              </p>
              <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Inversión", money(totals.cost)],
                  ["Clics", num(totals.clicks)],
                  ["Impresiones", num(totals.impressions)],
                  [
                    "CTR",
                    totals.impressions
                      ? `${num((100 * totals.clicks) / totals.impressions)} %`
                      : "—",
                  ],
                  [
                    "CPC promedio",
                    totals.clicks ? money(totals.cost / totals.clicks) : "—",
                  ],
                  ["Conversiones de Google Ads", num(totals.conversions)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-[#0c1a2b] p-5"
                  >
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="mt-2 text-3xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <section className="mb-7 rounded-2xl border border-white/10 bg-[#0c1a2b] p-5">
                <h2 className="mb-4 text-xl font-semibold">
                  Rendimiento por campaña
                </h2>
                {!data.campaigns.length ? (
                  <p className="text-slate-400">
                    No hay actividad en este período. Esto no significa que no
                    existan campañas en la cuenta.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-slate-400">
                        <tr>
                          {[
                            "Campaña",
                            "Estado",
                            "Clics",
                            "Impresiones",
                            "Inversión",
                            "Conversiones",
                          ].map(x => (
                            <th key={x} className="whitespace-nowrap px-3 py-3">
                              {x}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-slate-200">
                        {data.campaigns.map(c => (
                          <tr key={c.id} className="border-t border-white/10">
                            <td className="min-w-48 px-3 py-4">
                              {c.name}
                              <span className="block text-xs text-slate-500">
                                ID {c.id}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              {{
                                ENABLED: "Activa",
                                PAUSED: "Pausada",
                                REMOVED: "Eliminada",
                              }[c.status] || c.status}
                            </td>
                            <td className="px-3 py-4">{num(c.clicks)}</td>
                            <td className="px-3 py-4">{num(c.impressions)}</td>
                            <td className="whitespace-nowrap px-3 py-4">
                              {money(c.cost)}
                            </td>
                            <td className="px-3 py-4">{num(c.conversions)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              <section className="mb-7 rounded-2xl border border-white/10 bg-[#0c1a2b] p-5">
                <h2 className="mb-4 text-xl font-semibold">
                  Páginas de destino
                </h2>
                <p className="mb-4 text-sm text-slate-400">
                  Direcciones reportadas por Google Ads; pueden incluir páginas
                  anteriores o externas al sitio.
                </p>
                {!data.landings.length ? (
                  <p className="text-slate-400">
                    Sin actividad de páginas de destino en este período.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-slate-400">
                        <tr>
                          <th className="px-3 py-3">Página</th>
                          <th className="px-3 py-3">Clics</th>
                          <th className="px-3 py-3">Inversión</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-200">
                        {data.landings.map((l, i) => (
                          <tr
                            key={`${l.url}-${i}`}
                            className="border-t border-white/10"
                          >
                            <td className="min-w-52 max-w-xl break-all px-3 py-4">
                              {l.url}
                            </td>
                            <td className="px-3 py-4">{num(l.clicks)}</td>
                            <td className="whitespace-nowrap px-3 py-4">
                              {money(l.cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
          <aside className="mb-7 rounded-xl border border-blue-400/20 p-5 text-sm leading-6 text-slate-400">
            Las conversiones son las registradas en Google Ads. La atribución de
            prospectos y ventas del CRM por campaña todavía no está habilitada;
            no se presenta un retorno de inversión estimado. Mientras la
            aplicación de Google esté en modo Prueba, puede ser necesario volver
            a autorizarla después de 7 días.
          </aside>
          {!confirmDisconnect ? (
            <button
              className="text-sm text-slate-400 underline"
              onClick={() => setConfirmDisconnect(true)}
            >
              Desconectar cuenta
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <p>Se eliminará el permiso guardado en este CRM.</p>
              <button
                className={control}
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate()}
              >
                Confirmar desconexión
              </button>
              <button
                className={control}
                onClick={() => setConfirmDisconnect(false)}
              >
                Cancelar
              </button>
            </div>
          )}
        </>
      )}
    </AdminWorkspaceV2>
  );
}
