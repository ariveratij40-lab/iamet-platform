import { Link, useParams } from "wouter";
import { businessServices } from "@/components/v2/corporateData";
import { useServiceMetadata } from "@/components/v2/ServiceConversionV2";
import { trpc } from "@/lib/trpc";

// Guías por solución (contenido editorial fijo de IAMET). Se conservan bajo el
// blog diario y como respaldo para que sus enlaces no se rompan.
const posts = [
  {
    slug: "preparar-proyecto-cableado",
    service: "infraestructura",
    title:
      "Qué preparar antes de cotizar una instalación de cableado estructurado",
    intro:
      "Un alcance claro ayuda a comparar propuestas y a definir qué debe entregar el integrador.",
    sections: [
      [
        "Documente los espacios",
        "Identifique los puestos de trabajo, cuartos de telecomunicaciones y recorridos disponibles. Un plano y una estimación de puntos de red permiten empezar la revisión técnica; no sustituyen el levantamiento de las condiciones del sitio.",
      ],
      [
        "Defina los entregables",
        "Conviene acordar identificación de conexiones, documentación de la instalación y pruebas de los enlaces. Si requiere certificación, incluya en el alcance los reportes y los criterios que se utilizarán para revisar los resultados.",
      ],
    ],
  },
  {
    slug: "planear-cctv-empresarial",
    service: "cctv",
    title: "CCTV empresarial: empiece por lo que necesita observar",
    intro:
      "La cantidad de cámaras es solo una parte del diseño de videoseguridad.",
    sections: [
      [
        "Describa el objetivo de cada área",
        "Indique qué necesita observar en entradas, perímetros y zonas de operación. El diseño debe revisar distancias, iluminación, obstáculos y condiciones del espacio antes de seleccionar cámaras.",
      ],
      [
        "Acuerde la administración del video",
        "Defina quién consultará las grabaciones, los permisos de acceso y las necesidades de conservación. Estos datos orientan la revisión de almacenamiento, conectividad y administración del sistema.",
      ],
    ],
  },
  {
    slug: "organizar-control-acceso",
    service: "control-acceso",
    title: "Cómo ordenar los requerimientos de un sistema de control de acceso",
    intro:
      "Definir personas, áreas y horarios facilita el diseño de la solución.",
    sections: [
      [
        "Empiece con una matriz de acceso",
        "Liste las áreas y los grupos de usuarios que requieren entrar. Distinga colaboradores, visitantes y proveedores, y documente los horarios y excepciones que deben revisarse.",
      ],
      [
        "Revise la operación de las puertas",
        "El levantamiento debe considerar las condiciones físicas, los dispositivos existentes y la forma de administrar las credenciales. Los requisitos de seguridad y evacuación deben revisarse con los responsables del inmueble.",
      ],
    ],
  },
  {
    slug: "preparar-respaldo-energia",
    service: "energia",
    title: "Qué información reunir para un proyecto de respaldo de energía",
    intro:
      "La selección de un UPS requiere revisar los equipos y el comportamiento esperado de la operación.",
    sections: [
      [
        "Identifique las cargas",
        "Prepare un inventario de los equipos que requieren respaldo y la información eléctrica disponible. Separe las cargas críticas y comunique las ampliaciones previstas.",
      ],
      [
        "Explique la autonomía requerida",
        "Indique qué necesita que suceda durante una interrupción: mantener la operación, permitir un apagado ordenado o cubrir una transición. La revisión técnica debe relacionar ese objetivo con las condiciones del sitio.",
      ],
    ],
  },
  {
    slug: "piloto-rfid-inventario",
    service: "rfid",
    title: "Cómo preparar un piloto RFID para inventarios",
    intro:
      "Un piloto permite evaluar el proceso con los artículos y condiciones reales del almacén.",
    sections: [
      [
        "Elija un proceso concreto",
        "Defina si quiere contar inventario, registrar entradas y salidas o localizar activos. Seleccione una muestra representativa y documente cómo se realiza actualmente el trabajo.",
      ],
      [
        "Acuerde cómo se evaluará",
        "Prepare los datos de los artículos y el flujo que desea registrar. Compare los resultados del piloto con el proceso actual y documente excepciones, condiciones de lectura e integración de la información.",
      ],
    ],
  },
  {
    slug: "definir-aplicacion-empresarial",
    service: "software-ia",
    title: "Antes de desarrollar una aplicación: describa el proceso",
    intro:
      "Un requerimiento útil explica el problema operativo y cómo se evaluará la solución.",
    sections: [
      [
        "Documente usuarios y tareas",
        "Describa quién utilizará la aplicación, qué información necesita y qué pasos realiza hoy. Incluya las excepciones del proceso y los sistemas con los que se debe intercambiar información.",
      ],
      [
        "Priorice una primera entrega",
        "Separe lo indispensable de las mejoras posteriores. Acuerde qué funciones se revisarán, con qué ejemplos se probarán y quién validará que la aplicación atiende la necesidad.",
      ],
    ],
  },
  {
    slug: "definir-poliza-mantenimiento",
    service: "polizas-servicios",
    title: "Qué debe quedar definido en una póliza de servicios tecnológicos",
    intro:
      "El alcance y las responsabilidades deben poder entenderse antes de contratar el servicio.",
    sections: [
      [
        "Identifique los activos cubiertos",
        "Prepare un inventario de equipos, instalaciones y ubicaciones que deben incluirse. Distinga el mantenimiento preventivo, la atención correctiva y las actividades que requieren una cotización adicional.",
      ],
      [
        "Acuerde la atención y los reportes",
        "Defina canales, horarios, prioridades y escalamiento de incidentes. Los tiempos de atención y compromisos deben establecerse en la propuesta y el contrato, junto con los reportes de actividades.",
      ],
    ],
  },
];

