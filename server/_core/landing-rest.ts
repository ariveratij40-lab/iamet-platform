import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { CaptureConflict, landingInput, saveLandingLead } from '../landing-capture';
export const landingRest = express.Router();
landingRest.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
landingRest.use((req,res,next)=>{
  if(process.env.LANDING_CAPTURE_ENABLED!=='true' || process.env.CRM_ENGINE!=='v2') {res.status(503).json({status:'unavailable'});return;}
  const allowed=(process.env.LANDING_ALLOWED_ORIGINS??'').split(',').map(s=>s.trim()).filter(Boolean);
  if(!req.headers.origin || !allowed.includes(req.headers.origin)){res.status(403).json({status:'rejected'});return;}
  next();
});
landingRest.use(rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-7',legacyHeaders:false,message:{status:'rate_limited'}}));
landingRest.use(express.json({limit:'16kb'}));
landingRest.post('/',async(req,res)=>{
  const key=z.string().uuid().safeParse(req.get('Idempotency-Key'));
  const input=landingInput.safeParse(req.body);
  if(!req.is('application/json') || !key.success || !input.success){res.status(422).json({status:'rejected'});return;}
  try {
    const result=await saveLandingLead(key.data,input.data);
    res.status(result.replayed?200:201).json({status:result.status,receipt:result.receipt});
  } catch(error){
    if(error instanceof CaptureConflict){res.status(409).json({status:'conflict'});return;}
    // Never expose contact fields, SQL, or credentials in a public response/log.
    res.status(503).json({status:'unavailable'});
  }
});
landingRest.use((error:any,_req:express.Request,res:express.Response,next:express.NextFunction)=>{
  if(error?.type==='entity.too.large'){res.status(413).json({status:'rejected'});return;}
  if(error instanceof SyntaxError){res.status(400).json({status:'rejected'});return;}
  next(error);
});
