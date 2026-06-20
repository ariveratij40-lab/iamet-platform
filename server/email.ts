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
