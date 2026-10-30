import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { warrantyStatusLabels, orderStatusLabels } from "@shared/warranty";
import { downloadInvoice } from "./Warranties";
const field =
  "w-full rounded-lg border border-slate-600 bg-slate-900 p-3 text-white";
function AdminTicket({ id }: { id: number }) {
  const utils = trpc.useUtils();
  const detail = trpc.warranty.adminDetail.useQuery({ id });
  const [status, setStatus] = useState("reviewing");
  const [message, setMessage] = useState("");
  const [fileError, setFileError] = useState("");
  const update = trpc.warranty.adminUpdate.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.warranty.adminDetail.invalidate({ id });
      utils.warranty.adminList.invalidate();
    },
  });
  if (detail.isLoading) return <p>Cargando…</p>;
  if (detail.error) return <p role="alert">{detail.error.message}</p>;
  if (!detail.data) return null;
  return (
    <section className="rounded-xl border border-slate-700 p-5">
      <h2 className="text-xl font-bold">{detail.data.ticket.reference}</h2>
      <p className="mt-3">
        {detail.data.ticket.product} ·{" "}
        {warrantyStatusLabels[detail.data.ticket.status]}
      </p>
      <p className="mt-3 whitespace-pre-wrap">
        {detail.data.ticket.description}
      </p>
      <p className="mt-3 text-sm">
        Referencia de compra:{" "}
        {detail.data.ticket.purchaseReference || "No indicada"}
      </p>
      <button
        className="my-5 text-blue-300 underline"
        onClick={async () => {
          try {
            setFileError("");
            await downloadInvoice(
              await utils.client.warranty.adminInvoice.query({ id })
            );
          } catch {
            setFileError("No se pudo descargar la factura.");
          }
        }}
      >
        Descargar factura
      </button>
      {fileError && <p role="alert">{fileError}</p>}
      <ol className="space-y-4">
        {detail.data.updates.map((u: any) => (
          <li key={u.id} className="border-l-2 border-blue-500 pl-3">
            <p className="text-xs text-slate-400">
              {u.author === "admin" ? "IAMET" : "Cliente"} ·{" "}
              {new Date(u.createdAt).toLocaleString("es-MX")}
              {u.status ? ` · ${warrantyStatusLabels[u.status]}` : ""}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{u.message}</p>
          </li>
        ))}
      </ol>
      <form
        className="mt-6 space-y-4"
        onSubmit={e => {
          e.preventDefault();
          update.mutate({ id, status: status as any, message });
        }}
      >
        <label className="block">
          Nuevo estado
          <select
            className={field}
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {Object.entries(warrantyStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Mensaje visible para el cliente
          <textarea
            className={field}
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            minLength={2}
            maxLength={2000}
          />
        </label>
        <button
          disabled={update.isPending}
          className="rounded-full bg-blue-600 px-5 py-3 disabled:opacity-50"
        >
          Actualizar ticket
        </button>
        {update.error && <p role="alert">{update.error.message}</p>}
      </form>
    </section>
  );
}
export default function AdminWarranties() {
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState("tickets");
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
    onSuccess: () => {
      setForm({
        customerEmail: "",
        reference: "",
        kind: "purchase",
        description: "",
      });
      utils.warranty.adminOrders.invalidate();
    },
  });
  const updateOrder = trpc.warranty.adminUpdateOrder.useMutation({
    onSuccess: () => utils.warranty.adminOrders.invalidate(),
  });
  return (
    <DashboardLayout>
      <div className="space-y-8 p-5 text-white">
        <h1 className="text-3xl font-bold">Garantías y órdenes de clientes</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setTab("tickets")}
            aria-pressed={tab === "tickets"}
          >
            Tickets de garantía
          </button>
          <button
            onClick={() => setTab("orders")}
            aria-pressed={tab === "orders"}
          >
            Pedidos y órdenes
          </button>
        </div>
        {tab === "tickets" ? (
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <section>
              {tickets.error ? (
                <p role="alert">{tickets.error.message}</p>
              ) : tickets.isLoading ? (
                <p>Cargando…</p>
              ) : !tickets.data?.length ? (
                <p>No hay tickets registrados.</p>
              ) : (
                <ul className="space-y-3">
                  {tickets.data.map((item: any) => (
                    <li key={item.ticket.id}>
                      <button
                        onClick={() => setSelected(item.ticket.id)}
                        className="w-full rounded-xl border border-slate-700 p-4 text-left"
                      >
                        <strong>
                          {item.ticket.reference} · {item.ticket.product}
                        </strong>
                        <p className="mt-2 text-sm text-slate-300">
                          {item.customer.name} · {item.customer.email}
                        </p>
                        <p className="mt-2 text-sm text-blue-300">
                          {warrantyStatusLabels[item.ticket.status]}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {selected && <AdminTicket id={selected} key={selected} />}
          </div>
        ) : (
          <>
            <section className="max-w-[750px]">
              <h2 className="text-xl font-bold">Registrar pedido u orden</h2>
              <p className="mt-3 text-sm text-slate-400">
                Se asociará al correo de un cliente registrado. No implica un
                cobro ni importa automáticamente datos de un ERP.
              </p>
              <form
                className="mt-5 space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  createOrder.mutate({
                    ...form,
                    kind: form.kind as "purchase" | "service",
                  });
                }}
              >
                <label className="block">
                  Correo del cliente
                  <input
                    type="email"
                    className={field}
                    value={form.customerEmail}
                    onChange={e =>
                      setForm({ ...form, customerEmail: e.target.value })
                    }
                    required
                  />
                </label>
                <label className="block">
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
                <label className="block">
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
                <label className="block">
                  Descripción
                  <textarea
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
                <button
                  disabled={createOrder.isPending}
                  className="rounded-full bg-blue-600 px-5 py-3"
                >
                  Registrar
                </button>
                {createOrder.error && (
                  <p role="alert">{createOrder.error.message}</p>
                )}
                {createOrder.data && <p role="status">Registro creado.</p>}
              </form>
            </section>
            <section>
              <h2 className="mb-5 text-xl font-bold">Registros de clientes</h2>
              {orders.error ? (
                <p role="alert">{orders.error.message}</p>
              ) : (
                orders.data?.map((item: any) => (
                  <article
                    key={item.order.id}
                    className="my-4 rounded-xl border border-slate-700 p-5"
                  >
                    <p className="font-bold">
                      {item.order.reference} ·{" "}
                      {item.order.kind === "purchase"
                        ? "Pedido"
                        : "Orden de servicio"}
                    </p>
                    <p className="my-3 text-sm">
                      {item.customer.email} · {item.order.description}
                    </p>
                    <label>
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
                  </article>
                ))
              )}
              {updateOrder.error && (
                <p role="alert">{updateOrder.error.message}</p>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
