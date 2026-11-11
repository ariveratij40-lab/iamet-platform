import { createHmac, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { sql } from 'drizzle-orm';
import { getDb, isMysqlDb } from './db';
import { findUserByEmail, findUserById, hashPassword } from './local-auth';
import { ENV } from './_core/env';
import { getResend } from './email';

const audience = 'iamet-admin-password-reset';
const fingerprint = (hash: string) => createHmac('sha256', ENV.cookieSecret).update(hash).digest('hex');
export function createAdminResetToken(id: number, hash: string) {
  if (!ENV.cookieSecret) throw new Error('Reset unavailable');
  return jwt.sign({ sub: String(id), fingerprint: fingerprint(hash) }, ENV.cookieSecret,
    { algorithm: 'HS256', audience, expiresIn: '20m' });
}
export function decodeAdminResetToken(token: string) {
  try {
    const value = jwt.verify(token, ENV.cookieSecret, { algorithms: ['HS256'], audience });
    if (typeof value === 'string' || !/^\d+$/.test(value.sub ?? '') ||
      typeof value.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(value.fingerprint)) return null;
    return { id: Number(value.sub), fingerprint: value.fingerprint };
  } catch { return null; }
}
export function validAdminPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 12 && Buffer.byteLength(password, 'utf8') <= 72;
}
export async function requestAdminPasswordReset(email: string) {
  const origin = new URL(ENV.appUrl);
  if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('Invalid origin');
  if (!ENV.resendApiKey || !ENV.cookieSecret || isMysqlDb()) throw new Error('Reset unavailable');
  const user = await findUserByEmail(email.trim().toLowerCase());
  if (!user || user.role !== 'admin' || user.status !== 'active' || !user.passwordHash) return;
  const token = createAdminResetToken(user.id, user.passwordHash);
  // Fragment keeps the credential out of HTTP access logs and Referer headers.
  const url = `${origin.origin}/admin/recuperar#token=${encodeURIComponent(token)}`;
  const { data, error } = await getResend().emails.send({
    from: ENV.emailFrom, to: [user.email], subject: 'Recupera tu acceso al CRM — IAMET',
    text: `Se solicitó recuperar el acceso administrador de IAMET.\n\nAbre este enlace para elegir una nueva contraseña:\n${url}\n\nCaduca en 20 minutos y deja de funcionar al cambiar la contraseña. Si no solicitaste este cambio, ignora este correo. Tu contraseña no se ha modificado.`
  });
  if (error || !data?.id) {
    console.error('[AdminReset] Email delivery not accepted');
    return;
  }
  console.info('[AdminReset] Email accepted by provider');
}
export async function completeAdminPasswordReset(token: string, password: string) {
  const decoded = decodeAdminResetToken(token);
  if (!decoded || !validAdminPassword(password) || isMysqlDb()) return false;
  const user = await findUserById(decoded.id);
  if (!user || user.role !== 'admin' || user.status !== 'active') return false;
  const current = await findUserByEmail(user.email);
  if (!current?.passwordHash || current.id !== decoded.id) return false;
  const actual = fingerprint(current.passwordHash);
  if (!timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(decoded.fingerprint, 'hex'))) return false;
  const db = await getDb();
  if (!db) throw new Error('Reset unavailable');
  const next = await hashPassword(password);
  // Compare-and-set makes concurrent submissions and token replay fail after one success.
  const result = await db.execute(sql`UPDATE users SET "passwordHash"=${next}, "updatedAt"=now()
    WHERE id=${decoded.id} AND "passwordHash"=${current.passwordHash}
      AND role='admin' AND status='active' RETURNING id`);
  return (result.rows ?? result).length === 1;
}
