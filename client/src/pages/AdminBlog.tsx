import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import AdminWorkspaceV2 from "@/components/v2/AdminWorkspaceV2";

const ESTADO: Record<string, { txt: string; cls: string }> = {
  published: { txt: "Publicado", cls: "bg-emerald-500/15 text-emerald-300" },
  draft: { txt: "Borrador", cls: "bg-amber-500/15 text-amber-300" },
  archived: { txt: "Archivado", cls: "bg-slate-500/15 text-slate-400" },
};

export default function AdminBlog() {
  const utils = trpc.useUtils();
  const lista = trpc.blog.adminListar.useQuery();
  const [editando, setEditando] = useState<number | null>(null);
  const [aviso, setAviso] = useState("");

  const auto = trpc.blog.autoEstado.useQuery();
  const setAuto = trpc.blog.setAuto.useMutation({ onSuccess: () => utils.blog.autoEstado.invalidate() });
  const refrescar = () => {
    utils.blog.adminListar.invalidate();
    utils.blog.publicados.invalidate();
  };
  const generar = trpc.blog.generarAhora.useMutation({
    onSuccess: r => {
      setAviso(r.ok ? `Publicado: “${r.titulo}”${r.conImagen ? " (con foto)" : ""}` : `No se publicó: ${r.motivo}`);
      refrescar();
    },
    onError: e => setAviso(`Error: ${e.message}`),
  });
  const editar = trpc.blog.editar.useMutation({ onSuccess: () => { setEditando(null); refrescar(); } });
  const borrar = trpc.blog.borrar.useMutation({ onSuccess: refrescar });

  const posts = lista.data ?? [];

  return (
    <AdminWorkspaceV2>
      <div className="mx-auto max-w-5xl px-5 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Blog automático</h1>
            <p className="mt-1 text-sm text-slate-400">
              La IA publica un artículo al día. Puedes editarlo, despublicarlo o borrarlo.
            </p>
          </div>
          <button
            onClick={() => { setAviso(""); generar.mutate(); }}
            disabled={generar.isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-40"
          >
            {generar.isPending ? "Generando…" : "Generar artículo ahora"}
          </button>
        </div>

        {/* Interruptor de la publicación diaria automática */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1829] px-5 py-4">
          <div>
            <p className="font-semibold">Publicación diaria automática</p>
            <p className="mt-0.5 text-sm text-slate-400">
              {auto.data?.encendido
                ? "Encendida: cada día se publica un artículo solo."
                : "Apagada: no se publica nada automáticamente. El botón de arriba sigue funcionando."}
            </p>
          </div>
          <button
            onClick={() => setAuto.mutate({ encendido: !auto.data?.encendido })}
            disabled={auto.isLoading || setAuto.isPending}
            aria-pressed={!!auto.data?.encendido}
            className={`relative h-7 w-14 flex-shrink-0 rounded-full transition disabled:opacity-40 ${
              auto.data?.encendido ? "bg-emerald-500" : "bg-slate-600"
            }`}
          >
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${
              auto.data?.encendido ? "left-7" : "left-0.5"
            }`} />
          </button>
        </div>

        {aviso && <p role="status" className="mt-4 rounded-lg bg-white/5 px-4 py-2 text-sm text-slate-300">{aviso}</p>}

        {lista.isLoading && <p className="mt-8 text-slate-400">Cargando…</p>}

        <div className="mt-8 space-y-4">
          {posts.map(p => (
            <article key={p.id} className="rounded-xl border border-white/10 bg-[#0b1829] p-5">
              {editando === p.id ? (
                <EditorPost post={p} guardando={editar.isPending}
                  onGuardar={cambios => editar.mutate({ id: p.id, ...cambios })}
                  onCancelar={() => setEditando(null)} />
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO[p.status]?.cls}`}>
                        {ESTADO[p.status]?.txt ?? p.status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString("es-MX")} · {p.source === "ai" ? "IA" : "manual"}
                      </span>
                    </div>
                    <h2 className="mt-2 font-semibold">
                      <Link href={`/blog/${p.slug}`} className="hover:underline">{p.title}</Link>
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-400">{p.intro}</p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2 text-sm">
                    <button onClick={() => setEditando(p.id)} className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20">
                      Editar
                    </button>
                    {p.status === "published" ? (
                      <button onClick={() => editar.mutate({ id: p.id, status: "archived" })}
                        className="rounded-md bg-white/10 px-3 py-1.5 hover:bg-white/20">Despublicar</button>
                    ) : (
                      <button onClick={() => editar.mutate({ id: p.id, status: "published" })}
                        className="rounded-md bg-emerald-600/70 px-3 py-1.5 hover:bg-emerald-600">Publicar</button>
                    )}
                    <button
                      onClick={() => { if (confirm(`¿Borrar “${p.title}”? No se puede deshacer.`)) borrar.mutate({ id: p.id }); }}
                      className="rounded-md bg-red-600/70 px-3 py-1.5 hover:bg-red-600">Borrar</button>
                  </div>
                </div>
              )}
            </article>
          ))}
          {!lista.isLoading && posts.length === 0 && (
            <p className="text-sm text-slate-400">Aún no hay artículos. Usa “Generar artículo ahora”.</p>
          )}
        </div>
      </div>
    </AdminWorkspaceV2>
  );
}

function EditorPost({ post, guardando, onGuardar, onCancelar }: {
  post: { title: string; intro: string; body: string };
  guardando: boolean;
  onGuardar: (c: { title: string; intro: string; body: string }) => void;
  onCancelar: () => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [intro, setIntro] = useState(post.intro);
  const [body, setBody] = useState(post.body);
  const campo = "w-full rounded-lg border border-white/15 bg-[#07111f] p-2 text-sm";
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-slate-400">Título</label>
        <input className={campo} value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Entradilla</label>
        <input className={campo} value={intro} onChange={e => setIntro(e.target.value)} maxLength={320} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Cuerpo (un párrafo por bloque, separados por una línea en blanco)</label>
        <textarea className={`${campo} min-h-[180px]`} value={body} onChange={e => setBody(e.target.value)} />
      </div>
      <div className="flex gap-2 text-sm">
        <button onClick={() => onGuardar({ title, intro, body })} disabled={guardando}
          className="rounded-md bg-blue-600 px-4 py-1.5 font-semibold hover:bg-blue-500 disabled:opacity-40">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button onClick={onCancelar} className="rounded-md bg-white/10 px-4 py-1.5 hover:bg-white/20">Cancelar</button>
      </div>
    </div>
  );
}
