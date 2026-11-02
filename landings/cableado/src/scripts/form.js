import { confirmed, captureEvent } from './capture.mjs';
const form = document.querySelector('#lead-form');
const status = document.querySelector('#form-status');
const button = form.querySelector('button');
const seen = new Set();
let pending = null;
let busy = false;
let completed = false;
// Persist only the opaque retry key and receipt, never contact details.
const read = key => {try{return sessionStorage.getItem(key);}catch{return null;}};
const save = (key,value) => {try{sessionStorage.setItem(key,value);}catch{/* memory still deduplicates within this page */}};
const remove = key => {try{sessionStorage.removeItem(key);}catch{}};
if(read('iamet:last-receipt')) seen.add(read('iamet:last-receipt'));
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy || completed || !form.reportValidity()) return;
  if(form.dataset.enabled !== 'true') {status.textContent='Vista previa: todavía no está habilitada la recepción de solicitudes.'; return;}
  const fields = Object.fromEntries(new FormData(form));
  const attribution = {};
  if(window.iametAnalyticsConsent === true) {
    const params = new URLSearchParams(location.search);
    for(const [query,key] of Object.entries({utm_source:'utmSource',utm_medium:'utmMedium',utm_campaign:'utmCampaign',utm_term:'utmTerm',utm_content:'utmContent',gclid:'gclid',fbclid:'fbclid',msclkid:'msclkid'})) {const value=params.get(query);if(value) attribution[key]=value.slice(0,255);}
  }
  if(fields.website) {status.textContent='No se pudo enviar. Revisa los campos e inténtalo otra vez.';return;}
  // After uncertain reception, retry the identical payload and key.
  if(!pending) pending = {key:read('iamet:pending-key') || crypto.randomUUID(), body:{...fields,service:'cableado-fibra',landing:'cableado-tijuana',brand:'IAMET',...(Object.keys(attribution).length ? {attribution} : {})}};
  save('iamet:pending-key',pending.key);
  busy=true;button.disabled=true;status.textContent='Enviando tu solicitud…';
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),15000);
  try {
    const response = await fetch(form.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':pending.key},body:JSON.stringify(pending.body),signal:controller.signal,credentials:'omit'});
    const data = await response.json().catch(()=>null);
    if(!confirmed(response,data)) {
      if([400,403,413,422,429].includes(response.status)) {pending=null;remove('iamet:pending-key');status.textContent=response.status===429?'Demasiados intentos. Espera un momento antes de reintentar.':'La solicitud fue rechazada. Revisa tus datos y vuelve a intentar.';}
      else if(response.status===409) {status.textContent='Hay una solicitud anterior pendiente de confirmar. No generaremos otra automáticamente. Contacta por WhatsApp para verificar la recepción.';}
      else status.textContent='No pudimos confirmar la recepción. Reintenta sin cambiar los datos: se conservará la referencia para evitar duplicados.';
      return;
    }
    completed=true;remove('iamet:pending-key');
    status.textContent=`Recibimos tu solicitud. Referencia: ${data.receipt}. El equipo de IAMET revisará tu requerimiento.`;
    button.textContent='Solicitud recibida';
    // Analytics stays opt-in; no advertising tags or external trackers are loaded.
    if(window.iametAnalyticsConsent === true) captureEvent(data.receipt,seen,payload=>{window.dataLayer=window.dataLayer||[];window.dataLayer.push(payload);save('iamet:last-receipt',data.receipt);});
  } catch {
    status.textContent='Se perdió la conexión y no podemos confirmar la recepción. Reintenta sin cambiar los datos; conservaremos la misma referencia.';
  } finally {clearTimeout(timeout);busy=false;button.disabled=completed;}
});
document.querySelectorAll('[data-whatsapp]').forEach(link=>link.addEventListener('click',()=>{
  if(window.iametAnalyticsConsent===true){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'click_whatsapp',service:'cableado-fibra'});}
}));
