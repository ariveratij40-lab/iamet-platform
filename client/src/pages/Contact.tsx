import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle2, Building2, User, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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
            Hablemos de tu{" "}
            <span className="text-gradient">proyecto</span>
          </h1>
          <p className="text-lg text-[var(--color-iamet-text-muted)] max-w-xl mx-auto">
            Cuéntanos tu desafío tecnológico. Nuestro equipo te contactará en menos de 24 horas con una propuesta personalizada.
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
              <h3 className="font-display font-700 text-[var(--color-iamet-text)]">Información de contacto</h3>
              {[
                { icon: Mail, label: "Email", value: "contacto@iamet.mx" },
                { icon: Phone, label: "Teléfono", value: "+52 (55) 1234-5678" },
                { icon: MapPin, label: "Ubicación", value: "Ciudad de México, México" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-iamet-accent-muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[var(--color-iamet-accent)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-iamet-text-subtle)]">{label}</p>
                    <p className="text-sm text-[var(--color-iamet-text-muted)] font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="neumorphic rounded-2xl p-6 space-y-3">
              <h4 className="font-semibold text-sm text-[var(--color-iamet-text)]">Tiempo de respuesta</h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[oklch(0.68_0.18_160)] animate-pulse" />
                <span className="text-xs text-[var(--color-iamet-text-muted)]">Respuesta en menos de 24 horas</span>
              </div>
              <p className="text-xs text-[var(--color-iamet-text-subtle)]">
                Lunes a Viernes, 9:00 AM – 7:00 PM (CST)
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
