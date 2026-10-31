export const leadStages = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Calificado" },
  { value: "proposal", label: "Propuesta" },
  { value: "closed_won", label: "Ganado" },
  { value: "closed_lost", label: "Perdido" },
] as const;
export type LeadStage = (typeof leadStages)[number]["value"];
