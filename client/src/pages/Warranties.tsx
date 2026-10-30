import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { getStoreToken, useStoreSession } from "@/hooks/useStoreSession";
import { warrantyStatusLabels, orderStatusLabels } from "@shared/warranty";
import { useServiceMetadata } from "@/components/v2/ServiceConversionV2";

export async function downloadInvoice(file: {
  data: string;
  filename: string;
  mimeType: string;
}) {
  const bytes = Uint8Array.from(atob(file.data), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: file.mimeType }));
  const a = document.createElement("a");
  a.href = url;
  a.download = file.filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const inputClass =
  "w-full rounded-xl border border-blue-300/25 bg-[#0b1c2c] p-3 text-white";
export function WarrantyDetail({ id }: { id: number }) {
  const [message, setMessage] = useState("");
  const utils = trpc.useUtils();
  const [downloadError, setDownloadError] = useState("");
  const detail = trpc.warranty.detail.useQuery(
    { id },
    { retry: false, refetchInterval: 15000 }
  );
  const reply = trpc.warranty.reply.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.warranty.detail.invalidate({ id });
      utils.warranty.list.invalidate();
    },
  });
  if (detail.isLoading) return <p>Cargando seguimiento…</p>;
  if (detail.error) return <p role="alert">{detail.error.message}</p>;
  if (!detail.data) return null;
  return (
    <section className="mt-6 rounded-2xl border border-blue-300/25 bg-[#10283d] p-6">
      <h3 className="break-words text-xl font-bold">
        Seguimiento {detail.data.ticket.reference}
      </h3>
      <p className="mt-3">
        {detail.data.ticket.product} ·{" "}
        {warrantyStatusLabels[detail.data.ticket.status]}
      </p>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
        {detail.data.ticket.description}
      </p>
      <button
        type="button"
        className="my-5 text-sm text-blue-300 underline"
        onClick={async () => {
          try {
            setDownloadError("");
            await downloadInvoice(
              await utils.client.warranty.invoice.query({ id })
            );
          } catch {
            setDownloadError("No se pudo descargar la factura.");
          }
        }}
      >
        Descargar mi factura
      </button>
      {downloadError && <p role="alert">{downloadError}</p>}
      <ol className="space-y-4">
        {detail.data.updates.map((u: any) => (
          <li key={u.id} className="border-l-2 border-blue-500/40 pl-4">
            <p className="text-xs text-blue-300">
              {u.author === "admin" ? "IAMET" : "Cliente"} ·{" "}
              {new Date(u.createdAt).toLocaleString("es-MX")}
              {u.status ? ` · ${warrantyStatusLabels[u.status]}` : ""}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {u.message}
            </p>
          </li>
        ))}
      </ol>
      {!["resolved", "rejected"].includes(detail.data.ticket.status) && (
        <form
          className="mt-6 space-y-3"
          onSubmit={e => {
            e.preventDefault();
            reply.mutate({ id, message });
          }}
        >
          <label htmlFor="warranty-reply" className="block text-sm">
            Agregar información al ticket
          </label>
          <textarea
            id="warranty-reply"
            className={inputClass}
            value={message}
            onChange={e => setMessage(e.target.value)}
            minLength={2}
            maxLength={2000}
            required
          />
          <button
            disabled={reply.isPending}
            className="rounded-full bg-blue-600 px-5 py-3 text-sm"
          >
            Enviar comentario
          </button>
          {reply.error && <p role="alert">{reply.error.message}</p>}
        </form>
      )}
    </section>
  );
}
function WarrantyCustomerArea() {
  const session = useStoreSession();
  const token = getStoreToken() ?? "";
  const utils = trpc.useUtils();
  const me = trpc.warranty.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });
  const tickets = trpc.warranty.list.useQuery(undefined, {
    enabled: !!me.data,
    retry: false,
    refetchInterval: 30000,
  });
  const orders = trpc.warranty.orders.useQuery(undefined, {
    enabled: !!me.data,
    retry: false,
    refetchInterval: 30000,
  });
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"tickets" | "orders">("tickets");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [form, setForm] = useState({
    product: "",
    description: "",
    purchaseReference: "",
  });
  const [fileKey, setFileKey] = useState(0);
  const create = trpc.warranty.create.useMutation({
    onSuccess: data => {
      setSelected(data.id);
      setForm({ product: "", description: "", purchaseReference: "" });
      setFile(null);
      setFileKey(k => k + 1);
      utils.warranty.list.invalidate();
    },
  });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!file) return setError("Adjunte la factura de compra.");
    if (file.size > 5 * 1024 * 1024)
      return setError("El archivo debe pesar hasta 5 MB.");
    setReading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error());
        reader.readAsDataURL(file);
      });
      create.mutate({
        ...form,
        invoice: {
          filename: file.name,
          mimeType: file.type as "application/pdf" | "image/jpeg" | "image/png",
          data,
        },
      });
    } catch {
      setError("No se pudo leer la factura. Seleccione el archivo nuevamente.");
    } finally {
      setReading(false);
    }
  }
  if (session.loading || me.isLoading) return <p>Cargando cuenta…</p>;
  if (
    !token ||
    me.error ||
    !me.data ||
    tickets.error?.data?.code === "UNAUTHORIZED"
  )
    return (
      <div className="rounded-2xl border border-blue-300/20 bg-[#10283d] p-8">
        <h2 className="text-2xl font-bold">Ingrese a su cuenta de cliente</h2>
        <p className="mt-4 leading-7 text-slate-300">
          Para registrar una garantía y consultar sus tickets, pedidos y
          órdenes, necesita una cuenta con correo verificado.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/tienda/login?returnTo=/garantias#portal"
            className="rounded-full bg-blue-600 px-6 py-3"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/tienda/login?mode=register&returnTo=/garantias#portal"
            className="rounded-full border border-blue-300/30 px-6 py-3"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    );
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="font-semibold">Hola, {me.data.name}</p>
        <button
          className="text-sm text-blue-300 underline"
          onClick={() => {
            session.logout();
            utils.invalidate();
          }}
        >
          Cerrar sesión
        </button>
      </div>
      <div className="mb-8 flex flex-wrap gap-4">
        <button
          onClick={() => setTab("tickets")}
          aria-pressed={tab === "tickets"}
          className="rounded-full border border-blue-400/30 px-5 py-3"
        >
          Garantías y tickets
        </button>
        <button
          onClick={() => setTab("orders")}
          aria-pressed={tab === "orders"}
          className="rounded-full border border-blue-400/30 px-5 py-3"
        >
          Mis pedidos y órdenes
        </button>
        <Link href="/tienda/perfil" className="px-5 py-3 text-blue-300">
          Mis cotizaciones
        </Link>
      </div>
      {tab === "orders" ? (
        <section>
          <h2 className="text-2xl font-bold">Mis pedidos y órdenes</h2>
          {orders.error ? (
            <p role="alert" className="mt-5">
              No se pudieron cargar sus pedidos. Intente nuevamente.
            </p>
          ) : orders.isLoading ? (
            <p>Cargando…</p>
          ) : !orders.data?.length ? (
            <p className="mt-5 text-slate-300">
              Aún no hay pedidos u órdenes registrados en su cuenta.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.data.map((o: any) => (
                <article
                  key={o.id}
                  className="rounded-xl border border-blue-300/20 p-6"
                >
                  <h3 className="font-bold">
                    {o.kind === "purchase" ? "Pedido" : "Orden de servicio"}{" "}
                    {o.reference}
                  </h3>
                  <p className="mt-3 text-blue-300">
                    {orderStatusLabels[o.status]}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                    {o.description}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <section>
            <h2 className="text-2xl font-bold">Tramitar una garantía</h2>
            <form onSubmit={submit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="w-product" className="mb-2 block text-sm">
                  Producto o equipo *
                </label>
                <input
                  id="w-product"
                  className={inputClass}
                  value={form.product}
                  onChange={e => setForm({ ...form, product: e.target.value })}
                  required
                  minLength={2}
                  maxLength={180}
                />
              </div>
              <div>
                <label htmlFor="w-reference" className="mb-2 block text-sm">
                  Número de factura o pedido (opcional)
                </label>
                <input
                  id="w-reference"
                  className={inputClass}
                  value={form.purchaseReference}
                  onChange={e =>
                    setForm({ ...form, purchaseReference: e.target.value })
                  }
                  maxLength={120}
                />
              </div>
              <div>
                <label htmlFor="w-problem" className="mb-2 block text-sm">
                  Descripción breve del problema *
                </label>
                <textarea
                  id="w-problem"
                  className={inputClass}
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  required
                />
              </div>
              <div>
                <label htmlFor="w-invoice" className="mb-2 block text-sm">
                  Factura de compra *
                </label>
                <input
                  key={fileKey}
                  id="w-invoice"
                  type="file"
                  className={`${inputClass} text-sm`}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
                <p className="mt-2 text-xs text-slate-400">
                  PDF, JPG o PNG · máximo 5 MB. Solo usted y el personal
                  autorizado podrán acceder al archivo.
                </p>
              </div>
              <button
                disabled={create.isPending || reading}
                className="rounded-full bg-blue-600 px-6 py-3 font-semibold disabled:opacity-50"
              >
                {create.isPending || reading
                  ? "Enviando…"
                  : "Registrar ticket de garantía"}
              </button>
              {(error || create.error) && (
                <p role="alert" className="text-sm text-red-300">
                  {error || create.error?.message}
                </p>
              )}
              {create.data && (
                <p role="status" className="text-sm text-emerald-300">
                  Ticket registrado: {create.data.reference}
                </p>
              )}
            </form>
          </section>
          <section>
            <h2 className="text-2xl font-bold">Mis tickets</h2>
            {tickets.error ? (
              <p role="alert" className="mt-5">
                No se pudieron cargar sus tickets. Intente nuevamente.
              </p>
            ) : tickets.isLoading ? (
              <p>Cargando…</p>
            ) : !tickets.data?.length ? (
              <p className="mt-5 text-slate-300">
                Aún no tiene tickets de garantía.
              </p>
            ) : (
              <ul className="mt-5 space-y-3">
                {tickets.data.map((t: any) => (
                  <li key={t.id}>
                    <button
                      onClick={() => setSelected(t.id)}
                      className="w-full rounded-xl border border-blue-300/20 p-5 text-left"
                    >
                      <span className="block break-words font-bold">
                        {t.reference} · {t.product}
                      </span>
                      <span className="mt-2 block text-sm text-blue-300">
                        {warrantyStatusLabels[t.status]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selected && <WarrantyDetail key={selected} id={selected} />}
          </section>
        </div>
      )}
    </>
  );
}
export default function Warranties() {
  useServiceMetadata(
    "Garantías y portal de clientes",
    "Registre y consulte sus tickets de garantía de IAMET. Acceso autenticado a facturas, pedidos y órdenes."
  );
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] px-5 py-16 text-white">
      <div className="mx-auto max-w-[1250px]">
        <p className="text-xs uppercase tracking-widest text-blue-400">
          Atención posventa IAMET
        </p>
        <h1 className="mt-5 text-4xl font-bold">
          Garantías y portal de clientes
        </h1>
        <p className="mt-6 max-w-[850px] leading-8 text-slate-300">
          Registre su solicitud y consulte el seguimiento desde su cuenta. Cada
          caso se revisará conforme a la compra, el producto y las condiciones
          de garantía aplicables.
        </p>
        <ol className="my-10 grid gap-5 md:grid-cols-3">
          {[
            [
              "1 · Cree su cuenta",
              "Regístrese, verifique su correo e inicie sesión.",
            ],
            [
              "2 · Registre su garantía",
              "Adjunte la factura y describa brevemente el problema.",
            ],
            [
              "3 · Consulte el seguimiento",
              "Revise el estado y los mensajes de IAMET, y agregue información cuando sea necesario.",
            ],
          ].map(([title, desc]) => (
            <li
              key={title}
              className="rounded-2xl border border-blue-300/20 bg-[#10283d] p-6"
            >
              <h2 className="font-bold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{desc}</p>
            </li>
          ))}
        </ol>
        <p className="mb-10 text-sm leading-7 text-slate-400">
          Registrar un ticket no implica la aprobación de la garantía. Espere
          las indicaciones de IAMET antes de enviar un equipo.
        </p>
        <section
          id="portal"
          className="scroll-mt-24 border-t border-blue-300/20 pt-10"
        >
          <WarrantyCustomerArea />
        </section>
      </div>
    </div>
  );
}
