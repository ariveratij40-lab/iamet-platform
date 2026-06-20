import { Resend } from "resend";
import { config } from "dotenv";
config();

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("API Key presente:", !!process.env.RESEND_API_KEY);
console.log("API Key (primeros 10 chars):", process.env.RESEND_API_KEY?.substring(0, 10));

console.log("\nEnviando correo de prueba desde noreply@iamet.mx...");
const { data, error } = await resend.emails.send({
  from: "IAMET Tienda <noreply@iamet.mx>",
  to: ["ariveratij40@gmail.com"],
  subject: "✅ Test de verificación — IAMET Tienda",
  html: `
    <div style="font-family:Arial,sans-serif;padding:20px;background:#0a0a0f;color:#e2e8f0;">
      <h2 style="color:#3b82f6;">IAMET — Correo de prueba</h2>
      <p>Este es un correo de prueba enviado desde <strong>noreply@iamet.mx</strong></p>
      <p>Si recibes este correo, el sistema de envío está funcionando correctamente.</p>
      <p style="color:#64748b;font-size:12px;">Enviado el: ${new Date().toISOString()}</p>
    </div>
  `,
});

if (error) {
  console.error("❌ Error al enviar:");
  console.error(JSON.stringify(error, null, 2));
} else {
  console.log("✅ Correo enviado exitosamente!");
  console.log("   ID:", data?.id);
}
