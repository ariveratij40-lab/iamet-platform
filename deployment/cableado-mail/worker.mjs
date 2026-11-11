import postgres from 'postgres';

for (const name of ['DATABASE_URL', 'RESEND_API_KEY', 'EMAIL_FROM']) {
  if (!process.env[name]?.trim()) throw new Error(`Falta ${name}`);
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1, connect_timeout: 10, idle_timeout: 20
});
const internal = 'alvaro.rivera@iamet.mx';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function messages(lead) {
  const reference = `IAMET-${lead.id}`;
  return [
    {
      kind: 'internal',
      payload: {
        from: process.env.EMAIL_FROM,
        to: [internal],
        reply_to: lead.email,
        subject: `Nueva solicitud de cableado — ${reference}`,
        text: [
          `Solicitud: ${reference}`,
          `Nombre: ${lead.contactName}`,
          `Empresa: ${lead.company}`,
          `Correo: ${lead.email}`,
          `Teléfono: ${lead.phone || 'No proporcionado'}`,
          '',
          'Necesidad:',
          lead.problemDescription || '',
          '',
          'La solicitud está registrada en el CRM de producción.'
        ].join('\n')
      }
    },
    {
      kind: 'customer',
      payload: {
        from: process.env.EMAIL_FROM,
        to: [lead.email],
        reply_to: internal,
        subject: `Recibimos tu solicitud — ${reference}`,
        text: [
          `Hola ${lead.contactName},`,
          '',
          'Recibimos tu solicitud de cableado estructurado o fibra óptica.',
          `Tu referencia es ${reference}.`,
          'Nuestro equipo revisará la información y se pondrá en contacto contigo.',
          '',
          'Puedes responder a este correo si deseas agregar información.',
          '',
          'IAMET',
          'https://iamet.mx/',
          '',
          'Si no realizaste esta solicitud, puedes ignorar este mensaje.'
        ].join('\n')
      }
    }
  ];
}

async function tick() {
  // Snapshot the message once so retries always use the same content.
  const leads = await sql`
    SELECT l.*
    FROM leads l
    JOIN landing_capture_receipts r ON r.lead_id = l.id
    WHERE (
      SELECT count(*) FROM landing_mail_jobs j WHERE j.lead_id = l.id
    ) < 2
    ORDER BY l.id LIMIT 50`;

  for (const lead of leads) {
    for (const message of messages(lead)) {
      await sql`
        INSERT INTO landing_mail_jobs (lead_id, kind, payload)
        VALUES (${lead.id}, ${message.kind}, ${sql.json(message.payload)})
        ON CONFLICT (lead_id, kind) DO NOTHING`;
    }
  }

  // Stop ambiguous retries before Resend's 24-hour deduplication expires.
  await sql`
    UPDATE landing_mail_jobs SET status = 'review'
    WHERE status = 'pending'
      AND first_attempt < now() - interval '20 hours'`;

  const jobs = await sql`
    SELECT id FROM landing_mail_jobs
    WHERE status = 'pending' AND next_attempt <= now()
    ORDER BY id LIMIT 10`;

  for (const job of jobs) {
    // Persist the attempt before making any external request.
    const [claimed] = await sql`
      UPDATE landing_mail_jobs
      SET first_attempt = coalesce(first_attempt, now()),
          attempts = attempts + 1,
          next_attempt = now() + interval '5 minutes'
      WHERE id = ${job.id} AND status = 'pending'
        AND next_attempt <= now()
      RETURNING *`;
    if (!claimed) continue;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `iamet-cableado-v1-${claimed.lead_id}-${claimed.kind}`
        },
        body: JSON.stringify(claimed.payload),
        signal: AbortSignal.timeout(20000)
      });
      const result = await response.json();
      if (!response.ok || !result.id) {
        const retry = response.status === 429 || response.status >= 500;
        await sql`
          UPDATE landing_mail_jobs
          SET status = ${retry ? 'pending' : 'review'},
              last_error = ${'HTTP_' + response.status}
          WHERE id = ${claimed.id}`;
        console.log(`Aviso ${claimed.id}: HTTP ${response.status}`);
      } else {
        await sql`
          UPDATE landing_mail_jobs
          SET status = 'accepted', provider_id = ${result.id},
              accepted_at = now(), last_error = NULL
          WHERE id = ${claimed.id}`;
        console.log(`Aviso ${claimed.id}: aceptado por Resend`);
      }
    } catch {
      console.log(`Aviso ${claimed.id}: pendiente de reintento`);
    }
    await sleep(1000);
  }
}

if (process.argv.includes('--check')) {
  await sql`SELECT 1`;
  console.log('CONEXIÓN Y VARIABLES CORRECTAS; NO SE ENVIARON CORREOS');
  await sql.end();
} else {
  for (;;) {
    try { await tick(); }
    catch { console.error('Ciclo de correo pendiente; revisar configuración/base.'); }
    await sleep(15000);
  }
}
