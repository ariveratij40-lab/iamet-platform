// Embedded in the worker by patch-worker.py; plain text only.
function mainSiteMessages(lead) {
  const reference = `IAMET-${lead.id}`;
  const services = {
    rfid: 'RFID e identificación',
    infraestructura: 'infraestructura tecnológica',
    cctv: 'videovigilancia',
    cableado: 'cableado estructurado',
    'control-acceso': 'control de acceso',
  };
  const service = services[lead.verticalSlug] || 'tu proyecto';
  return [
    {kind: 'internal', payload: {
      from: process.env.EMAIL_FROM, to: [internal], reply_to: lead.email,
      subject: `Nueva solicitud del sitio — ${reference}`,
      text: [
        `Solicitud: ${reference}`, `Servicio: ${services[lead.verticalSlug] || 'Consulta de proyecto'}`,
        `Nombre: ${lead.contactName}`, `Empresa: ${lead.company}`,
        `Correo: ${lead.email}`, `Teléfono: ${lead.phone || 'No proporcionado'}`,
        '', 'Necesidad:', lead.problemDescription || '', '',
        'La solicitud está registrada en el mini CRM para revisión.',
        'https://iamet.mx/admin/crm',
      ].join('\n'),
    }},
    {kind: 'customer', payload: {
      from: process.env.EMAIL_FROM, to: [lead.email], reply_to: internal,
      subject: `Recibimos tu solicitud — ${reference}`,
      text: [
        `Hola ${lead.contactName},`, '',
        `Recibimos tu solicitud sobre ${service}.`, `Tu referencia es ${reference}.`,
        'Nuestro equipo revisará la información y se pondrá en contacto contigo.', '',
        'Puedes responder a este correo si deseas agregar información.', '',
        'IAMET', 'https://iamet.mx/', '',
        'Si no realizaste esta solicitud, puedes ignorar este mensaje.',
      ].join('\n'),
    }},
  ];
}
