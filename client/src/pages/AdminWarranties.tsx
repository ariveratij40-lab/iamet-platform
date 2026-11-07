import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminWorkspaceV2 from "@/components/v2/AdminWorkspaceV2";
import { warrantyStatusLabels, orderStatusLabels } from "@shared/warranty";
import { downloadInvoice } from "./Warranties";
import {
  ShieldCheck,
  Clock3,
  MessageSquare,
  Package,
  Plus,
  Search,
  RefreshCw,
  Download,
  X,
} from "lucide-react";
const field =
  "mt-2 w-full rounded-xl border border-slate-700 bg-[#07111f] px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500";
const panel = "min-w-0 break-words rounded-2xl border border-white/10 bg-[#0c1a2b] p-5";
const primary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40";
function badge(status: string) {
  return `inline-flex rounded-full border px-3 py-1 text-xs ${["resolved", "completed", "approved"].includes(status) ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : ["rejected", "cancelled"].includes(status) ? "border-slate-400/20 bg-slate-500/10 text-slate-300" : status === "awaiting_customer" ? "border-amber-400/20 bg-amber-500/10 text-amber-200" : "border-blue-400/20 bg-blue-500/10 text-blue-200"}`;
}
function AdminTicket({ id, close }: { id: number; close: () => void }) {
  const utils = trpc.useUtils();
  const detail = trpc.warranty.adminDetail.useQuery({ id });
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [fileError, setFileError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [saved, setSaved] = useState(false);
  const update = trpc.warranty.adminUpdate.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.warranty.adminDetail.invalidate({ id }),
        utils.warranty.adminList.invalidate(),
      ]);
      setMessage("");
      setStatus(null);
      setSaved(true);
    },
  });
  return (
    <section aria-label="Detalle del ticket" className={panel}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Seguimiento de garantía</h2>
        <button
          aria-label="Cerrar detalle del ticket"
          onClick={close}
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
        >
          <X size={18} />
        </button>
      </div>
      {detail.isLoading && (
        <p role="status" className="text-sm text-slate-400">
          Cargando ticket…
        </p>
      )}
      {detail.error && (
        <p role="alert" className="text-sm text-red-300">
          No se pudo abrir el ticket. {detail.error.message}
        </p>
      )}
      {detail.data && (
        <>
          <div className="mb-5 space-y-3">
            <p className="text-xl font-semibold">
              {detail.data.ticket.reference}
            </p>
            <span className={badge(detail.data.ticket.status)}>
              {warrantyStatusLabels[detail.data.ticket.status]}
            </span>
            <h3 className="font-semibold">{detail.data.ticket.product}</h3>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
              {detail.data.ticket.description}
            </p>
            <p className="text-xs text-slate-400">
              Referencia de compra:{" "}
              {detail.data.ticket.purchaseReference || "No indicada"}
            </p>
          </div>
          <button
            disabled={downloading}
            className="mb-5 inline-flex items-center gap-2 text-sm text-blue-300 disabled:opacity-40"
            onClick={async () => {
              try {
                setDownloading(true);
                setFileError("");
                await downloadInvoice(
                  await utils.client.warranty.adminInvoice.query({ id })
                );
              } catch {
                setFileError(
                  "No se pudo descargar la factura. Intente nuevamente."
                );
              } finally {
                setDownloading(false);
              }
            }}
          >
            <Download size={16} />
            {downloading ? "Descargando…" : "Descargar factura"}
          </button>
          {fileError && (
            <p role="alert" className="mb-4 text-sm text-red-300">
              {fileError}
            </p>
          )}
          <h3 className="mb-4 text-sm font-semibold text-slate-300">
            Historial del ticket
          </h3>
          <ol className="max-h-80 space-y-4 overflow-y-auto pr-2">
            {detail.data.updates.map((u: any) => (
              <li key={u.id} className="border-l-2 border-blue-500/40 pl-3">
                <p className="text-xs leading-5 text-slate-400">
                  {u.author === "admin" ? "IAMET" : "Cliente"} ·{" "}
                  {new Date(u.createdAt).toLocaleString("es-MX")}
                  {u.status ? ` · ${warrantyStatusLabels[u.status]}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                  {u.message}
                </p>
              </li>
            ))}
          </ol>
          <form
            className="mt-6 space-y-4 border-t border-white/10 pt-5"
            onSubmit={e => {
              e.preventDefault();
              setSaved(false);
              update.mutate({
                id,
                status: (status ?? detail.data!.ticket.status) as any,
                message,
              });
            }}
          >
            <label className="block text-sm text-slate-300">
              Estado del ticket
              <select
                className={field}
                value={status ?? detail.data.ticket.status}
                disabled={update.isPending}
                onChange={e => {
                  setStatus(e.target.value);
                  setSaved(false);
                }}
              >
                {Object.entries(warrantyStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Respuesta para el cliente
              <textarea
                rows={4}
                className={field}
                value={message}
                disabled={update.isPending}
                onChange={e => {
                  setMessage(e.target.value);
                  setSaved(false);
                }}
                required
                minLength={2}
                maxLength={2000}
                placeholder="Describa el avance o la información que necesita."
              />
            </label>
            <p className="text-xs leading-5 text-slate-400">
              El cliente podrá consultar esta respuesta desde su cuenta.
            </p>
            <button disabled={update.isPending} className={primary}>
              {update.isPending ? "Guardando…" : "Guardar seguimiento"}
            </button>
            {update.error && (
              <p role="alert" className="text-sm text-red-300">
                {update.error.message}
              </p>
            )}
            {saved && (
              <p role="status" className="text-sm text-emerald-300">
                Ticket actualizado correctamente.
              </p>
            )}
          </form>
        </>
      )}
    </section>
  );
}
export default function AdminWarranties() {
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"tickets" | "orders">("tickets");
  const [search, setSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState("");
  const [orderFilter, setOrderFilter] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [created, setCreated] = useState(false);
  const [form, setForm] = useState({
    customerEmail: "",
    reference: "",
    kind: "purchase",
    description: "",
  });
  const utils = trpc.useUtils();
  const tickets = trpc.warranty.adminList.useQuery(undefined, {
    refetchInterval: 30000,
  });
  const orders = trpc.warranty.adminOrders.useQuery();
  const createOrder = trpc.warranty.adminCreateOrder.useMutation({
    onSuccess: async () => {
      setForm({
        customerEmail: "",
        reference: "",
        kind: "purchase",
        description: "",
      });
      setCreated(true);
      await utils.warranty.adminOrders.invalidate();
    },
  });
  const updateOrder = trpc.warranty.adminUpdateOrder.useMutation({
    onSuccess: () => utils.warranty.adminOrders.invalidate(),
  });
  const needle = search.trim().toLocaleLowerCase("es-MX");
  const visibleTickets = (tickets.data ?? []).filter(
    (item: any) =>
      (!ticketFilter || item.ticket.status === ticketFilter) &&
      `${item.ticket.reference} ${item.ticket.product} ${item.customer.name} ${item.customer.email}`
        .toLocaleLowerCase("es-MX")
        .includes(needle)
  );
  const visibleOrders = (orders.data ?? []).filter(
    (item: any) =>
      (!orderFilter || item.order.status === orderFilter) &&
      `${item.order.reference} ${item.order.description} ${item.customer.name} ${item.customer.email}`
        .toLocaleLowerCase("es-MX")
        .includes(needle)
  );
  const metrics = [
    {
      label: "Tickets recientes",
      value: tickets.data?.length,
      Icon: ShieldCheck,
    },
    {
      label: "Tickets abiertos",
      value: tickets.data?.filter(
        (i: any) => !["resolved", "rejected"].includes(i.ticket.status)
      ).length,
      Icon: Clock3,
    },
    {
      label: "Esperando al cliente",
      value: tickets.data?.filter(
        (i: any) => i.ticket.status === "awaiting_customer"
      ).length,
      Icon: MessageSquare,
    },
    { label: "Pedidos y órdenes", value: orders.data?.length, Icon: Package },
  ];
  return (
    <AdminWorkspaceV2>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[.24em] text-blue-400">
            IAMET · Atención al cliente
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Garantías y órdenes
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Gestione solicitudes, actualice su seguimiento y consulte los
            registros de sus clientes.
          </p>
        </div>
        <button
          className={primary}
          onClick={() => {
            setTab("orders");
            setShowOrderForm(true);
            setCreated(false);
          }}
        >
          <Plus size={17} />
          Registrar pedido u orden
        </button>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map(({ label, value, Icon }) => (
          <article key={label} className={panel}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-sm leading-5 text-slate-400">{label}</p>
              <Icon
                size={18}
                className="shrink-0 text-blue-400"
                aria-hidden="true"
              />
            </div>
            <p className="text-3xl font-semibold">{value ?? "—"}</p>
          </article>
        ))}
      </div>
      <p className="mb-6 text-xs text-slate-500">
        Vista de los últimos 200 tickets y 200 pedidos u órdenes registrados.
      </p>
      <div
        role="group"
        aria-label="Tipo de registro"
        className="mb-5 flex flex-wrap gap-2 border-b border-white/10 pb-4"
      >
        {[
          { id: "tickets", label: "Tickets de garantía", Icon: ShieldCheck },
          { id: "orders", label: "Pedidos y órdenes", Icon: Package },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            aria-pressed={tab === id}
            onClick={() => setTab(id as "tickets" | "orders")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold ${tab === id ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-3">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar registros</span>
          <Search
            size={17}
            className="absolute left-3 top-3.5 text-slate-500"
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            maxLength={150}
            className={`${field} !mt-0 pl-10`}
            placeholder="Referencia, cliente o descripción"
          />
        </label>
        <select
          aria-label="Filtrar por estado"
          className={`${field} !mt-0 !w-auto max-w-full`}
          value={tab === "tickets" ? ticketFilter : orderFilter}
          onChange={e =>
            tab === "tickets"
              ? setTicketFilter(e.target.value)
              : setOrderFilter(e.target.value)
          }
        >
          <option value="">Todos los estados</option>
          {Object.entries(
            tab === "tickets" ? warrantyStatusLabels : orderStatusLabels
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          aria-label="Actualizar registros"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm text-blue-200"
          onClick={() => {
            tickets.refetch();
            orders.refetch();
          }}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>
      {tab === "tickets" ? (
        <div
          className={`grid items-start gap-5 ${selected ? "xl:grid-cols-2" : ""}`}
        >
          <section className={panel}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Solicitudes de garantía</h2>
              {tickets.data && (
                <span className="text-xs text-slate-500">
                  {visibleTickets.length} visibles
                </span>
              )}
            </div>
            {tickets.isLoading ? (
              <p role="status" className="py-6 text-sm text-slate-400">
                Cargando solicitudes…
              </p>
            ) : tickets.error ? (
              <p role="alert" className="text-sm text-red-300">
                No se pudieron cargar los tickets. Pulse Actualizar para volver
                a intentar.
              </p>
            ) : !visibleTickets.length ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 px-5 py-10 text-center">
                <ShieldCheck size={32} className="mb-4 text-blue-400" />
                <h3 className="font-semibold">
                  {tickets.data?.length
                    ? "No hay coincidencias"
                    : "Aún no hay tickets de garantía"}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  {tickets.data?.length
                    ? "Cambie la búsqueda o el estado para encontrar otras solicitudes."
                    : "Las solicitudes que registren sus clientes aparecerán aquí para su revisión y seguimiento."}
                </p>
                <Link
                  href="/garantias"
                  className="mt-4 text-sm font-semibold text-blue-300 hover:underline"
                >
                  Ver portal de clientes →
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {visibleTickets.map((item: any) => (
                  <li key={item.ticket.id}>
                    <button
                      aria-pressed={selected === item.ticket.id}
                      onClick={() => setSelected(item.ticket.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${selected === item.ticket.id ? "border-blue-400/50 bg-blue-500/10" : "border-white/10 hover:border-blue-400/30 hover:bg-white/5"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <span className="font-semibold">
                          {item.ticket.reference}
                        </span>
                        <span className={badge(item.ticket.status)}>
                          {warrantyStatusLabels[item.ticket.status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">
                        {item.ticket.product}
                      </p>
                      <p className="mt-2 break-all text-xs leading-5 text-slate-400">
                        {item.customer.name} · {item.customer.email}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Actualizado:{" "}
                        {new Date(item.ticket.updatedAt).toLocaleString(
                          "es-MX"
                        )}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {selected && (
            <AdminTicket
              key={selected}
              id={selected}
              close={() => setSelected(null)}
            />
          )}
        </div>
      ) : (
        <div
          className={`grid items-start gap-5 ${showOrderForm ? "xl:grid-cols-[.9fr_1.1fr]" : ""}`}
        >
          {showOrderForm && (
            <section className={panel}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  Registrar pedido u orden
                </h2>
                <button
                  aria-label="Cerrar formulario de pedido"
                  onClick={() => setShowOrderForm(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use el correo de un cliente registrado. Podrá consultar el
                registro y su estado desde su cuenta.
              </p>
              <form
                className="mt-5 space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  setCreated(false);
                  createOrder.mutate({
                    ...form,
                    kind: form.kind as "purchase" | "service",
                  });
                }}
              >
                <label className="block text-sm text-slate-300">
                  Correo del cliente
                  <input
                    type="email"
                    autoComplete="email"
                    className={field}
                    value={form.customerEmail}
                    onChange={e =>
                      setForm({ ...form, customerEmail: e.target.value })
                    }
                    required
                    maxLength={320}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm text-slate-300">
                    Referencia
                    <input
                      className={field}
                      value={form.reference}
                      onChange={e =>
                        setForm({ ...form, reference: e.target.value })
                      }
                      required
                      minLength={2}
                      maxLength={64}
                    />
                  </label>
                  <label className="block text-sm text-slate-300">
                    Tipo
                    <select
                      className={field}
                      value={form.kind}
                      onChange={e => setForm({ ...form, kind: e.target.value })}
                    >
                      <option value="purchase">Pedido</option>
                      <option value="service">Orden de servicio</option>
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-slate-300">
                  Descripción
                  <textarea
                    rows={4}
                    className={field}
                    value={form.description}
                    onChange={e =>
                      setForm({ ...form, description: e.target.value })
                    }
                    required
                    minLength={2}
                    maxLength={2000}
                  />
                </label>
                <button disabled={createOrder.isPending} className={primary}>
                  {createOrder.isPending ? "Registrando…" : "Guardar registro"}
                </button>
                {createOrder.error && (
                  <p role="alert" className="text-sm text-red-300">
                    {createOrder.error.message}
                  </p>
                )}
                {created && (
                  <p role="status" className="text-sm text-emerald-300">
                    Registro creado. Ya está disponible en la cuenta del
                    cliente.
                  </p>
                )}
              </form>
            </section>
          )}
          <section className={panel}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                Pedidos y órdenes de clientes
              </h2>
              {orders.data && (
                <span className="text-xs text-slate-500">
                  {visibleOrders.length} visibles
                </span>
              )}
            </div>
            {orders.isLoading ? (
              <p role="status" className="py-6 text-sm text-slate-400">
                Cargando registros…
              </p>
            ) : orders.error ? (
              <p role="alert" className="text-sm text-red-300">
                No se pudieron cargar los registros. Pulse Actualizar para
                volver a intentar.
              </p>
            ) : !visibleOrders.length ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 px-5 py-10 text-center">
                <Package size={32} className="mb-4 text-blue-400" />
                <h3 className="font-semibold">
                  {orders.data?.length
                    ? "No hay coincidencias"
                    : "Aún no hay pedidos ni órdenes"}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                  {orders.data?.length
                    ? "Cambie la búsqueda o seleccione otro estado."
                    : "Registre un pedido o una orden de servicio para que su cliente pueda darle seguimiento."}
                </p>
                {!showOrderForm && (
                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="mt-4 text-sm font-semibold text-blue-300"
                  >
                    Registrar el primero →
                  </button>
                )}
              </div>
            ) : (
              <ul className="space-y-4">
                {visibleOrders.map((item: any) => (
                  <li
                    key={item.order.id}
                    className="rounded-xl border border-white/10 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.order.reference}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.order.kind === "purchase"
                            ? "Pedido"
                            : "Orden de servicio"}
                        </p>
                      </div>
                      <span className={badge(item.order.status)}>
                        {orderStatusLabels[item.order.status]}
                      </span>
                    </div>
                    <p className="mt-3 break-all text-xs text-slate-400">
                      {item.customer.name} · {item.customer.email}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                      {item.order.description}
                    </p>
                    <label className="mt-4 block text-sm text-slate-300">
                      Estado
                      <select
                        aria-label={`Estado ${item.order.reference}`}
                        disabled={updateOrder.isPending}
                        className={field}
                        value={item.order.status}
                        onChange={e =>
                          updateOrder.mutate({
                            id: item.order.id,
                            status: e.target.value as any,
                          })
                        }
                      >
                        {Object.entries(orderStatusLabels).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {updateOrder.isPending && (
              <p role="status" className="mt-3 text-sm text-blue-200">
                Guardando estado…
              </p>
            )}
            {updateOrder.error && (
              <p role="alert" className="mt-3 text-sm text-red-300">
                {updateOrder.error.message}
              </p>
            )}
          </section>
        </div>
      )}
    </AdminWorkspaceV2>
  );
}
