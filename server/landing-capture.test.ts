import {beforeAll,afterAll,describe,it,expect,vi} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {drizzle} from 'drizzle-orm/pglite';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {getDb} from './db';
import {saveLandingLead,landingInput,CaptureConflict} from './landing-capture';
import {crmV2Router} from './routers/crmV2';
import express from 'express';
import {landingRest} from './_core/landing-rest';
import type {Server} from 'node:http';
vi.mock('./db',()=>({getDb:vi.fn(),isMysqlDb:()=>false}));
const pg=new PGlite();
let server:Server;
let base:string;
const input={company:'Prueba local IAMET',contactName:'Contacto ficticio',email:'test@example.invalid',problemDescription:'Tijuana, ampliación de red de prueba',service:'cableado-fibra',landing:'cableado-tijuana',brand:'IAMET'} as const;
beforeAll(async()=>{
  await pg.exec(await readFile(new URL('../deployment/vps-v2/schema.sql',import.meta.url),'utf8'));
  await pg.exec(await readFile(new URL('../deployment/vps-v2/landing-capture.sql',import.meta.url),'utf8'));
  vi.mocked(getDb).mockResolvedValue(drizzle(pg));
});
afterAll(async()=>{if(server) await new Promise<void>(resolve=>server.close(()=>resolve()));await pg.close();});
describe('REST capture persistence in the existing CRM schema',()=>{
 it('persists once and appears in the real CRM v2 list',async()=>{
   const key=randomUUID(); const a=await saveLandingLead(key,input); const b=await saveLandingLead(key,input);
   expect(a.receipt).toBe(b.receipt); expect(a.replayed).toBe(false);expect(b.replayed).toBe(true);
   const caller=crmV2Router.createCaller({req:{} as any,res:{} as any,user:{id:1,role:'admin'} as any});
   const list=await caller.list({days:30});expect(list.total).toBe(1);expect(list.items[0].source).toBe('form');
   expect(list.items[0].verticalSlug).toBe('cableado');
 });
 it('rejects a different payload under the same key',async()=>{
   const key=randomUUID();await saveLandingLead(key,input);
   await expect(saveLandingLead(key,{...input,company:'Otra empresa'})).rejects.toBeInstanceOf(CaptureConflict);
 });
 it('deduplicates concurrent requests',async()=>{
   const key=randomUUID();const results=await Promise.all([saveLandingLead(key,input),saveLandingLead(key,input)]);
   expect(results[0].receipt).toBe(results[1].receipt);
   const rows=await pg.query('select count(*)::int as total from landing_capture_receipts where idempotency_key=$1',[key]);
   expect(rows.rows[0]).toEqual({total:1});
 });
 it('rolls back the lead if receipt persistence fails',async()=>{
   const before=await pg.query('select count(*)::int as total from leads');
   await pg.exec("ALTER TABLE landing_capture_receipts ADD CONSTRAINT reject_fixture CHECK (brand <> 'IAMET') NOT VALID");
   await expect(saveLandingLead(randomUUID(),input)).rejects.toThrow();
   expect((await pg.query('select count(*)::int as total from leads')).rows).toEqual(before.rows);
   await pg.exec('ALTER TABLE landing_capture_receipts DROP CONSTRAINT reject_fixture');
 });
 it('validates lengths, honeypot, email and fixed campaign origin',()=>{
   for(const data of [{...input,email:'bad'},{...input,company:''},{...input,website:'spam'},{...input,landing:'other'},{...input,phone:'1'.repeat(33)}]) expect(landingInput.safeParse(data).success).toBe(false);
   expect(landingInput.safeParse(input).success).toBe(true);
 });
 it('does not confirm when the database is unavailable',async()=>{
   vi.mocked(getDb).mockResolvedValueOnce(null);
   await expect(saveLandingLead(randomUUID(),input)).rejects.toThrow('Database unavailable');
 });
 it('serves REST 201 and replay 200 only after persistence, and rejects invalid requests',async()=>{
   process.env.LANDING_CAPTURE_ENABLED='true';process.env.CRM_ENGINE='v2';process.env.LANDING_ALLOWED_ORIGINS='http://127.0.0.1:4321';
   const app=express();app.use('/api/leads',landingRest);
   await new Promise<void>(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});
   base=`http://127.0.0.1:${(server.address() as any).port}`;
   const key=randomUUID();
   const send=(body:any,keyValue=key,origin='http://127.0.0.1:4321')=>fetch(`${base}/api/leads`,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':keyValue,Origin:origin},body:JSON.stringify(body)});
   const a=await send(input);expect(a.status).toBe(201);const receipt=await a.json();expect(receipt.status).toBe('saved');
   const b=await send(input);expect(b.status).toBe(200);expect(await b.json()).toEqual(receipt);
   expect((await send({...input,company:'Changed'})).status).toBe(409);
   expect((await send({...input,email:'invalid'},randomUUID())).status).toBe(422);
   expect((await send(input,'bad-key')).status).toBe(422);
   expect((await send(input,randomUUID(),'https://invalid.example')).status).toBe(403);
   process.env.LANDING_CAPTURE_ENABLED='false';expect((await send(input,randomUUID())).status).toBe(503);
   process.env.LANDING_CAPTURE_ENABLED='true';
 });
});