function fechaCorta(iso: string | Date): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

export function BlogIndexV2() {
  useServiceMetadata(
    "Blog IAMET — tecnología, cultura y curiosidades",
    "Lo más interesante de tecnología, videojuegos, cine y ciencia, explicado fácil. Más guías de soluciones para su operación."
  );
  const diario = trpc.blog.publicados.useQuery();
  const articulos = diario.data ?? [];
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] px-5 py-16 text-white">
      <div className="mx-auto max-w-[1250px]">
        <p className="text-xs uppercase tracking-widest text-blue-400">Lo que se habla hoy</p>
        <h1 className="mt-5 text-4xl font-bold">Blog IAMET</h1>
        <p className="mt-5 max-w-[750px] leading-8 text-slate-300">
          Tecnología, videojuegos, cine y ciencia, explicados fácil. Un vistazo
          rápido a lo que todo el mundo comenta.
        </p>

        {articulos.length > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articulos.map(p => (
              <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-blue-300/20 bg-[#10283d]">
                {p.imageUrl && (
                  <Link href={`/blog/${p.slug}`}>
                    <img src={p.imageUrl} alt={p.title} loading="lazy"
                      className="h-44 w-full object-cover" />
                  </Link>
                )}
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs uppercase tracking-widest text-blue-400">{fechaCorta(p.createdAt)}</p>
                  <h2 className="mt-3 text-lg font-bold leading-snug">
                    <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                  </h2>
                  <p className="mb-5 mt-3 text-sm leading-7 text-slate-300">{p.intro}</p>
                  <Link className="mt-auto text-sm font-semibold text-blue-300" href={`/blog/${p.slug}`}>
                    Leer más →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {diario.isLoading && <p className="mt-10 text-slate-400">Cargando artículos…</p>}

        <h2 className="mt-20 text-2xl font-bold">Guías por solución</h2>
        <p className="mt-3 max-w-[750px] leading-8 text-slate-300">
          Consejos prácticos para preparar sus proyectos de tecnología.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map(p => (
            <article key={p.slug} className="flex flex-col rounded-2xl border border-blue-300/20 bg-[#10283d] p-7">
              <p className="text-xs uppercase tracking-widest text-blue-400">
                Guía · {businessServices.find(s => s.slug === p.service)?.name}
              </p>
              <h3 className="mt-4 text-xl font-bold">
                <Link href={`/blog/${p.slug}`}>{p.title}</Link>
              </h3>
              <p className="mb-6 mt-4 text-sm leading-7 text-slate-300">{p.intro}</p>
              <Link className="mt-auto text-sm font-semibold text-blue-300" href={`/blog/${p.slug}`}>
                Leer guía →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaginaGuia({ post }: { post: (typeof posts)[number] }) {
  useServiceMetadata(post.title, post.intro);
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] px-5 py-16 text-white">
      <article className="mx-auto max-w-[850px]">
        <Link className="text-sm text-blue-300" href="/blog">← Blog IAMET</Link>
        <p className="mt-8 text-xs uppercase tracking-widest text-blue-400">
          Guía práctica · {businessServices.find(s => s.slug === post.service)?.name}
        </p>
        <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">{post.title}</h1>
        <p className="mt-7 text-xl leading-9 text-slate-300">{post.intro}</p>
        {post.sections.map(([title, text]) => (
          <section key={title} className="mt-10">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="mt-5 leading-9 text-slate-300">{text}</p>
          </section>
        ))}
        <div className="mt-12 rounded-2xl border border-blue-300/20 bg-[#10283d] p-7">
          <h2 className="text-xl font-bold">¿Está preparando un proyecto?</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Comparta el contexto con IAMET para revisar el alcance de la solución.
          </p>
          <Link href={`/cotizacion?solucion=${post.service}`}
            className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 font-semibold">
            Solicitar una propuesta
          </Link>
        </div>
      </article>
    </div>
  );
}

export function BlogPostV2() {
  const { slug } = useParams();
  const guia = posts.find(p => p.slug === slug);
  // Las guías fijas se sirven directo; los artículos del blog diario, de la base.
  const q = trpc.blog.porSlug.useQuery({ slug: slug ?? "" }, { enabled: !guia && !!slug, retry: false });
  const post = q.data;
  useServiceMetadata(post?.title ?? guia?.title ?? "Artículo", post?.metaDescription ?? guia?.intro ?? "");

  if (guia) return <PaginaGuia post={guia} />;
  if (q.isLoading)
    return <div className="min-h-screen bg-[#061524] p-16 text-white"><p className="text-slate-400">Cargando…</p></div>;
  if (!post)
    return (
      <div className="min-h-screen bg-[#061524] p-16 text-white">
        <h1 className="text-2xl font-bold">Artículo no encontrado</h1>
        <Link className="mt-4 inline-block text-blue-300" href="/blog">← Volver al blog</Link>
      </div>
    );

  const parrafos = post.body.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] px-5 py-16 text-white">
      <article className="mx-auto max-w-[850px]">
        <Link className="text-sm text-blue-300" href="/blog">← Blog IAMET</Link>
        <p className="mt-8 text-xs uppercase tracking-widest text-blue-400">{fechaCorta(post.createdAt)}</p>
        <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">{post.title}</h1>
        {post.intro && <p className="mt-7 text-xl leading-9 text-slate-300">{post.intro}</p>}
        {post.imageUrl && (
          <figure className="mt-10">
            <img src={post.imageUrl} alt={post.title} className="w-full rounded-2xl" />
            {post.imageCredit && (
              <figcaption className="mt-2 text-xs text-slate-500">
                {post.imageCreditUrl
                  ? <a href={post.imageCreditUrl} target="_blank" rel="noreferrer" className="underline">{post.imageCredit}</a>
                  : post.imageCredit}
              </figcaption>
            )}
          </figure>
        )}
        {parrafos.map((p, i) => (
          <p key={i} className="mt-6 leading-9 text-slate-300">{p}</p>
        ))}
        <div className="mt-12 rounded-2xl border border-blue-300/20 bg-[#10283d] p-7">
          <h2 className="text-xl font-bold">Tecnología para su empresa</h2>
          <p className="mt-4 leading-7 text-slate-300">
            En IAMET integramos soluciones de tecnología para empresas. Conozca lo que hacemos.
          </p>
          <Link href="/soluciones" className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 font-semibold">
            Ver soluciones
          </Link>
        </div>
      </article>
    </div>
  );
}
