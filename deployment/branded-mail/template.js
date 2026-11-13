// BRANDED_LEAD_CONFIRMATION_V1
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function referencePart(value, fallback) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32).replace(/-$/,'') || fallback;
}
function leadIdentity(lead) {
  const key = lead.landing || lead.verticalSlug || 'general';
  const solutions = {
    'rfid':['RFID','RFID e identificación'],
    'cableado':['CABLEADO','cableado estructurado'],
    'cableado-estructurado':['CABLEADO','cableado estructurado'],
    'infraestructura':['INFRAESTRUCTURA','infraestructura tecnológica'],
    'cctv':['CCTV','videovigilancia'],
    'genetec-tijuana':['GENETEC','seguridad integral Genetec'],
    'synergis-tijuana':['SYNERGIS','control de acceso Genetec Synergis'],
    'control-acceso':['CONTROL-ACCESO','control de acceso'],
  };
  const [code,service] = solutions[key] || [referencePart(key,'GENERAL'), 'tu proyecto'];
  if (!Number.isSafeInteger(Number(lead.id)) || Number(lead.id)<1) throw new Error('ID de solicitud inválido');
  return {reference: `${referencePart(lead.company,'CLIENTE')}-${code}-${String(lead.id).padStart(5,'0')}`,service};
}
function brandedCustomer(lead, reference, service) {
  return {
    from: process.env.EMAIL_FROM, to:[lead.email], reply_to:internal,
    subject:`Recibimos tu solicitud | ${reference}`,
    text:[`Hola, ${lead.contactName}.`, `Recibimos tu solicitud sobre ${service}.`, `Referencia: ${reference}`, '',
      '1. Solicitud recibida: registramos tus datos y la descripción del proyecto.',
      '2. Revisión del proyecto: revisaremos servicio, ubicación y alcance. Si falta información, te contactaremos.',
      '3. Validación contigo: confirmaremos tus necesidades y si podemos atender el proyecto.',
      '4. Atención de un especialista: si corresponde a nuestros servicios y cobertura, un asesor definirá los siguientes pasos y, cuando corresponda, una propuesta.',
      '', 'Puedes responder a este correo con información adicional. No necesitas llenar otro formulario.',
      'IAMET · Integración tecnológica', 'https://iamet.mx/', 'Aviso de privacidad: https://privacidad.iamet.mx/',
      'Si no realizaste esta solicitud, puedes ignorar este mensaje.'].join('\n'),
    html: `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vista previa · Correo IAMET</title><style>body{margin:0;background:#edf2f7;font-family:Arial,Helvetica,sans-serif;color:#14283d}table{border-collapse:collapse}p{line-height:1.65} .shell{width:100%;max-width:640px}.pad{padding:32px 40px}@media(max-width:600px){.pad{padding:24px 22px}.shell{width:100%}.steps{font-size:10px!important}}</style></head><body>
<div style="display:none;max-height:0;overflow:hidden">Recibimos tu proyecto. Conoce los siguientes pasos y conserva tu referencia.</div>

<table role="presentation" class="shell" align="center" style="margin:auto;background:white;border:1px solid #dce5ef"><tr><td class="pad" style="padding-bottom:24px"><img src="https://iamet.mx/brand/iamet-email-official-v2.png" width="192" alt="IAMET · Integración tecnológica" style="display:block;width:192px;max-width:100%;height:auto"></td></tr>
<tr><td class="pad" style="background:#09233d;color:white;padding-top:30px;padding-bottom:30px"><p style="font-size:11px;letter-spacing:2px;color:#82b7ff;margin:0 0 14px">CONFIRMACIÓN DE SOLICITUD</p><h1 style="font-size:30px;line-height:1.2;margin:0 0 14px">Tu proyecto comienza aquí.</h1><p style="font-size:15px;color:#d5e3f3;margin:0">Hola, ${escapeHtml(lead.contactName)}. Recibimos tu solicitud de <strong style="color:white">${escapeHtml(service)}</strong>. Gracias por contactar a IAMET.</p></td></tr>
<tr><td class="pad" style="padding-top:24px;padding-bottom:24px"><table role="presentation" width="100%" style="background:#f0f6ff;border:1px solid #d4e5ff"><tr><td style="padding:18px 20px"><p style="font-size:10px;letter-spacing:1.4px;color:#526b86;margin:0 0 7px">TU REFERENCIA</p><strong style="font-size:21px;color:#1558b0;letter-spacing:.5px">${escapeHtml(reference)}</strong><p style="font-size:12px;color:#526b86;margin:8px 0 0">Cliente: ${escapeHtml(lead.company)} · Estado: Solicitud recibida</p></td></tr></table></td></tr>
<tr><td class="pad" style="padding-top:0;padding-bottom:14px"><h2 style="font-size:20px;margin:0 0 22px">Así avanzará tu solicitud</h2>
<table role="presentation" width="100%" style="table-layout:fixed;text-align:center"><tr><td style="color:#1767dc;font-size:26px">●</td><td style="color:#cfdae6;font-size:26px">○</td><td style="color:#cfdae6;font-size:26px">○</td><td style="color:#cfdae6;font-size:26px">○</td></tr><tr class="steps" style="font-size:11px;line-height:1.4"><td style="border-top:3px solid #1767dc;padding-top:10px;color:#1558b0;font-weight:bold">Recibida</td><td style="border-top:3px solid #e2e9f1;padding-top:10px;color:#526b86">Revisión</td><td style="border-top:3px solid #e2e9f1;padding-top:10px;color:#526b86">Validación</td><td style="border-top:3px solid #e2e9f1;padding-top:10px;color:#526b86">Especialista</td></tr></table>
</td></tr>
<tr><td class="pad" style="padding-top:10px;padding-bottom:24px">
<table role="presentation" width="100%">
<tr><td style="width:34px;vertical-align:top;padding-top:16px;color:#1767dc;font-weight:bold">01</td><td style="padding:16px 0;border-bottom:1px solid #e7edf4"><strong style="font-size:14px">Solicitud recibida <span style="color:#1767dc;font-size:11px"> · COMPLETADA</span></strong><p style="font-size:13px;color:#526b86;margin:5px 0 0">Registramos tus datos y la descripción de tu proyecto.</p></td></tr>
<tr><td style="vertical-align:top;padding-top:16px;color:#8395a8;font-weight:bold">02</td><td style="padding:16px 0;border-bottom:1px solid #e7edf4"><strong style="font-size:14px">Revisión del proyecto</strong><p style="font-size:13px;color:#526b86;margin:5px 0 0">Revisaremos el servicio, la ubicación y el alcance. Si falta información, te contactaremos.</p></td></tr>
<tr><td style="vertical-align:top;padding-top:16px;color:#8395a8;font-weight:bold">03</td><td style="padding:16px 0;border-bottom:1px solid #e7edf4"><strong style="font-size:14px">Validación contigo</strong><p style="font-size:13px;color:#526b86;margin:5px 0 0">Confirmaremos tus necesidades y si podemos atender el proyecto.</p></td></tr>
<tr><td style="vertical-align:top;padding-top:16px;color:#8395a8;font-weight:bold">04</td><td style="padding:16px 0"><strong style="font-size:14px">Atención de un especialista</strong><p style="font-size:13px;color:#526b86;margin:5px 0 0">Si el proyecto corresponde a nuestros servicios y cobertura, un asesor definirá contigo los siguientes pasos y, cuando corresponda, una propuesta.</p></td></tr>
</table></td></tr>
<tr><td class="pad" style="padding-top:0"><table role="presentation" width="100%" style="background:#f5f8fc"><tr><td style="padding:23px"><h2 style="font-size:17px;margin:0 0 9px">¿Quieres agregar información?</h2><p style="font-size:13px;color:#526b86;margin:0 0 18px">Responde con la ubicación, cantidades aproximadas o fechas previstas. No necesitas llenar otro formulario.</p><a href="mailto:alvaro.rivera@iamet.mx?subject=${encodeURIComponent("Solicitud " + reference)}" style="display:inline-block;background:#1767dc;border:1px solid #1767dc;border-radius:6px;padding:14px 20px;color:#fff;font-weight:bold;font-size:13px;text-decoration:none">Responder a IAMET →</a><p style="font-size:11px;color:#64788e;margin:14px 0 0">Conserva tu referencia: <strong>${escapeHtml(reference)}</strong></p></td></tr></table></td></tr>
<tr><td class="pad" style="border-top:1px solid #e7edf4;padding-top:23px;padding-bottom:23px"><strong style="font-size:12px">IAMET · Integración tecnológica</strong><p style="font-size:11px;color:#64788e;margin:8px 0">Tijuana · Mexicali · Tecate · Ensenada<br><a href="https://iamet.mx/" style="color:#1767dc">iamet.mx</a> · <a href="https://privacidad.iamet.mx/" style="color:#64788e">Aviso de privacidad</a></p><p style="font-size:10px;color:#8395a8;margin:14px 0 0">Este correo confirma la recepción de tu solicitud. Si no la realizaste, puedes ignorar este mensaje.</p></td></tr></table>
</body></html>`
  };
}
function messages(lead) {
  const {reference,service}=leadIdentity(lead);
  return originalMessages(lead).map(message => message.kind === 'customer'
    ? {kind:'customer',payload:brandedCustomer(lead,reference,service)}
    : {...message,payload:{...message.payload,
      subject:message.payload.subject.replace(`IAMET-${lead.id}`,reference),
      text:message.payload.text.replace(`IAMET-${lead.id}`,reference)}});
}
