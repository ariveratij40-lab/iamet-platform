import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, CheckCircle2, XCircle, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Parse query string manually since wouter's useSearch returns the raw string
function getQueryParam(search: string, key: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.get(key);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

type Step = "loading" | "confirm" | "cancelling" | "success" | "error";

export default function CancelarReunion() {
  const search = useSearch();
  const token = getQueryParam(search, "token");

  const [step, setStep] = useState<Step>("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [meeting, setMeeting] = useState<{
    clientName: string;
    clientEmail: string;
    topic: string;
    date: string;
    startTime: string;
    endTime: string;
    engineerName: string;
    status: string;
  } | null>(null);

  // Fetch meeting details by token
  const { data: meetingData, isLoading, error } = trpc.calendar.getMeetingByToken.useQuery(
    { cancelToken: token ?? "" },
    { enabled: !!token, retry: false }
  );

  useEffect(() => {
    if (!token) {
      setStep("error");
      setErrorMsg("No se proporcionó un token de cancelación válido.");
      return;
    }
    if (isLoading) {
      setStep("loading");
      return;
    }
    if (error || !meetingData?.meeting) {
      setStep("error");
      setErrorMsg("No se encontró la reunión o el enlace ya fue utilizado.");
      return;
    }
    if (meetingData.meeting.status === "cancelled") {
      setStep("error");
      setErrorMsg("Esta reunión ya fue cancelada anteriormente.");
      return;
    }
    setMeeting(meetingData.meeting as any);
    setStep("confirm");
  }, [token, isLoading, error, meetingData]);

  const cancelMutation = trpc.calendar.cancelMeeting.useMutation({
    onSuccess: () => setStep("success"),
    onError: (err) => {
      setStep("error");
      setErrorMsg(err.message || "No se pudo cancelar la reunión. Intenta de nuevo o contáctanos.");
    },
  });

  const handleCancel = () => {
    if (!token) return;
    setStep("cancelling");
    cancelMutation.mutate({ cancelToken: token });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #060d18 0%, #0d1b2a 50%, #112240 100%)" }}
    >
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: "linear-gradient(rgba(100,181,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,181,246,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg,#1565c0,#0d47a1)", boxShadow: "0 8px 24px rgba(21,101,192,0.4)" }}>
            <Calendar size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">IAMET</h1>
          <p className="text-slate-400 text-sm mt-1">Gestión de Reuniones</p>
        </div>

        <AnimatePresence mode="wait">
          {/* Loading */}
          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(17,34,64,0.9)", border: "1px solid rgba(30,58,95,0.8)", backdropFilter: "blur(12px)" }}
            >
              <Loader2 size={36} className="animate-spin text-blue-400 mx-auto mb-4" />
              <p className="text-white font-medium">Verificando tu reunión...</p>
              <p className="text-slate-400 text-sm mt-1">Un momento por favor</p>
            </motion.div>
          )}

          {/* Confirm */}
          {step === "confirm" && meeting && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(17,34,64,0.9)", border: "1px solid rgba(30,58,95,0.8)", backdropFilter: "blur(12px)" }}
            >
              {/* Warning header */}
              <div className="px-6 py-4 flex items-center gap-3" style={{ background: "rgba(245,158,11,0.1)", borderBottom: "1px solid rgba(245,158,11,0.2)" }}>
                <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-yellow-300 font-semibold text-sm">Cancelar reunión</p>
                  <p className="text-yellow-400/70 text-xs">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="p-6">
                {/* Meeting details */}
                <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(21,101,192,0.1)", border: "1px solid rgba(100,181,246,0.15)" }}>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-3">Detalles de tu reunión</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-400 flex-shrink-0" />
                      <span className="text-white text-sm capitalize">{formatDate(meeting.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-blue-400 flex-shrink-0" />
                      <span className="text-white text-sm">{meeting.startTime} – {meeting.endTime} hrs (CDMX)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-blue-400 flex-shrink-0" />
                      <span className="text-white text-sm">{meeting.engineerName}</span>
                    </div>
                    <div className="pt-1 border-t" style={{ borderColor: "rgba(100,181,246,0.1)" }}>
                      <p className="text-slate-400 text-xs mt-2">Tema:</p>
                      <p className="text-white text-sm">{meeting.topic}</p>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 text-sm mb-6 text-center">
                  ¿Confirmas que deseas cancelar esta reunión? El horario quedará disponible nuevamente para otros clientes.
                </p>

                <div className="flex gap-3">
                  <Link href="/" className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      style={{ borderColor: "rgba(100,181,246,0.3)", color: "#90caf9", background: "transparent" }}
                    >
                      <ArrowLeft size={14} />
                      Mantener reunión
                    </Button>
                  </Link>
                  <Button
                    onClick={handleCancel}
                    className="flex-1 gap-2"
                    style={{ background: "linear-gradient(135deg,#b91c1c,#991b1b)", border: "none" }}
                  >
                    <XCircle size={14} />
                    Cancelar reunión
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Cancelling */}
          {step === "cancelling" && (
            <motion.div
              key="cancelling"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(17,34,64,0.9)", border: "1px solid rgba(30,58,95,0.8)", backdropFilter: "blur(12px)" }}
            >
              <Loader2 size={36} className="animate-spin text-red-400 mx-auto mb-4" />
              <p className="text-white font-medium">Cancelando tu reunión...</p>
              <p className="text-slate-400 text-sm mt-1">Liberando el horario y enviando confirmación</p>
            </motion.div>
          )}

          {/* Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(17,34,64,0.9)", border: "1px solid rgba(30,58,95,0.8)", backdropFilter: "blur(12px)" }}
            >
              <div className="px-6 py-4 flex items-center gap-3" style={{ background: "rgba(21,128,61,0.1)", borderBottom: "1px solid rgba(21,128,61,0.2)" }}>
                <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
                <p className="text-green-300 font-semibold text-sm">Reunión cancelada exitosamente</p>
              </div>
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(21,128,61,0.15)", border: "1px solid rgba(21,128,61,0.3)" }}>
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                <h2 className="text-white text-xl font-bold mb-2">¡Listo!</h2>
                <p className="text-slate-300 text-sm mb-2">
                  Tu reunión ha sido cancelada y recibirás un correo de confirmación en breve.
                </p>
                <p className="text-slate-400 text-xs mb-6">
                  El horario ha quedado disponible nuevamente. Si deseas reagendar, puedes hacerlo desde nuestro sitio web.
                </p>
                <Link href="/">
                  <Button
                    className="gap-2"
                    style={{ background: "linear-gradient(135deg,#1565c0,#0d47a1)", border: "none" }}
                  >
                    <ArrowLeft size={14} />
                    Volver al sitio
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(17,34,64,0.9)", border: "1px solid rgba(30,58,95,0.8)", backdropFilter: "blur(12px)" }}
            >
              <div className="px-6 py-4 flex items-center gap-3" style={{ background: "rgba(185,28,28,0.1)", borderBottom: "1px solid rgba(185,28,28,0.2)" }}>
                <XCircle size={20} className="text-red-400 flex-shrink-0" />
                <p className="text-red-300 font-semibold text-sm">No se pudo procesar la solicitud</p>
              </div>
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(185,28,28,0.1)", border: "1px solid rgba(185,28,28,0.2)" }}>
                  <AlertTriangle size={32} className="text-red-400" />
                </div>
                <p className="text-slate-300 text-sm mb-4">{errorMsg}</p>
                <p className="text-slate-400 text-xs mb-6">
                  Si necesitas ayuda, contáctanos directamente a{" "}
                  <a href="mailto:contacto@iamet.mx" className="text-blue-400 hover:underline">contacto@iamet.mx</a>
                </p>
                <Link href="/">
                  <Button
                    variant="outline"
                    className="gap-2"
                    style={{ borderColor: "rgba(100,181,246,0.3)", color: "#90caf9", background: "transparent" }}
                  >
                    <ArrowLeft size={14} />
                    Volver al sitio
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-8">
          © 2026 IAMET Evolución Tecnológica · contacto@iamet.mx
        </p>
      </div>
    </div>
  );
}
