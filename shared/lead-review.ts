import { z } from "zod";
export const reviewStages = [
  { value: "new", label: "Nuevo" },
  { value: "needs_info", label: "Por completar" },
  { value: "qualified", label: "Calificado" },
  { value: "discarded", label: "Descartado" },
  { value: "transferred", label: "Transferido" },
] as const;
export const reviewState = z.enum([
  "new",
  "needs_info",
  "qualified",
  "discarded",
  "transferred",
]);
export type ReviewStage = z.infer<typeof reviewState>;
export const reviewFields = z.object({
  contactVerified: z.boolean(),
  needConfirmed: z.boolean(),
  serviceFit: z.boolean(),
  areaFit: z.boolean(),
  notes: z.string().trim().max(5000),
  reason: z.string().trim().max(1000),
  reference: z.string().trim().max(256),
});
export type ReviewFields = z.infer<typeof reviewFields>;
export const emptyReview: ReviewFields = {
  contactVerified: false,
  needConfirmed: false,
  serviceFit: false,
  areaFit: false,
  notes: "",
  reason: "",
  reference: "",
};
export const reviewChecks = [
  ["contactVerified", "Datos de contacto revisados"],
  ["needConfirmed", "Necesidad y alcance identificados"],
  ["serviceFit", "El proyecto corresponde a los servicios de IAMET"],
  ["areaFit", "La ubicación está dentro de nuestra cobertura"],
] as const;
