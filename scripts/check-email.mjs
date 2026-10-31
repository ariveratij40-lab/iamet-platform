// Read-only provider check. Never sends email or prints credentials/customer data.
const key = process.env.RESEND_API_KEY?.trim();
const from = process.env.EMAIL_FROM?.trim() || "IAMET <noreply@iamet.mx>";
const email = from.match(/<([^>]+)>/)?.[1] || from;
const domain = email.split("@")[1];
const sanitize = value =>
  String(value ?? "")
    .replace(/re_[A-Za-z0-9_-]+/g, "[clave ocultada]")
    .replace(/(token=)[^\s&"<>]+/g, "$1[oculto]");
console.log("RESEND_API_KEY:", key ? "configurada" : "ausente");
console.log("Dominio remitente:", domain || "formato inválido");
console.log("URL del sitio:", process.env.VITE_APP_URL || "no configurada");
if (!key) process.exit(1);
try {
  const response = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  console.log("Consulta de dominios HTTP:", response.status);
  if (response.ok) {
    const match = result.data?.find(item => item.name === domain);
    console.log(
      "Estado del dominio:",
      match?.status || "no aparece en esta cuenta"
    );
    if (result.has_more && !match)
      console.log(
        "Hay más dominios; revisar el dominio remitente en el panel de Resend."
      );
  } else {
    console.log("Tipo de error:", sanitize(result.name));
    console.log("Detalle:", sanitize(result.message));
    console.log(
      "Una clave de solo envío puede no permitir listar dominios; eso no demuestra que sea inválida."
    );
  }
} catch (error) {
  console.log("Fallo de conexión:", error.name);
  process.exitCode = 1;
}
