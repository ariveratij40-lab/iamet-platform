import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('deployment/branded-mail/template.js','utf8');
const api=vm.runInNewContext(source+';({leadIdentity,brandedCustomer,messages})',{
 process:{env:{EMAIL_FROM:'IAMET <mail@example.invalid>'}},internal:'alvaro.rivera@iamet.mx',
 originalMessages:(lead:any)=>[{kind:'customer',payload:{}},{kind:'internal',payload:{subject:`Nueva solicitud IAMET-${lead.id}`,text:`Solicitud IAMET-${lead.id}`}}]
});
it('creates global five-digit references and preserves uniqueness above 99999',()=>{
 expect(api.leadIdentity({id:9,company:'Ácme México',verticalSlug:'rfid'}).reference).toBe('ACME-MEXICO-RFID-00009');
 expect(api.leadIdentity({id:100000,company:'ACME',verticalSlug:'rfid'}).reference).toBe('ACME-RFID-100000');
 expect(api.leadIdentity({id:10,company:'',landing:'synergis-tijuana'}).reference).toBe('CLIENTE-SYNERGIS-00010');
});
it('escapes customer data, supplies plain text, and shows only received as complete',()=>{
 const lead={id:9,company:'Acme',contactName:'<img src=x onerror=alert(1)>',email:'fixture@example.invalid',verticalSlug:'rfid'};
 const jobs=api.messages(lead);const p=jobs[0].payload;
 expect(p.subject).toContain('ACME-RFID-00009');expect(jobs[1].payload.subject).toContain('ACME-RFID-00009');
 expect(p.html).toContain('&lt;img');expect(p.html).not.toContain('<img src=x');
 expect(p.html).toContain('https://iamet.mx/brand/iamet-email-official-v2.png');
 expect(p.html.match(/COMPLETADA/g)).toHaveLength(1);expect(p.html).not.toContain('ACME-RFID-00009</p>Asunto');
 expect(p.text).toContain('RFID');expect(p.text).toContain('Referencia: ACME-RFID-00009');expect(p.to).toEqual(['fixture@example.invalid']);
 expect(p.html).toContain('subject=Solicitud%20ACME-RFID-00009');expect(p.html).not.toContain('VISTA PREVIA');
});
it.each(['cableado','genetec-tijuana','synergis-tijuana'])('applies design to landing %s',landing=>{
 const p=api.messages({id:15,company:'Cliente',contactName:'Test',email:'test@example.invalid',landing})[0].payload;
 expect(p.html).toContain('Así avanzará tu solicitud');expect(p.subject).not.toContain('IAMET-15');
});
