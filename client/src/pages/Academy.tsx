import { useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Clock, BarChart2, Award, Search, Filter,
  ArrowRight, CheckCircle2, Users, Star, BookOpen, Loader2, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const LEVEL_COLORS: Record<string, string> = {
  basico: "oklch(0.68 0.18 160)",
  intermedio: "oklch(0.70 0.22 280)",
  avanzado: "oklch(0.62 0.22 25)",
};

const LEVEL_LABELS: Record<string, string> = {
  basico: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const VERTICAL_LABELS: Record<string, string> = {
  infraestructura: "Infraestructura",
  seguridad: "Seguridad",
  rfid: "RFID",
  "software-ia": "Software & IA",
  "servicios-administrados": "Servicios",
  educacion: "Educación",
  compliance: "Compliance",
};

const CERTIFICATIONS = [
  { name: "Cisco CCNA", logo: "🔵", desc: "Redes y switching empresarial" },
  { name: "Microsoft Azure", logo: "🔷", desc: "Nube y servicios cloud" },
  { name: "Genetec Security", logo: "🟢", desc: "Plataformas de seguridad VMS" },
  { name: "Axis Communications", logo: "🔴", desc: "Cámaras y analítica de video" },
  { name: "Zebra Technologies", logo: "⚫", desc: "RFID y movilidad empresarial" },
  { name: "CompTIA Security+", logo: "🟡", desc: "Ciberseguridad fundamental" },
];

const BENEFITS = [
  "Instructores certificados por fabricantes líderes",
  "Laboratorios prácticos con equipos reales",
  "Material didáctico incluido",
  "Certificado de participación IAMET",
  "Acceso a comunidad de egresados",
  "Soporte post-capacitación por 30 días",
];

export default function Academy() {
  const [search, setSearch] = useState("");
  const [filterVertical, setFilterVertical] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [enrollCourse, setEnrollCourse] = useState<number | null>(null);
  const [enrollForm, setEnrollForm] = useState({ name: "", email: "", company: "", phone: "" });
  const [enrolled, setEnrolled] = useState(false);

  const { data: allCourses = [], isLoading } = trpc.academy.listCourses.useQuery(
    filterVertical ? { verticalSlug: filterVertical } : undefined
  );

  // Client-side filter for level and search
  const courses = allCourses.filter((c) => {
    const matchLevel = !filterLevel || c.level === filterLevel;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchLevel && matchSearch;
  });

  const enrollMutation = trpc.academy.enroll.useMutation({
    onSuccess: () => setEnrolled(true),
  });

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollCourse) return;
    enrollMutation.mutate({ courseId: enrollCourse, ...enrollForm });
  };

  const selectedCourse = enrollCourse !== null ? allCourses.find((c) => c.id === enrollCourse) : undefined;

  return (
    <div className="min-h-screen bg-[var(--color-iamet-bg)]">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-v-edu)]" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-[var(--color-v-edu)] opacity-5 blur-3xl" />
        <div className="container relative z-10 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ borderColor: "var(--color-v-edu)", color: "var(--color-v-edu)", backgroundColor: "oklch(0.75 0.18 75 / 0.1)" }}>
              <GraduationCap className="w-3.5 h-3.5" />
              IAMET Academy
            </span>
            <h1 className="font-display text-5xl lg:text-6xl font-800 text-[var(--color-iamet-text)]">
              Capacitación tecnológica<br />
              <span className="gradient-text">de nivel enterprise</span>
            </h1>
            <p className="text-[var(--color-iamet-text-muted)] max-w-xl mx-auto mt-4 text-lg">
              Cursos especializados, certificaciones internacionales y talleres prácticos
              impartidos por expertos certificados por los fabricantes líderes.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-8 pt-4"
          >
            {[
              { icon: BookOpen, value: "20+", label: "Cursos disponibles" },
              { icon: Users, value: "500+", label: "Alumnos capacitados" },
              { icon: Award, value: "12", label: "Certificaciones" },
              { icon: Star, value: "4.9/5", label: "Calificación promedio" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Icon className="w-4 h-4 text-[var(--color-v-edu)]" />
                  <span className="font-display text-xl font-800 text-[var(--color-iamet-text)]">{value}</span>
                </div>
                <p className="text-xs text-[var(--color-iamet-text-subtle)]">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Certifications ────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-[var(--color-iamet-border-subtle)]">
        <div className="container">
          <p className="text-xs text-[var(--color-iamet-text-subtle)] uppercase tracking-widest text-center mb-6">
            Preparamos para certificaciones de
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {CERTIFICATIONS.map((cert) => (
              <div key={cert.name} className="neumorphic rounded-xl px-4 py-3 flex items-center gap-2.5">
                <span className="text-lg">{cert.logo}</span>
                <div>
                  <p className="text-xs font-semibold text-[var(--color-iamet-text)]">{cert.name}</p>
                  <p className="text-[10px] text-[var(--color-iamet-text-subtle)]">{cert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Courses Catalog ───────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="container">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-64 space-y-4 flex-shrink-0">
              <div className="neumorphic rounded-2xl p-5 space-y-4">
                <h3 className="font-display font-700 text-[var(--color-iamet-text)] text-sm">Filtrar cursos</h3>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-iamet-text-subtle)]" />
                  <input
                    type="text"
                    placeholder="Buscar curso..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full neumorphic-inset rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] outline-none focus:ring-1 focus:ring-[var(--color-iamet-accent)] bg-transparent"
                  />
                </div>

                {/* Vertical Filter */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--color-iamet-text-muted)] flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" /> Vertical
                  </p>
                  <div className="space-y-1">
                    {["", ...Object.keys(VERTICAL_LABELS)].map((v) => (
                      <button
                        key={v}
                        onClick={() => setFilterVertical(v)}
                        className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${filterVertical === v ? "bg-[var(--color-iamet-accent-muted)] text-[var(--color-iamet-accent)]" : "text-[var(--color-iamet-text-muted)] hover:bg-[var(--color-iamet-surface-2)]"}`}
                      >
                        {v === "" ? "Todas las verticales" : VERTICAL_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level Filter */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--color-iamet-text-muted)]">Nivel</p>
                  <div className="space-y-1">
                    {["", "basico", "intermedio", "avanzado"].map((l) => (
                      <button
                        key={l}
                        onClick={() => setFilterLevel(l)}
                        className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${filterLevel === l ? "bg-[var(--color-iamet-accent-muted)] text-[var(--color-iamet-accent)]" : "text-[var(--color-iamet-text-muted)] hover:bg-[var(--color-iamet-surface-2)]"}`}
                      >
                        {l === "" ? "Todos los niveles" : LEVEL_LABELS[l]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--color-iamet-accent)]" />
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <BookOpen className="w-10 h-10 text-[var(--color-iamet-text-subtle)] mx-auto" />
                  <p className="text-[var(--color-iamet-text-muted)]">No se encontraron cursos con esos filtros.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {courses.map((course, i) => {
                    const levelColor = LEVEL_COLORS[course.level] ?? "var(--color-iamet-accent)";
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        className="neumorphic neumorphic-hover rounded-2xl p-5 flex flex-col gap-4 group"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <span
                            className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: `${levelColor}15`, color: levelColor }}
                          >
                            {LEVEL_LABELS[course.level] ?? course.level}
                          </span>
                          {course.certification && (
                            <Award className="w-4 h-4 text-[var(--color-v-edu)]" />
                          )}
                        </div>

                        {/* Title */}
                        <div className="flex-1">
                          <h3 className="font-display font-700 text-[var(--color-iamet-text)] text-sm leading-tight mb-1.5">
                            {course.title}
                          </h3>
                          <p className="text-xs text-[var(--color-iamet-text-subtle)] leading-relaxed line-clamp-2">
                            {course.description}
                          </p>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-xs text-[var(--color-iamet-text-subtle)]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {course.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart2 className="w-3.5 h-3.5" />
                            {(course.verticalSlug ? VERTICAL_LABELS[course.verticalSlug] : null) ?? course.verticalSlug}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-iamet-border-subtle)]">
                          <div>
                            {course.price ? (
                              <span className="font-display font-700 text-[var(--color-iamet-text)] text-sm">
                                ${Number(course.price).toLocaleString("es-MX")} MXN
                              </span>
                            ) : (
                              <span className="text-xs text-[var(--color-iamet-text-subtle)]">Precio a consultar</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => { setEnrollCourse(course.id); setEnrolled(false); }}
                            className="text-white text-xs btn-press"
                            style={{ backgroundColor: "var(--color-v-edu)" }}
                          >
                            Inscribirse
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[var(--color-iamet-bg-secondary)]">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="font-display text-3xl font-800 text-[var(--color-iamet-text)]">
                ¿Por qué capacitarte con IAMET?
              </h2>
              <div className="space-y-3">
                {BENEFITS.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-v-edu)] flex-shrink-0" />
                    <span className="text-sm text-[var(--color-iamet-text-muted)]">{b}</span>
                  </div>
                ))}
              </div>
              <Link href="/tech-advisor">
                <Button className="btn-press" style={{ backgroundColor: "var(--color-v-edu)" }}>
                  Recibir recomendación de cursos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="neumorphic rounded-2xl p-8 space-y-4">
              <h3 className="font-display text-xl font-700 text-[var(--color-iamet-text)]">
                Programa corporativo
              </h3>
              <p className="text-sm text-[var(--color-iamet-text-muted)]">
                Diseñamos programas de capacitación a medida para equipos de TI, operaciones
                y directivos. Incluye diagnóstico de brechas, plan de estudios personalizado
                y seguimiento de resultados.
              </p>
              <div className="space-y-2">
                {["Grupos desde 5 personas", "Modalidad presencial o virtual", "Horarios flexibles", "Facturación empresarial"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-v-edu)]" />
                    <span className="text-xs text-[var(--color-iamet-text-muted)]">{item}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] bg-transparent btn-press"
                onClick={() => window.location.href = "mailto:academy@iamet.mx"}
              >
                Solicitar programa corporativo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Enrollment Modal ──────────────────────────────────────────────── */}
      {enrollCourse !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0 0 0 / 0.7)" }}
          onClick={() => setEnrollCourse(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="neumorphic rounded-2xl p-6 w-full max-w-md space-y-5"
          >
            {enrolled ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-[oklch(0.68_0.18_160_/_0.2)] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-[var(--color-v-edu)]" />
                </div>
                <h3 className="font-display text-xl font-700 text-[var(--color-iamet-text)]">¡Inscripción recibida!</h3>
                <p className="text-sm text-[var(--color-iamet-text-muted)]">
                  Un asesor de IAMET Academy se pondrá en contacto contigo en menos de 24 horas.
                </p>
                <Button onClick={() => setEnrollCourse(null)} className="btn-press" style={{ backgroundColor: "var(--color-v-edu)" }}>
                  Cerrar
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-display text-xl font-700 text-[var(--color-iamet-text)]">Inscripción al curso</h3>
                  {selectedCourse && (
                    <p className="text-sm text-[var(--color-iamet-text-muted)] mt-1">{selectedCourse.title}</p>
                  )}
                </div>
                <form onSubmit={handleEnroll} className="space-y-3">
                  {[
                    { field: "name", placeholder: "Nombre completo", type: "text" },
                    { field: "email", placeholder: "correo@empresa.com", type: "email" },
                    { field: "company", placeholder: "Empresa", type: "text" },
                    { field: "phone", placeholder: "Teléfono (opcional)", type: "tel" },
                  ].map(({ field, placeholder, type }) => (
                    <input
                      key={field}
                      type={type}
                      placeholder={placeholder}
                      required={field !== "phone"}
                      value={enrollForm[field as keyof typeof enrollForm]}
                      onChange={(e) => setEnrollForm((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full neumorphic-inset rounded-xl px-4 py-2.5 text-sm text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] outline-none focus:ring-1 focus:ring-[var(--color-iamet-accent)] bg-transparent"
                    />
                  ))}
                  <Button
                    type="submit"
                    disabled={enrollMutation.isPending}
                    className="w-full text-white btn-press"
                    style={{ backgroundColor: "var(--color-v-edu)" }}
                  >
                    {enrollMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" />Confirmar inscripción</>
                    )}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
