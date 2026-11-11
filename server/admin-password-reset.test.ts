import {beforeAll,afterAll,beforeEach,it,expect,vi} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {drizzle} from 'drizzle-orm/pglite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {getDb} from './db';
import {ENV} from './_core/env';
import {getResend} from './email';
import {createAdminResetToken,decodeAdminResetToken,completeAdminPasswordReset,requestAdminPasswordReset,validAdminPassword} from './admin-password-reset';
vi.mock('./db',()=>({getDb:vi.fn(),isMysqlDb:()=>false}));
vi.mock('./email',()=>({getResend:vi.fn()}));
const pg=new PGlite();const send=vi.fn();let original:string;
beforeAll(async()=>{
 ENV.cookieSecret='isolated-reset-test-secret';ENV.resendApiKey='test-only';ENV.appUrl='https://iamet.mx';
 await pg.exec('CREATE TABLE users (id serial primary key, email text, name text, role text, status text, "lastLoginAt" timestamp, "passwordHash" text, "updatedAt" timestamp);');
 vi.mocked(getDb).mockResolvedValue(drizzle(pg));
 vi.mocked(getResend).mockReturnValue({emails:{send}} as any);
 original=await bcrypt.hash('Old-password-fixture',4);
});
beforeEach(async()=>{
 await pg.exec('TRUNCATE users RESTART IDENTITY');
 await pg.query('INSERT INTO users(email,name,role,status,"passwordHash") VALUES ($1,$2,$3,$4,$5)',['admin@example.invalid','Test','admin','active',original]);
 send.mockReset();send.mockResolvedValue({data:{id:'mock-only'},error:null});
});
afterAll(()=>pg.close());
it('sends an admin link from configured origin with token only in fragment',async()=>{
 await requestAdminPasswordReset('ADMIN@example.invalid');expect(send).toHaveBeenCalledOnce();
 const body=send.mock.calls[0][0];expect(body.to).toEqual(['admin@example.invalid']);
 expect(body.text).toContain('https://iamet.mx/admin/recuperar#token=');
 expect(body.text).not.toContain('/tienda/');expect(body.text).not.toContain(original);
});
it('does not send for unknown, customer or inactive accounts',async()=>{
 await requestAdminPasswordReset('unknown@example.invalid');
 await pg.exec("UPDATE users SET role='user'");await requestAdminPasswordReset('admin@example.invalid');
 await pg.exec("UPDATE users SET role='admin', status='inactive'");await requestAdminPasswordReset('admin@example.invalid');
 expect(send).not.toHaveBeenCalled();
});
it('rejects tampered, expired and login-audience tokens',()=>{
 const t=createAdminResetToken(1,original);expect(decodeAdminResetToken(t)).not.toBeNull();
 expect(decodeAdminResetToken(t+'x')).toBeNull();
 expect(decodeAdminResetToken(jwt.sign({sub:'1',fingerprint:'a'.repeat(64)},ENV.cookieSecret,{audience:'iamet-admin-password-reset',expiresIn:-1}))).toBeNull();
 expect(decodeAdminResetToken(jwt.sign({sub:'1',fingerprint:'a'.repeat(64)},ENV.cookieSecret,{audience:'iamet-local',expiresIn:100}))).toBeNull();
});
it('changes only one password and rejects token replay',async()=>{
 const token=createAdminResetToken(1,original);
 expect(await completeAdminPasswordReset(token,'New-password-fixture')).toBe(true);
 expect(await completeAdminPasswordReset(token,'Another-password-fixture')).toBe(false);
 const {rows}=await pg.query<{passwordHash:string}>('SELECT "passwordHash" FROM users WHERE id=1');
 expect(await bcrypt.compare('New-password-fixture',rows[0].passwordHash)).toBe(true);
});
it('only one of two concurrent uses can succeed',async()=>{
 const t=createAdminResetToken(1,original);
 const results=await Promise.all([completeAdminPasswordReset(t,'New-password-one'),completeAdminPasswordReset(t,'New-password-two')]);
 expect(results.filter(Boolean)).toHaveLength(1);
});
it('rejects a disabled account and weak or oversized passwords',async()=>{
 const t=createAdminResetToken(1,original);
 expect(validAdminPassword('short')).toBe(false);expect(validAdminPassword('é'.repeat(40))).toBe(false);
 await pg.exec("UPDATE users SET status='inactive'");
 expect(await completeAdminPasswordReset(t,'New-password-fixture')).toBe(false);
});
