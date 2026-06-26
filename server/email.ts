import { Resend } from "resend";
import { ENV } from "./_core/env";

// ─── Cliente Resend ───────────────────────────────────────────────────────────
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(ENV.resendApiKey);
  }
  return _resend;
}

// ─── Plantilla HTML del correo de verificación ───────────────────────────────
function buildVerificationEmailHtml(params: {
  name: string;
  verifyUrl: string;
  expiryHours?: number;
}): string {
  const { name, verifyUrl, expiryHours = 24 } = params;
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verificación de correo — IAMET</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#131319;border-radius:16px;border:1px solid #1e2030;overflow:hidden;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#1e40af 100%);padding:32px 40px;text-align:center;">
              <img src="https://iamettech-ssx5e88n.manus.space/manus-storage/logo-iamet-v2-final_a0aa3f89.png"
                   alt="IAMET Evolución Tecnológica"
                   height="48"
                   style="height:48px;width:auto;object-fit:contain;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f1f5f9;letter-spacing:-0.02em;">
                Verifica tu correo electrónico
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
                Hola <strong style="color:#e2e8f0;">${name}</strong>,<br/>
                Gracias por registrarte en la Tienda IAMET. Para acceder al catálogo de productos y solicitar cotizaciones, necesitas confirmar tu dirección de correo.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#2563eb;border-radius:10px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">
                      Verificar mi correo →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;font-size:13px;color:#64748b;line-height:1.6;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 28px;font-size:12px;color:#3b82f6;word-break:break-all;background:#0f172a;padding:12px 16px;border-radius:8px;border:1px solid #1e2030;">
                ${verifyUrl}
              </p>

              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                Este enlace es válido por <strong>${expiryHours} horas</strong>. Si no solicitaste este registro, puedes ignorar este correo.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0d0d14;padding:20px 40px;border-top:1px solid #1e2030;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">
                © 2025 IAMET Evolución Tecnológica — Integrador de Soluciones Tecnológicas
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Función principal de envío ───────────────────────────────────────────────
export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { to, name, verifyUrl } = params;

  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY no configurada — no se enviará correo a:", to);
    console.info("[Email] URL de verificación (dev):", verifyUrl);
    return { ok: false, error: "RESEND_API_KEY no configurada" };
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: "IAMET Tienda <noreply@iamet.mx>",
      to: [to],
      subject: "Verifica tu correo — Tienda IAMET",
      html: buildVerificationEmailHtml({ name, verifyUrl }),
    });

    if (error) {
      console.error("[Email] Error Resend:", error);
      return { ok: false, error: error.message };
    }

    console.info("[Email] Correo de verificación enviado a:", to, "id:", data?.id);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Email] Excepción al enviar correo:", msg);
    return { ok: false, error: msg };
  }
}

// ─── Email de notificación de nueva cotización ────────────────────────────────
function buildQuoteNotificationHtml(params: {
  refCode: string;
  visitorName: string;
  company?: string;
  email: string;
  phone?: string;
  notes?: string;
  items: Array<{ productName: string; productSku?: string; quantity: number }>;
}): string {
  const { refCode, visitorName, company, email, phone, notes, items } = params;
  const itemRows = items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #1e2030;color:#e2e8f0;font-size:13px;">${i.productName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e2030;color:#94a3b8;font-size:13px;font-family:monospace;">${i.productSku ?? "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #1e2030;color:#22d3ee;font-size:13px;text-align:center;font-weight:600;">${i.quantity}</td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /><title>Nueva Cotización — IAMET</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#131319;border-radius:16px;border:1px solid #1e2030;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0891b2 0%,#0e7490 100%);padding:28px 40px;">
            <img src="https://iamettech-ssx5e88n.manus.space/manus-storage/logo-iamet-v2-final_a0aa3f89.png"
                 alt="IAMET" height="40" style="height:40px;width:auto;" />
            <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.85);font-weight:600;">
              Nueva solicitud de cotización recibida
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#22d3ee;letter-spacing:-0.01em;">${refCode}</h2>
          <p style="margin:0 0 24px;font-size:12px;color:#64748b;">
            Recibida el ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "full", timeStyle: "short" })}
          </p>

          <!-- Datos del cliente -->
          <table cellpadding="0" cellspacing="0" width="100%"
                 style="margin-bottom:24px;background:#0f172a;border-radius:10px;border:1px solid #1e2030;overflow:hidden;">
            <tr><td colspan="2" style="padding:10px 16px;background:#0d0d14;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Datos del cliente</td></tr>
            <tr>
              <td style="padding:8px 16px;font-size:13px;color:#64748b;width:110px;">Nombre</td>
              <td style="padding:8px 16px;font-size:13px;color:#e2e8f0;font-weight:600;">${visitorName}</td>
            </tr>
            ${company ? `<tr><td style="padding:8px 16px;font-size:13px;color:#64748b;">Empresa</td><td style="padding:8px 16px;font-size:13px;color:#e2e8f0;">${company}</td></tr>` : ""}
            <tr>
              <td style="padding:8px 16px;font-size:13px;color:#64748b;">Email</td>
              <td style="padding:8px 16px;font-size:13px;"><a href="mailto:${email}" style="color:#3b82f6;text-decoration:none;">${email}</a></td>
            </tr>
            ${phone ? `<tr><td style="padding:8px 16px;font-size:13px;color:#64748b;">Teléfono</td><td style="padding:8px 16px;font-size:13px;color:#e2e8f0;">${phone}</td></tr>` : ""}
            ${notes ? `<tr><td style="padding:8px 16px;font-size:13px;color:#64748b;vertical-align:top;">Notas</td><td style="padding:8px 16px;font-size:13px;color:#94a3b8;">${notes}</td></tr>` : ""}
          </table>

          <!-- Productos -->
          <p style="margin:0 0 10px;font-size:13px;font-weight:600;color:#f1f5f9;">Productos solicitados</p>
          <table width="100%" cellpadding="0" cellspacing="0"
                 style="border:1px solid #1e2030;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#0d0d14;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Producto</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">SKU</th>
                <th style="padding:8px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;">Cant.</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0d0d14;padding:16px 40px;border-top:1px solid #1e2030;text-align:center;">
            <p style="margin:0;font-size:12px;color:#475569;">
              © 2025 IAMET Evolución Tecnológica — Notificación automática del sistema
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

export async function sendQuoteNotificationEmail(params: {
  refCode: string;
  visitorName: string;
  company?: string;
  email: string;
  phone?: string;
  notes?: string;
  items: Array<{ productName: string; productSku?: string; quantity: number }>;
}): Promise<{ ok: boolean; error?: string }> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY no configurada — no se enviará notificación de cotización");
    return { ok: false, error: "RESEND_API_KEY no configurada" };
  }
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: "IAMET Tienda <noreply@iamet.mx>",
      to: ["alvaro.rivera@iamet.mx"],
      subject: `Nueva cotización ${params.refCode} — ${params.visitorName}${params.company ? ` (${params.company})` : ""}`,
      html: buildQuoteNotificationHtml(params),
    });
    if (error) {
      console.error("[Email] Error notificación cotización:", error);
      return { ok: false, error: error.message };
    }
    console.info("[Email] Notificación de cotización enviada a alvaro.rivera@iamet.mx id:", data?.id);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Email] Excepción notificación cotización:", msg);
    return { ok: false, error: msg };
  }
}
