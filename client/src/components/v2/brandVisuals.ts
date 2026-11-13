/** Public assets shipped with the application; shared by cards and brand heroes. */
export const serviceVisuals: Record<string, { image: string; label: string }> = {
  "computo-licenciamiento": { image: "/images/solutions/computo-licenciamiento.png", label: "Dell · Autodesk · Microsoft" },
  infraestructura: { image: "/images/solutions/panduit-high-density-cinematic-1672.webp", label: "Panduit" },
  cctv: { image: "/images/solutions/cctv-installation-devops.png", label: "Genetec · Avigilon" },
  "control-acceso": { image: "/images/solutions/access-control-devops.png", label: "Genetec · Avigilon" },
  energia: { image: "/images/solutions/energy-galaxy-vxl-devops.png", label: "APC · Schneider Electric" },
  rfid: { image: "/images/solutions/rfid-traceability-devops.png", label: "Zebra" },
  "software-ia": { image: "/images/solutions/software-dashboards-devops.png", label: "Desarrollo IAMET" },
  "polizas-servicios": { image: "/images/solutions/smart-building-devops.png", label: "Soporte e integración IAMET" },
};
export const brandVisuals: Record<string, { logo: string; image: string; padded?: boolean }> = {
  panduit: { logo: "/partners/panduit.png", image: serviceVisuals.infraestructura.image, padded: true },
  genetec: { logo: "/partners/genetec.png", image: serviceVisuals.cctv.image, padded: true },
  zebra: { logo: "/partners/zebra.svg", image: serviceVisuals.rfid.image },
  avigilon: { logo: "/partners/avigilon.jpg", image: serviceVisuals["control-acceso"].image },
  "apc-schneider": { logo: "/partners/apc.webp", image: serviceVisuals.energia.image },
};
