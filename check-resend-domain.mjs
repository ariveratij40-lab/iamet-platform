import { Resend } from "resend";
import { config } from "dotenv";

config();

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.domains.list();

if (error) {
  console.error("Error al listar dominios:", error);
  process.exit(1);
}

console.log("Dominios en Resend:");
if (!data?.data?.length) {
  console.log("  (ningún dominio configurado)");
} else {
  for (const d of data.data) {
    console.log(`  - ${d.name} | status: ${d.status} | region: ${d.region}`);
  }
}

// Verificar si iamet.mx está verificado
const iametDomain = data?.data?.find(d => d.name === "iamet.mx");
if (iametDomain) {
  console.log("\n✅ iamet.mx encontrado en Resend");
  console.log("   Status:", iametDomain.status);
  if (iametDomain.status === "verified") {
    console.log("   ✅ Dominio VERIFICADO — listo para enviar correos");
  } else {
    console.log("   ⚠️  Dominio NO verificado — necesitas agregar los registros DNS");
  }
} else {
  console.log("\n⚠️  iamet.mx NO está en Resend — necesitas agregarlo");
}
