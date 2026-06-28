import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Clock, User, Mail, Phone, Building2, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";

interface CalendarPickerProps {
  sessionId?: string;
  specialistId?: string;
  onClose?: () => void;
  onBooked?: (cancelToken: string) => void;
}

type Step = "dates" | "slots" | "form" | "success";

interface SelectedSlot {
  id: number;
  engineerId: number;
  startTime: string;
  endTime: string;
  engineerName: string;
  engineerSpecialty: string | null;
}

export function CalendarPicker({ sessionId, specialistId, onClose, onBooked }: CalendarPickerProps) {
  const [step, setStep] = useState<Step>("dates");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    company: "",
    topic: specialistId ? `Consulta técnica — ${specialistId}` : "Consulta técnica con ingeniero IAMET",
  });

  const { data: datesData, isLoading: loadingDates } = trpc.calendar.getAvailableDates.useQuery(
    { daysAhead: 14 },
    { refetchOnWindowFocus: false }
  );

  const { data: slotsData, isLoading: loadingSlots } = trpc.calendar.getSlotsByDate.useQuery(
    { date: selectedDate ?? "" },
    { enabled: !!selectedDate, refetchOnWindowFocus: false }
  );

  const bookMutation = trpc.calendar.bookMeeting.useMutation({
    onSuccess: (data) => {
      setStep("success");
      onBooked?.(data.cancelToken ?? "");
    },
    onError: (err) => {
      toast.error(err.message || "Error al agendar la reunión. Intenta de nuevo.");
    },
  });

  const availableDates = datesData?.dates ?? [];
  const slots = slotsData?.slots ?? [];

  // Group slots by engineer
  const slotsByEngineer = useMemo(() => {
    const grouped: Record<number, typeof slots> = {};
    for (const slot of slots) {
      const eid = (slot as any).engineerId;
      if (!grouped[eid]) grouped[eid] = [];
      grouped[eid].push(slot);
    }
    return grouped;
  }, [slots]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep("slots");
  };

  const handleSlotSelect = (slot: typeof slots[0]) => {
    setSelectedSlot({
      id: (slot as any).id,
      engineerId: (slot as any).engineerId,
      startTime: (slot as any).startTime,
      endTime: (slot as any).endTime,
      engineerName: (slot as any).engineerName ?? "Ingeniero IAMET",
      engineerSpecialty: (slot as any).engineerSpecialty ?? null,
    });
    setStep("form");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    bookMutation.mutate({
      slotId: selectedSlot.id,
      engineerId: selectedSlot.engineerId,
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone || undefined,
      company: form.company || undefined,
      topic: form.topic,
      specialistId: specialistId,
      conversationId: sessionId,
      origin: window.location.origin,
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  };

  const getDayName = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-MX", { weekday: "short" }).toUpperCase();
  };

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{
      background: "linear-gradient(135deg, #0d1b2a 0%, #112240 100%)",
      border: "1px solid #1e3a5f",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(100,181,246,0.1)",
    }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1e3a5f" }}>
        <div className="flex items-center gap-2">
          {step !== "dates" && step !== "success" && (
            <button
              onClick={() => setStep(step === "form" ? "slots" : "dates")}
              className="text-blue-400 hover:text-blue-300 transition-colors mr-1"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <Calendar size={18} className="text-blue-400" />
          <span className="text-sm font-semibold text-blue-100">
            {step === "dates" && "Selecciona una fecha"}
            {step === "slots" && "Elige tu horario"}
            {step === "form" && "Tus datos de contacto"}
            {step === "success" && "¡Reunión confirmada!"}
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors text-lg leading-none">×</button>
        )}
      </div>

      <div className="p-5">
        {/* Step 1: Date Selection */}
        {step === "dates" && (
          <div>
            {loadingDates ? (
              <div className="flex items-center justify-center py-8 gap-2 text-blue-400">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-sm">Cargando disponibilidad...</span>
              </div>
            ) : availableDates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400 text-sm">No hay fechas disponibles en este momento.</p>
                <p className="text-slate-500 text-xs mt-1">Contáctanos directamente a contacto@iamet.mx</p>
              </div>
            ) : (
              <div>
                <p className="text-slate-400 text-xs mb-4">Fechas con disponibilidad en los próximos 14 días:</p>
                <div className="grid grid-cols-4 gap-2">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className="flex flex-col items-center py-3 px-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                      style={{
                        background: "rgba(21,101,192,0.15)",
                        border: "1px solid rgba(100,181,246,0.2)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(21,101,192,0.3)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,181,246,0.5)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(21,101,192,0.15)";
                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,181,246,0.2)";
                      }}
                    >
                      <span className="text-blue-400 text-xs font-medium">{getDayName(date)}</span>
                      <span className="text-white text-lg font-bold leading-tight">{new Date(date + "T12:00:00").getDate()}</span>
                      <span className="text-slate-400 text-xs">{new Date(date + "T12:00:00").toLocaleDateString("es-MX", { month: "short" })}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Time Slot Selection */}
        {step === "slots" && selectedDate && (
          <div>
            <p className="text-blue-300 text-sm font-medium mb-1 capitalize">{formatDate(selectedDate)}</p>
            <p className="text-slate-400 text-xs mb-4">Horarios disponibles (Hora Ciudad de México):</p>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-6 gap-2 text-blue-400">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Cargando horarios...</span>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm">No hay horarios disponibles para esta fecha.</p>
                <button onClick={() => setStep("dates")} className="text-blue-400 text-sm mt-2 hover:underline">← Elegir otra fecha</button>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(slotsByEngineer).map(([engId, engSlots]) => {
                  const firstSlot = engSlots[0] as any;
                  return (
                    <div key={engId}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#1565c0,#0d47a1)" }}>
                          {firstSlot.engineerName?.charAt(0) ?? "I"}
                        </div>
                        <div>
                          <p className="text-white text-xs font-semibold">{firstSlot.engineerName}</p>
                          {firstSlot.engineerSpecialty && <p className="text-blue-400 text-xs">{firstSlot.engineerSpecialty}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 ml-9">
                        {engSlots.map((slot: any) => (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot)}
                            className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                            style={{
                              background: "rgba(21,101,192,0.15)",
                              border: "1px solid rgba(100,181,246,0.2)",
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(21,101,192,0.3)";
                              (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,181,246,0.5)";
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(21,101,192,0.15)";
                              (e.currentTarget as HTMLElement).style.borderColor = "rgba(100,181,246,0.2)";
                            }}
                          >
                            <Clock size={12} className="text-blue-400" />
                            <span className="text-white font-medium">{slot.startTime}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Contact Form */}
        {step === "form" && selectedSlot && selectedDate && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Summary */}
            <div className="rounded-lg p-3 text-sm" style={{ background: "rgba(21,101,192,0.15)", border: "1px solid rgba(100,181,246,0.2)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-blue-400" />
                <span className="text-white capitalize">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-blue-400" />
                <span className="text-white">{selectedSlot.startTime} – {selectedSlot.endTime} hrs</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-blue-400" />
                <span className="text-white">{selectedSlot.engineerName}</span>
                {selectedSlot.engineerSpecialty && <span className="text-blue-400 text-xs">· {selectedSlot.engineerSpecialty}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Nombre completo *</Label>
                <Input
                  value={form.clientName}
                  onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  placeholder="Tu nombre"
                  required
                  className="h-9 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(100,181,246,0.2)", color: "white" }}
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Email *</Label>
                <Input
                  type="email"
                  value={form.clientEmail}
                  onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="tu@empresa.com"
                  required
                  className="h-9 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(100,181,246,0.2)", color: "white" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Teléfono</Label>
                <Input
                  value={form.clientPhone}
                  onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                  placeholder="+52 81 0000 0000"
                  className="h-9 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(100,181,246,0.2)", color: "white" }}
                />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Empresa</Label>
                <Input
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  placeholder="Nombre de tu empresa"
                  className="h-9 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(100,181,246,0.2)", color: "white" }}
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Tema de la reunión *</Label>
              <Textarea
                value={form.topic}
                onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                placeholder="¿Qué necesitas resolver?"
                required
                rows={2}
                className="text-sm resize-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(100,181,246,0.2)", color: "white" }}
              />
            </div>

            <Button
              type="submit"
              disabled={bookMutation.isPending}
              className="w-full h-10 text-sm font-semibold"
              style={{ background: "linear-gradient(135deg,#1565c0,#0d47a1)", border: "none" }}
            >
              {bookMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin mr-2" />Agendando...</>
              ) : (
                <>Confirmar reunión</>
              )}
            </Button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === "success" && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(21,101,192,0.2)", border: "1px solid rgba(100,181,246,0.3)" }}>
              <CheckCircle2 size={28} className="text-blue-400" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">¡Reunión confirmada!</h3>
            <p className="text-slate-300 text-sm mb-1">
              Recibirás un correo de confirmación con los detalles y un enlace para cancelar si es necesario.
            </p>
            {selectedDate && selectedSlot && (
              <div className="mt-4 rounded-lg p-3 text-sm text-left" style={{ background: "rgba(21,101,192,0.1)", border: "1px solid rgba(100,181,246,0.15)" }}>
                <p className="text-blue-300 capitalize">{formatDate(selectedDate)}</p>
                <p className="text-white">{selectedSlot.startTime} – {selectedSlot.endTime} hrs</p>
                <p className="text-slate-400">{selectedSlot.engineerName}</p>
              </div>
            )}
            {onClose && (
              <Button onClick={onClose} variant="outline" className="mt-4 text-sm" style={{ borderColor: "rgba(100,181,246,0.3)", color: "#90caf9" }}>
                Cerrar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
