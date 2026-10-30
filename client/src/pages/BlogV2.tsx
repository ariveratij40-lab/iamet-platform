import { Link, useParams } from "wouter";
import { useState } from "react";
import { businessServices } from "@/components/v2/corporateData";
import { useServiceMetadata } from "@/components/v2/ServiceConversionV2";
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
export function BlogIndexV2() {
  const [selected, setSelected] = useState("");
  useServiceMetadata(
    "Blog de soluciones",
    "Guías y consejos sobre infraestructura, seguridad, energía, RFID, aplicaciones y servicios administrados."
  );
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] px-5 py-16 text-white">
      <div className="mx-auto max-w-[1250px]">
        <p className="text-xs uppercase tracking-widest text-blue-400">
          Conocimiento para su operación
        </p>
        <h1 className="mt-5 text-4xl font-bold">Blog de soluciones IAMET</h1>
        <p className="mt-5 max-w-[750px] leading-8 text-slate-300">
          Guías y consejos para preparar sus proyectos de tecnología. Explore
          los temas por solución.
        </p>
        <div className="mt-8">
          <label htmlFor="blog-solution" className="mb-3 block text-sm">
            Filtrar por solución
          </label>
          <select
            id="blog-solution"
            className="w-full max-w-[500px] rounded-xl border border-blue-300/25 bg-[#10283d] p-3"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            <option value="">Todas las soluciones</option>
            {businessServices.map(s => (
              <option value={s.slug} key={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts
            .filter(p => !selected || p.service === selected)
            .map(p => (
              <article
                key={p.slug}
                className="flex flex-col rounded-2xl border border-blue-300/20 bg-[#10283d] p-7"
              >
                <p className="text-xs uppercase tracking-widest text-blue-400">
                  Consejos ·{" "}
                  {businessServices.find(s => s.slug === p.service)?.name}
                </p>
                <h2 className="mt-4 text-xl font-bold">
                  <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                </h2>
                <p className="mb-6 mt-4 text-sm leading-7 text-slate-300">
                  {p.intro}
                </p>
                <Link
                  className="mt-auto text-sm font-semibold text-blue-300"
                  href={`/blog/${p.slug}`}
                >
                  Leer guía →
                </Link>
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}
export function BlogPostV2() {
  const { slug } = useParams();
  const post = posts.find(p => p.slug === slug);
  useServiceMetadata(
    post?.title ?? "Artículo no encontrado",
    post?.intro ?? ""
  );
  if (!post)
    return (
      <div className="p-16">
        <h1>Artículo no encontrado</h1>
        <Link href="/blog">Volver al blog</Link>
      </div>
    );
  return (
    <div className="iamet-reference-home min-h-screen bg-[#061524] px-5 py-16 text-white">
      <article className="mx-auto max-w-[850px]">
        <Link className="text-sm text-blue-300" href="/blog">
          ← Blog IAMET
        </Link>
        <p className="mt-8 text-xs uppercase tracking-widest text-blue-400">
          Guía práctica ·{" "}
          {businessServices.find(s => s.slug === post.service)?.name}
        </p>
        <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
          {post.title}
        </h1>
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
            Comparta el contexto con IAMET para revisar el alcance de la
            solución.
          </p>
          <Link
            href={`/cotizacion?solucion=${post.service}`}
            className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 font-semibold"
          >
            Solicitar una propuesta
          </Link>
        </div>
      </article>
    </div>
  );
}
