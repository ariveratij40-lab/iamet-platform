import { createHash, randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb, isMysqlDb } from './db';
import { captureCrmV2Lead } from './routers/crmV2';

export const landingInput = z.object({
  contactName:z.string().trim().min(2).max(128),
  company:z.string().trim().min(2).max(256),
  email:z.string().trim().email().max(320),
  phone:z.string().trim().max(32).optional(),
  problemDescription:z.string().trim().min(10).max(3000),
  website:z.literal('').optional(),
  service:z.literal('cableado-fibra'),
  landing:z.literal('cableado-tijuana'),
  brand:z.literal('IAMET'),
  attribution:z.object({
    utmSource:z.string().max(255).optional(),utmMedium:z.string().max(255).optional(),
    utmCampaign:z.string().max(255).optional(),utmTerm:z.string().max(255).optional(),
    utmContent:z.string().max(255).optional(),gclid:z.string().max(255).optional(),
    fbclid:z.string().max(255).optional(),msclkid:z.string().max(255).optional(),
  }).strict().optional(),
}).strict();
export class CaptureConflict extends Error {}
export async function saveLandingLead(key:string,input:z.infer<typeof landingInput>) {
  if(isMysqlDb()) throw new Error('PostgreSQL required');
  const db=await getDb();
  if(!db) throw new Error('Database unavailable');
  const normalized=landingInput.parse(input);
  const digest=createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  return db.transaction(async (tx:any)=>{
    // A database-level lock serializes concurrent retries across backend processes.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
    const result=await tx.execute(sql`select payload_hash, receipt from landing_capture_receipts where idempotency_key=${key}::uuid`);
    const previous=(result.rows ?? result)[0];
    if(previous){
      if(previous.payload_hash!==digest) throw new CaptureConflict('Idempotency key reused with different data');
      return {status:'saved' as const,receipt:previous.receipt,replayed:true};
    }
    const {contactName,company,email,phone,problemDescription,attribution}=normalized;
    const leadId=await captureCrmV2Lead({contactName,company,email,phone,problemDescription,
      ...attribution,verticalSlug:'cableado',source:'form',
      landingUrl:'https://cableadoestructurado.iamet.mx/',firstPage:'/',
    },tx);
    const receipt=randomUUID();
    await tx.execute(sql`insert into landing_capture_receipts (idempotency_key,payload_hash,receipt,lead_id,service,landing,brand)
      values (${key}::uuid,${digest},${receipt}::uuid,${leadId},'cableado-fibra','cableado-tijuana','IAMET')`);
    return {status:'saved' as const,receipt,replayed:false};
  });
}
