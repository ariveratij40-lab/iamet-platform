import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import LeadForm from "@/components/LeadForm";

export default function Contact() {
  return (
    <div className="min-h-screen bg-[var(--color-iamet-bg)] pt-24 pb-16">
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-4"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[var(--color-iamet-accent)] bg-[var(--color-iamet-accent-muted)] px-3 py-1.5 rounded-full">
            <Mail className="w-3.5 h-3.5" />
            Contacto
          </span>

          <h1 className="font-display text-4xl md:text-5xl font-800 text-[var(--color-iamet-text)]">
            Hablemos de su{" "}
            <span className="text-gradient">proyecto</span>
          </h1>

          <p className="text-lg text-[var(--color-iamet-text-muted)] max-w-xl mx-auto">
            Cuéntenos qué necesita resolver. Nuestro equipo revisará su solicitud
            para dirigirla con el especialista adecuado.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <LeadForm source="form" />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="neumorphic rounded-2xl p-6 space-y-5">
              <h3 className="font-display font-700 text-[var(--color-iamet-text)]">
                Información de contacto
              </h3>

              <a
                href="mailto:contacto@iamet.mx"
                className="flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--color-iamet-accent-muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-[var(--color-iamet-accent)]" />
                </div>

                <div>
                  <p className="text-xs text-[var(--color-iamet-text-subtle)]">
                    Email
                  </p>
                  <p className="text-sm text-[var(--color-iamet-text-muted)] font-medium">
                    contacto@iamet.mx
                  </p>
                </div>
              </a>
            </div>

            <div className="neumorphic rounded-2xl p-6 space-y-3">
              <h4 className="font-semibold text-sm text-[var(--color-iamet-text)]">
                Atención a proyectos
              </h4>

              <p className="text-sm leading-6 text-[var(--color-iamet-text-muted)]">
                Revisamos su necesidad para canalizarla con el especialista
                adecuado.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
