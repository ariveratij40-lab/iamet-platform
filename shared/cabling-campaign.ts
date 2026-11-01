export const cablingPath = "/soluciones/cableado-estructurado";
export const cablingTitle =
  "Instalación de cableado estructurado Panduit | IAMET";
export const cablingDescription =
  "Diseño, instalación y pruebas de cableado estructurado y fibra óptica Panduit en Tijuana, Mexicali, Tecate y Ensenada. Solicite su cotización a IAMET.";
export function validCablingReceipt(
  value: string | null,
  now = Date.now()
): boolean {
  const time = Number(value);
  return (
    Number.isFinite(time) &&
    time > 0 &&
    now >= time &&
    now - time < 30 * 60 * 1000
  );
}
