import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {PGlite} from '@electric-sql/pglite';
const helper=readFileSync('deployment/form-mail/main-site-messages.js','utf8');
const messages=vm.runInNewContext(helper+';mainSiteMessages',{process:{env:{EMAIL_FROM:'IAMET <test@example.invalid>'}},internal:'alvaro.rivera@iamet.mx'});
it('creates both notices with service-specific text, reference and reply address',()=>{
 const jobs=messages({id:9,verticalSlug:'rfid',contactName:'Prueba',company:'Demo',email:'customer@example.invalid'});
 expect(jobs).toHaveLength(2);expect(jobs[0].payload.to).toEqual(['alvaro.rivera@iamet.mx']);
 expect(jobs[1].payload.to).toEqual(['customer@example.invalid']);expect(jobs[1].payload.text).toContain('RFID e identificación');
 expect(jobs[1].payload.text).not.toContain('cableado');expect(jobs[1].payload.subject).toContain('IAMET-9');expect(jobs[1].payload.reply_to).toBe('alvaro.rivera@iamet.mx');
 expect(messages({id:10,contactName:'Prueba',email:'x@example.invalid'})[1].payload.text).toContain('tu proyecto');
});
it('selects reported and future forms, preserves landings, excludes historical and completed jobs',async()=>{
 const pg=new PGlite();
 try {
 await pg.exec(`CREATE TABLE leads(id integer,source text); CREATE TABLE landing_capture_receipts(lead_id integer,landing text); CREATE TABLE landing_mail_jobs(lead_id integer,kind text,UNIQUE(lead_id,kind));
 INSERT INTO leads VALUES (3,'form'),(4,'form'),(5,'form'),(9,'form'),(10,'agent'),(11,'form');
 INSERT INTO landing_capture_receipts VALUES(3,'cableado'); INSERT INTO landing_mail_jobs VALUES(11,'internal'),(11,'customer');`);
 const source=readFileSync('deployment/cableado-mail/worker.mjs','utf8');
 const query=source.split('  const leads = await sql`')[1].split('`;')[0].replace('${mainSiteFirstLeadId}','$1');
 const result=await pg.query<{id:number;landing_receipt_id:number|null}>(query,[9]);
 expect(result.rows.map(r=>r.id)).toEqual([3,9]);
 expect(result.rows[0].landing_receipt_id).toBe(3);expect(result.rows[1].landing_receipt_id).toBeNull();
 await pg.exec(`INSERT INTO landing_mail_jobs VALUES(9,'customer') ON CONFLICT DO NOTHING; INSERT INTO landing_mail_jobs VALUES(9,'customer') ON CONFLICT DO NOTHING;`);
 expect((await pg.query('SELECT * FROM landing_mail_jobs WHERE lead_id=9')).rows).toHaveLength(1);
 } finally {await pg.close();}
});
