import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requestAdminPasswordReset, completeAdminPasswordReset, validAdminPassword } from '../admin-password-reset';
import { ENV } from './env';
export const adminResetRouter = Router();
adminResetRouter.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
adminResetRouter.use(rateLimit({windowMs: 15*60*1000, limit: 5, standardHeaders: true, legacyHeaders: false,
  message: {error:'Demasiados intentos. Intenta nuevamente en 15 minutos.'}}));
adminResetRouter.post('/request', async (req,res) => {
  const input=z.object({email:z.string().trim().email().max(320)}).safeParse(req.body);
  if(!input.success) return res.status(400).json({error:'Ingresa un correo válido.'});
  if(!ENV.resendApiKey || !ENV.cookieSecret) return res.status(503).json({error:'La recuperación no está disponible en este momento.'});
  try { await requestAdminPasswordReset(input.data.email); }
  catch { console.error('[AdminReset] Request could not be processed'); }
  return res.status(202).json({message:'Si el correo corresponde a un administrador activo, recibirás un enlace. Revisa también spam.'});
});
adminResetRouter.post('/complete', async (req,res) => {
  const {token,password}=req.body ?? {};
  if(typeof token!=='string' || token.length>2048 || !validAdminPassword(password))
    return res.status(400).json({error:'Usa una contraseña de al menos 12 caracteres y máximo 72 bytes.'});
  try {
    if(!await completeAdminPasswordReset(token,password)) return res.status(400).json({error:'El enlace venció o ya fue utilizado. Solicita uno nuevo.'});
    return res.json({ok:true});
  } catch { return res.status(503).json({error:'No se pudo completar el cambio. Intenta más tarde.'}); }
});
